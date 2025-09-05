# Export System Analysis and Async Job Implementation Plan

## 1. DatabaseCleaner Transaction Conflict Analysis ✓

### Current State
The DatabaseCleaner concern in the TODO is **NOT a real issue**. The system already handles this correctly:

1. **Test Configuration** (`spec/rails_helper.rb`):
   - Export service tests use `:truncation` strategy instead of `:transaction` (lines 88-93)
   - This avoids the transaction conflict entirely
   - Tests revert to `:transaction` strategy after export tests complete

2. **BaseService Safety Check** (`app/services/export/base_service.rb:37`):
   ```ruby
   if !Rails.env.test? && ActiveRecord::Base.connection.transaction_open?
     raise ExportError, 'Cannot export during an open transaction'
   end
   ```
   - The check is explicitly skipped in test environment
   - This prevents false positives during testing

3. **Test Results**: All export service tests pass successfully

### Recommendation
**Remove this item from TODO** - The concern has been properly addressed.

## 2. Async Job Processing Feasibility Analysis

### Current Constraints

1. **Timeout Limits**:
   - Heroku router timeout: 30 seconds (hard limit)
   - Rack::Timeout configured: 25 seconds (gives 5s for cleanup)
   - Large exports could easily exceed this

2. **Current Implementation**:
   - Uses HTTP streaming to send data as it's generated
   - Memory checks prevent OOM errors (450MB limit)
   - Maximum 1,000,000 records per export
   - Already optimized with batching and streaming

3. **Infrastructure Gap**:
   - No background job processor installed (Sidekiq, DelayedJob, etc.)
   - Only bare Active Job framework available
   - No Redis or job queue infrastructure

### Why Async is Needed

1. **Large Dataset Risk**: With 1M record limit, exports could take minutes
2. **Heroku H12 Errors**: Requests exceeding 30s get killed
3. **User Experience**: Long waits with potential failures
4. **Resource Blocking**: Ties up web dynos during export

## 3. Implementation Plan for Async Exports

### Phase 1: Add Background Job Infrastructure

**Option A: Sidekiq (Recommended)**
```ruby
# Gemfile additions
gem 'sidekiq', '~> 7.2'
gem 'redis', '~> 5.0'

# For status tracking
gem 'sidekiq-status', '~> 3.0'
```

**Option B: DelayedJob (Simpler, Database-backed)**
```ruby
# Gemfile additions
gem 'delayed_job_active_record', '~> 4.1'
gem 'daemons' # for running workers
```

**Recommendation**: Sidekiq for scalability, DelayedJob for simplicity

### Phase 2: Create Export Job

```ruby
# app/jobs/export_job.rb
class ExportJob < ApplicationJob
  queue_as :exports

  def perform(export_id, user_id, format, fields, filters)
    export = Export.find(export_id)
    export.update!(status: 'processing')
    
    begin
      service = service_for_format(format).new(filters)
      
      # Generate export to temporary file or S3
      file_path = service.export_to_file(fields)
      
      # Store result
      export.update!(
        status: 'completed',
        file_path: file_path,
        completed_at: Time.current
      )
      
      # Notify user via email or webhook
      ExportMailer.completed(export, user_id).deliver_later
    rescue => e
      export.update!(
        status: 'failed',
        error_message: e.message
      )
      raise # Re-raise for retry logic
    end
  end
  
  private
  
  def service_for_format(format)
    case format
    when 'csv' then Export::CsvService
    when 'json' then Export::JsonService
    when 'jsonl' then Export::JsonlService
    when 'multi_csv' then Export::MultiCsvService
    else raise "Unknown format: #{format}"
    end
  end
end
```

### Phase 3: Export Status Tracking

```ruby
# app/models/export.rb
class Export < ApplicationRecord
  belongs_to :user, optional: true
  
  STATUSES = %w[pending processing completed failed expired].freeze
  
  validates :status, inclusion: { in: STATUSES }
  validates :format, presence: true
  
  scope :pending, -> { where(status: 'pending') }
  scope :completed, -> { where(status: 'completed') }
  
  def expired?
    completed_at && completed_at < 24.hours.ago
  end
end
```

### Phase 4: Migration for Exports Table

```ruby
class CreateExports < ActiveRecord::Migration[7.1]
  def change
    create_table :exports do |t|
      t.references :user, foreign_key: true
      t.string :status, null: false, default: 'pending'
      t.string :format, null: false
      t.json :filters
      t.json :fields
      t.string :file_path
      t.string :error_message
      t.datetime :completed_at
      t.string :job_id # For tracking Sidekiq job
      
      t.timestamps
    end
    
    add_index :exports, :status
    add_index :exports, [:user_id, :created_at]
  end
end
```

### Phase 5: Controller Updates

```ruby
# app/controllers/api/v1/exports_controller.rb
def create
  # For async exports
  export = Export.create!(
    user: current_user,
    format: params[:format_type] || 'csv',
    filters: build_filters(params),
    fields: parse_fields(params[:fields])
  )
  
  job_id = ExportJob.perform_later(
    export.id,
    current_user&.id,
    export.format,
    export.fields,
    export.filters
  ).job_id
  
  export.update!(job_id: job_id)
  
  render json: {
    export_id: export.id,
    status: 'pending',
    message: 'Export queued for processing',
    status_url: api_v1_export_status_url(export)
  }, status: :accepted
end

def status
  export = Export.find(params[:id])
  
  render json: {
    id: export.id,
    status: export.status,
    format: export.format,
    created_at: export.created_at,
    completed_at: export.completed_at,
    download_url: export.status == 'completed' ? download_url(export) : nil,
    error_message: export.error_message
  }
end

def download
  export = Export.find(params[:id])
  
  if export.status != 'completed'
    return render json: { error: 'Export not ready' }, status: :unprocessable_entity
  end
  
  if export.expired?
    return render json: { error: 'Export expired' }, status: :gone
  end
  
  # Stream file from storage
  send_file export.file_path, 
    type: content_type_for(export.format),
    disposition: 'attachment'
end
```

### Phase 6: Storage Strategy

**Option A: Local Filesystem (Development/Small Scale)**
```ruby
# Store in tmp/exports/
Rails.root.join('tmp', 'exports', "#{export.id}.#{format}")
```

**Option B: S3 (Production/Scalable)**
```ruby
# Use Active Storage or direct S3 upload
gem 'aws-sdk-s3', '~> 1.0'
```

### Phase 7: Cleanup Job

```ruby
# app/jobs/export_cleanup_job.rb
class ExportCleanupJob < ApplicationJob
  queue_as :low
  
  def perform
    Export.where('completed_at < ?', 24.hours.ago).find_each do |export|
      # Delete file from storage
      File.delete(export.file_path) if File.exist?(export.file_path)
      
      # Update status
      export.update!(status: 'expired')
    end
  end
end
```

## 4. Implementation Priority

### Immediate (Hybrid Approach)
Keep streaming for small exports, add async for large ones:

```ruby
def export
  estimated_size = estimate_export_size(filters)
  
  if estimated_size > ASYNC_THRESHOLD # e.g., 50,000 records
    create_async_export
  else
    stream_export # Current implementation
  end
end
```

### Configuration
```ruby
# config/application.rb or environment-specific
ASYNC_THRESHOLD = ENV.fetch('EXPORT_ASYNC_THRESHOLD', 50_000).to_i
EXPORT_TIMEOUT = ENV.fetch('EXPORT_TIMEOUT_SECONDS', 20).to_i
```

## 5. Benefits of Async Implementation

1. **No timeout issues** - Jobs can run for minutes/hours
2. **Better UX** - Users can close browser and return later
3. **Retry logic** - Failed exports can be retried automatically
4. **Resource efficiency** - Web dynos freed immediately
5. **Scalability** - Can process multiple exports in parallel
6. **Monitoring** - Better visibility into export status and failures

## 6. Migration Path

1. **Phase 1**: Add job infrastructure (1-2 days)
2. **Phase 2**: Implement async for largest exports only (1 day)
3. **Phase 3**: Add status tracking UI (1 day)
4. **Phase 4**: Migrate all exports to async optionally (1 day)
5. **Phase 5**: Add cleanup and monitoring (1 day)

## 7. Alternative: Quick Fix Without Background Jobs

If adding background job infrastructure is too heavy, consider:

1. **Increase timeout** (limited by Heroku's 30s)
2. **Add pagination to exports** - Export in chunks via multiple requests
3. **Pre-generate common exports** - Cache popular date ranges
4. **Webhook callbacks** - Start export, notify when complete

## Recommendation Summary

1. **DatabaseCleaner**: No action needed, already handled correctly
2. **Async Jobs**: Implement Sidekiq-based async exports for large datasets
3. **Priority**: High - prevents production timeout failures
4. **Effort**: 3-5 days for full implementation
5. **Quick win**: Start with hybrid approach (async only for large exports)