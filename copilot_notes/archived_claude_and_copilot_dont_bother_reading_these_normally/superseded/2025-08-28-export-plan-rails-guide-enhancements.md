# Export Plan Enhancements from Official Rails Guides
*Generated: 2025-08-28*
*Based on Rails 7.1+ official documentation via load_guide tool*

## Executive Summary
After reviewing official Rails guides (API-only apps, Active Job, and more), here are critical enhancements for our multi-format export system that leverage Rails 7.1 best practices.

## 1. Active Job Background Processing (from active_job_basics guide)

### Current Gap: No Background Job Processing
The export plan processes everything synchronously, which will timeout on Heroku (30 second limit) for large exports.

### Enhancement: Async Export with Active Job

```ruby
# app/jobs/export_measurements_job.rb
class ExportMeasurementsJob < ApplicationJob
  queue_as :exports
  
  # Use Solid Queue's concurrency controls to prevent multiple exports
  limits_concurrency to: 2, key: ->(user_id, format) { "export:#{user_id}:#{format}" }, 
                     duration: 10.minutes
  
  # Retry on transient failures with exponential backoff
  retry_on ActiveRecord::ConnectionTimeoutError, wait: :exponentially_longer, attempts: 3
  retry_on Net::OpenTimeout, wait: 5.seconds, attempts: 3
  
  # Discard if data is corrupted
  discard_on ActiveJob::DeserializationError
  
  def perform(user_id, format, filters = {})
    user = User.find(user_id)
    
    # Generate export based on format
    file_path = case format
    when 'jsonl'
      JsonlExportService.new.export_to_file(filters)
    when 'csv'
      DenormalizedCsvExportService.new.export_to_file(filters)
    when 'multi_csv'
      MultiCsvExportService.new.export_to_archive(filters)
    when 'postgresql'
      PostgresqlDumpService.new.export_dump(filters)
    end
    
    # Upload to S3 or temporary storage
    upload_url = upload_to_storage(file_path)
    
    # Notify user with download link
    ExportMailer.with(user: user, url: upload_url).export_ready.deliver_later
  ensure
    # Clean up temporary file
    File.delete(file_path) if file_path && File.exist?(file_path)
  end
  
  private
  
  def upload_to_storage(file_path)
    # Upload to S3 with expiring URL
    s3_key = "exports/#{SecureRandom.uuid}/#{File.basename(file_path)}"
    S3_BUCKET.object(s3_key).upload_file(file_path)
    S3_BUCKET.object(s3_key).presigned_url(:get, expires_in: 24.hours)
  end
end
```

### Enqueuing Exports

```ruby
# app/controllers/api/v1/exports_controller.rb
class Api::V1::ExportsController < ApplicationController
  include ActionController::Live  # For streaming support
  
  def create
    format = params[:format] || 'jsonl'
    
    if params[:async]
      # For large exports, use background job
      job = ExportMeasurementsJob.perform_later(
        current_user.id, 
        format, 
        export_filters
      )
      
      render json: { 
        message: "Export queued", 
        job_id: job.job_id,
        status_url: export_status_url(job.job_id)
      }, status: :accepted
    else
      # For small exports, stream directly
      stream_export(format)
    end
  end
  
  private
  
  def stream_export(format)
    response.headers['Content-Type'] = content_type_for(format)
    response.headers['Content-Disposition'] = "attachment; filename=\"export.#{format}\""
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no' # For nginx
    
    response.stream.write begin
      case format
      when 'jsonl'
        stream_jsonl_export
      when 'csv'
        stream_csv_export
      else
        raise ArgumentError, "Unsupported format: #{format}"
      end
    ensure
      response.stream.close
    end
  end
end
```

## 2. Memory-Efficient Streaming (from API guide)

### Current Gap: Loading All Data into Memory
The current plan uses `find_each` but doesn't properly stream responses.

### Enhancement: ActionController::Live Streaming

```ruby
# app/controllers/concerns/streamable_export.rb
module StreamableExport
  extend ActiveSupport::Concern
  
  included do
    include ActionController::Live
  end
  
  def stream_jsonl_export
    measurements_query.find_each(batch_size: 500) do |measurement|
      line = build_measurement_json(measurement).to_json + "\n"
      response.stream.write(line)
      
      # Flush periodically to prevent buffering
      response.stream.flush if Random.rand < 0.1
    end
  ensure
    response.stream.close
  end
  
  def stream_csv_export
    # Write CSV headers
    response.stream.write(csv_headers.join(',') + "\n")
    
    measurements_query.find_each(batch_size: 500) do |measurement|
      row = build_csv_row(measurement)
      response.stream.write(row.to_csv)
      
      # Yield control periodically to prevent blocking
      sleep(0.001) if Random.rand < 0.01
    end
  ensure
    response.stream.close
  end
  
  private
  
  def measurements_query
    # Use includes to prevent N+1
    Measurement
      .includes(:device, :extra_measurement_info, sub_location: :place)
      .where(created_at: 30.days.ago..Time.current)
  end
end
```

## 3. API Security Enhancements (from API guide)

### Current Gap: No Rate Limiting or Request Validation
Exports could be abused without proper controls.

### Enhancement: Rate Limiting and Authentication

```ruby
# app/controllers/api/v1/exports_controller.rb
class Api::V1::ExportsController < ApplicationController
  before_action :authenticate_api_request
  before_action :rate_limit_exports
  
  # Use stale? for HTTP caching
  def show
    @export = Export.find(params[:id])
    
    if stale?(last_modified: @export.updated_at, public: false)
      render json: @export
    end
  end
  
  private
  
  def rate_limit_exports
    cache_key = "export_rate_limit:#{current_user.id}"
    count = Rails.cache.increment(cache_key, 1, expires_in: 1.hour)
    
    if count > 10  # 10 exports per hour
      render json: { 
        error: 'Rate limit exceeded. Maximum 10 exports per hour.' 
      }, status: :too_many_requests
    end
  end
  
  def authenticate_api_request
    authenticate_or_request_with_http_token do |token, options|
      User.find_by(api_token: token)
    end
  end
end
```

## 4. Optimized Database Queries (from Active Record guides)

### Current Gap: Inefficient Queries
The plan doesn't optimize for PostgreSQL-specific features.

### Enhancement: PostgreSQL COPY Optimization

```ruby
# app/services/postgresql_export_service.rb
class PostgresqlExportService
  def export_with_copy(output_path, filters = {})
    query = build_optimized_query(filters)
    
    # Use COPY for maximum performance
    sql = <<~SQL
      COPY (
        #{query.to_sql}
      ) TO STDOUT WITH (
        FORMAT CSV,
        HEADER true,
        DELIMITER ',',
        NULL '',
        QUOTE '"',
        ESCAPE '\\',
        ENCODING 'UTF8'
      )
    SQL
    
    File.open(output_path, 'w') do |file|
      raw_connection.copy_data(sql) do
        while row = raw_connection.get_copy_data
          file.write(row)
        end
      end
    end
  end
  
  private
  
  def build_optimized_query(filters)
    Measurement
      .select(<<~SQL)
        measurements.id,
        measurements.co2ppm,
        measurements.measurementtime,
        measurements.crowding,
        places.place_lat as lat,
        places.place_lng as lng,
        sub_locations.description as place_name,
        places.google_place_id,
        devices.serial as device_serial,
        device_models.name as device_model,
        manufacturers.name as manufacturer
      SQL
      .joins(<<~SQL)
        LEFT JOIN sub_locations ON measurements.sub_location_id = sub_locations.id
        LEFT JOIN places ON sub_locations.place_id = places.id
        LEFT JOIN devices ON measurements.device_id = devices.id
        LEFT JOIN device_models ON devices.model_id = device_models.id
        LEFT JOIN manufacturers ON device_models.manufacturer_id = manufacturers.id
      SQL
      .where(filters)
  end
  
  def raw_connection
    ActiveRecord::Base.connection.raw_connection
  end
end
```

## 5. Middleware Configuration (from API guide)

### Current Gap: Unnecessary Middleware
API-only apps should remove browser-specific middleware.

### Enhancement: Optimized Middleware Stack

```ruby
# config/application.rb
module CovidCo2Tracker
  class Application < Rails::Application
    config.api_only = true
    
    # Add only necessary middleware for exports
    config.middleware.use Rack::Sendfile  # For X-Sendfile support
    config.middleware.use Rack::ETag      # For HTTP caching
    config.middleware.use Rack::ConditionalGet  # For conditional requests
    
    # Configure Rack::Sendfile for nginx
    config.action_dispatch.x_sendfile_header = "X-Accel-Redirect"
  end
end
```

## 6. Error Handling with Active Job (from Active Job guide)

### Current Gap: No Retry or Error Recovery
Failed exports leave users hanging.

### Enhancement: Robust Error Handling

```ruby
# app/jobs/export_measurements_job.rb
class ExportMeasurementsJob < ApplicationJob
  include ActiveJob::Status  # Track job progress
  
  rescue_from StandardError do |exception|
    # Report to error tracking
    Rails.error.report(exception, {
      user_id: arguments[0],
      format: arguments[1]
    })
    
    # Notify user of failure
    user = User.find(arguments[0])
    ExportMailer.with(user: user, error: exception.message)
                .export_failed
                .deliver_later
    
    # Re-raise to trigger retry
    raise exception
  end
  
  rescue_from ActiveRecord::RecordNotFound do |exception|
    # Don't retry if user doesn't exist
    discard_job(exception)
  end
  
  around_perform do |job, block|
    # Track timing
    start_time = Time.current
    
    block.call
    
    # Log success metrics
    duration = Time.current - start_time
    Rails.logger.info "[ExportJob] Completed in #{duration.round(2)}s"
    
    # Update progress
    progress.finish!
  end
end
```

## 7. Testing Exports (from Testing guide)

### Current Gap: No Test Coverage
Export functionality needs comprehensive testing.

### Enhancement: Active Job Test Helpers

```ruby
# test/jobs/export_measurements_job_test.rb
require 'test_helper'

class ExportMeasurementsJobTest < ActiveJob::TestCase
  test "enqueues export job" do
    assert_enqueued_with(job: ExportMeasurementsJob) do
      ExportMeasurementsJob.perform_later(users(:one).id, 'jsonl')
    end
  end
  
  test "handles large datasets efficiently" do
    # Create 10,000 test measurements
    measurements = create_list(:measurement, 10_000)
    
    perform_enqueued_jobs do
      ExportMeasurementsJob.perform_later(users(:one).id, 'csv')
    end
    
    assert_performed_jobs 1
    # Verify export was created and uploaded
  end
  
  test "retries on connection timeout" do
    ActiveRecord::Base.connection.stub(:execute, -> { raise ActiveRecord::ConnectionTimeoutError }) do
      assert_performed_jobs 3 do  # Should retry 3 times
        ExportMeasurementsJob.perform_later(users(:one).id, 'jsonl')
      end
    end
  end
end
```

## 8. Performance Monitoring (from Rails guides)

### Enhancement: Instrumentation

```ruby
# app/services/export_instrumentation.rb
module ExportInstrumentation
  extend ActiveSupport::Concern
  
  included do
    around_action :instrument_export
  end
  
  private
  
  def instrument_export
    ActiveSupport::Notifications.instrument('export.measurements', {
      format: params[:format],
      user_id: current_user.id,
      filters: export_filters
    }) do
      yield
    end
  end
end

# config/initializers/notifications.rb
ActiveSupport::Notifications.subscribe('export.measurements') do |*args|
  event = ActiveSupport::Notifications::Event.new(*args)
  
  Rails.logger.info "[Export] Format: #{event.payload[:format]}, Duration: #{event.duration}ms"
  
  # Send to metrics service
  StatsD.histogram('exports.duration', event.duration, tags: ["format:#{event.payload[:format]}"])
end
```

## 9. Bulk Export Optimization (from Active Job guide)

### Enhancement: Bulk Enqueuing

```ruby
# app/controllers/api/v1/bulk_exports_controller.rb
class Api::V1::BulkExportsController < ApplicationController
  def create
    venues = Place.where(id: params[:venue_ids])
    
    # Create export jobs for each venue
    export_jobs = venues.map do |venue|
      ExportVenueMeasurementsJob.new(venue.id, current_user.id)
                                 .set(queue: :bulk_exports)
    end
    
    # Enqueue all at once (uses Solid Queue's bulk enqueue)
    ActiveJob.perform_all_later(export_jobs)
    
    render json: { 
      message: "Enqueued #{export_jobs.size} venue exports" 
    }, status: :accepted
  end
end
```

## 10. Implementation Checklist

### Immediate (1 hour)
- [ ] Add Active Job configuration for exports
- [ ] Create ExportMeasurementsJob with retry logic
- [ ] Add rate limiting to exports controller

### Short-term (2-4 hours)
- [ ] Implement ActionController::Live streaming
- [ ] Add PostgreSQL COPY optimization
- [ ] Create export status endpoint

### Medium-term (1 day)
- [ ] Add S3 integration for file storage
- [ ] Implement export progress tracking
- [ ] Add comprehensive test coverage

### Long-term (2-3 days)
- [ ] Add export scheduling (recurring exports)
- [ ] Implement export templates
- [ ] Add data transformation options

## Key Takeaways

1. **Use Active Job**: Background processing prevents timeouts
2. **Stream responses**: ActionController::Live prevents memory issues
3. **Optimize queries**: PostgreSQL COPY is 10x faster
4. **Add rate limiting**: Prevent export abuse
5. **Handle errors gracefully**: Retry transient failures
6. **Test thoroughly**: Use Active Job test helpers
7. **Monitor performance**: Add instrumentation
8. **Use bulk operations**: Leverage Solid Queue's bulk enqueue

These enhancements transform the export system from a basic implementation to a production-ready, scalable solution that handles Heroku's constraints while providing excellent user experience.