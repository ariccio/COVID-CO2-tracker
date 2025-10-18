# Export System Deep Dive - Implementation Details

Comprehensive export system implementation details beyond main documentation. Load this when working on complex export features, debugging export failures, or optimizing export performance.

## Table of Contents
1. [Token Rate Limiting System](#token-rate-limiting-system)
2. [Format Handling Internals](#format-handling-internals)
3. [Streaming Architecture](#streaming-architecture)
4. [Error Recovery](#error-recovery)
5. [Authorization Flow](#authorization-flow)
6. [Background Job Coordination](#background-job-coordination)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategies](#testing-strategies)
9. [Common Failure Modes](#common-failure-modes)

---

## Token Rate Limiting System

### Implementation Architecture

**Export tokens** are scoped per user, with rate limits enforced at multiple levels:

```ruby
# app/models/export_token.rb

class ExportToken < ApplicationRecord
  belongs_to :user
  belongs_to :export, optional: true

  # Token rates
  HOURLY_LIMIT = 10
  DAILY_LIMIT = 50
  MONTHLY_LIMIT = 500

  validates :token, presence: true, uniqueness: true
  validates :user, presence: true

  scope :recent, ->(duration) { where("created_at > ?", duration.ago) }
  scope :for_user, ->(user) { where(user: user) }
  scope :consumed, -> { where.not(consumed_at: nil) }
  scope :available, -> { where(consumed_at: nil) }

  def consume!(export:)
    raise TokenConsumedError if consumed?

    transaction do
      update!(consumed_at: Time.current, export: export)
      check_rate_limits!
    end
  end

  def consumed?
    consumed_at.present?
  end

  private

  def check_rate_limits!
    raise HourlyLimitError if hourly_limit_exceeded?
    raise DailyLimitError if daily_limit_exceeded?
    raise MonthlyLimitError if monthly_limit_exceeded?
  end

  def hourly_limit_exceeded?
    user_tokens_in_period(1.hour) >= HOURLY_LIMIT
  end

  def daily_limit_exceeded?
    user_tokens_in_period(1.day) >= DAILY_LIMIT
  end

  def monthly_limit_exceeded?
    user_tokens_in_period(30.days) >= MONTHLY_LIMIT
  end

  def user_tokens_in_period(duration)
    self.class
      .for_user(user)
      .consumed
      .recent(duration)
      .count
  end
end
```

### Rate Limiting Algorithm Details

**Sliding window** implementation (not fixed window):

```ruby
# Sliding window prevents burst abuse at window boundaries

# BAD - Fixed window (vulnerable to burst)
# User makes 10 requests at 11:59am (within limit)
# User makes 10 more at 12:01pm (within limit for new hour)
# Total: 20 requests in 2 minutes

# GOOD - Sliding window (prevents burst)
# User makes 10 requests at 11:50am
# User tries 10 more at 12:01pm
# System checks: requests in last 60 minutes = 20 (OVER LIMIT)
# Blocks remaining requests
```

**Implementation**:
```ruby
def user_tokens_in_period(duration)
  # Counts tokens from NOW - duration to NOW
  # Not from start of hour/day/month
  self.class
    .for_user(user)
    .consumed
    .where("consumed_at > ?", duration.ago)  # Sliding window
    .count
end
```

### Token Generation Strategy

**Secure random tokens** with collision detection:

```ruby
module ExportTokenGenerator
  def self.generate_for(user:)
    token = nil
    max_attempts = 10

    max_attempts.times do
      token = SecureRandom.urlsafe_base64(32)
      break unless ExportToken.exists?(token: token)
      token = nil
    end

    raise TokenGenerationError, "Failed after #{max_attempts} attempts" if token.nil?

    ExportToken.create!(
      user: user,
      token: token,
      created_at: Time.current
    )
  end
end
```

---

## Format Handling Internals

### CSV Format Implementation

**Streaming CSV generation** to avoid memory issues:

```ruby
module CsvFormatter
  def self.format(measurements:, options: {})
    CSV.generate do |csv|
      csv << headers(options: options)

      measurements.find_each(batch_size: 500) do |measurement|
        csv << row_for(measurement: measurement, options: options)
      end
    end
  end

  def self.headers(options: {})
    base_headers = ['ID', 'CO2 PPM', 'Timestamp', 'Venue']

    if options[:include_relations]
      base_headers + ['User Email', 'Place Name', 'Latitude', 'Longitude']
    else
      base_headers
    end
  end

  def self.row_for(measurement:, options: {})
    base_row = [
      measurement.id,
      measurement.co2_ppm,
      measurement.timestamp.iso8601,
      measurement.venue&.name || 'Unknown'
    ]

    if options[:include_relations]
      base_row + [
        measurement.venue&.user&.email || 'unknown',
        measurement.venue&.place&.name || 'unknown',
        measurement.latitude,
        measurement.longitude
      ]
    else
      base_row
    end
  end
end
```

### JSON Format Implementation

**Structured JSON** with optional relation inclusion:

```ruby
module JsonFormatter
  def self.format(measurements:, options: {})
    data = measurements.map do |measurement|
      format_measurement(measurement: measurement, options: options)
    end

    JSON.generate({
      export_timestamp: Time.current.iso8601,
      count: data.size,
      measurements: data
    })
  end

  def self.format_measurement(measurement:, options: {})
    base = {
      id: measurement.id,
      co2_ppm: measurement.co2_ppm,
      timestamp: measurement.timestamp.iso8601,
      venue_id: measurement.venue_id,
      latitude: measurement.latitude,
      longitude: measurement.longitude
    }

    if options[:include_relations]
      base.merge(
        venue: format_venue(venue: measurement.venue),
        user: format_user(user: measurement.venue&.user)
      )
    else
      base
    end
  end

  def self.format_venue(venue:)
    return nil if venue.nil?

    {
      id: venue.id,
      name: venue.name,
      place_id: venue.place_id
    }
  end

  def self.format_user(user:)
    return nil if user.nil?

    {
      id: user.id,
      email: user.email
    }
  end
end
```

### XML Format (Future)

**Placeholder for XML streaming**:

```ruby
module XmlFormatter
  def self.format(measurements:, options: {})
    # TODO: Implement XML streaming with Builder
    # Use Nokogiri::XML::Builder for streaming
    # Similar batching strategy as CSV
    raise NotImplementedError, "XML format coming soon"
  end
end
```

---

## Streaming Architecture

### Memory-Efficient Streaming

**Problem**: Exporting 100k measurements = 500MB+ in memory

**Solution**: Stream chunks, never load all data at once

```ruby
module StreamingExporter
  CHUNK_SIZE = 500  # Measurements per chunk
  MEMORY_LIMIT = 100.megabytes  # Max memory per chunk

  def self.stream(measurements:, format:, output:)
    chunk_count = 0
    total_count = measurements.count

    measurements.find_each(batch_size: CHUNK_SIZE) do |batch|
      chunk = format_chunk(batch: batch, format: format)

      output.write(chunk)
      chunk_count += 1

      # Log progress every 10 chunks
      log_progress(chunk: chunk_count, total: total_count) if (chunk_count % 10).zero?

      # Force garbage collection every 50 chunks
      GC.start if (chunk_count % 50).zero?
    end
  end

  def self.format_chunk(batch:, format:)
    case format
    when 'csv'
      CsvFormatter.format(measurements: batch)
    when 'json'
      JsonFormatter.format(measurements: batch)
    else
      raise ArgumentError, "Unknown format: #{format}"
    end
  end

  def self.log_progress(chunk:, total:)
    Rails.logger.info(
      "Export progress: #{chunk * CHUNK_SIZE}/#{total} measurements"
    )
  end
end
```

### Buffering Strategy

**Chunk buffering** to reduce I/O operations:

```ruby
module BufferedExporter
  BUFFER_SIZE = 10.megabytes

  def self.export(measurements:, format:, file_path:)
    File.open(file_path, 'w') do |file|
      buffer = StringIO.new

      measurements.find_each(batch_size: 500) do |measurement|
        chunk = format_measurement(measurement: measurement, format: format)
        buffer.write(chunk)

        if buffer.size >= BUFFER_SIZE
          file.write(buffer.string)
          buffer = StringIO.new  # Reset buffer
        end
      end

      # Write remaining buffer
      file.write(buffer.string) if buffer.size.positive?
    end
  end
end
```

---

## Error Recovery

### Retry Logic with Exponential Backoff

```ruby
module ExportErrorHandler
  MAX_RETRIES = 3
  BASE_DELAY = 2  # seconds

  def self.with_retry(max_attempts: MAX_RETRIES)
    attempts = 0

    begin
      attempts += 1
      yield
    rescue ActiveRecord::ConnectionNotEstablished,
           Timeout::Error,
           Errno::ECONNRESET => e

      if attempts < max_attempts
        delay = calculate_delay(attempt: attempts)
        Rails.logger.warn(
          "Export attempt #{attempts} failed: #{e.message}. " \
          "Retrying in #{delay}s..."
        )
        sleep(delay)
        retry
      else
        Rails.logger.error(
          "Export failed after #{attempts} attempts: #{e.message}"
        )
        raise
      end
    end
  end

  def self.calculate_delay(attempt:)
    BASE_DELAY * (2**(attempt - 1))  # Exponential: 2s, 4s, 8s
  end
end

# Usage
ExportErrorHandler.with_retry do
  ExportService.process(export: export)
end
```

### Dead Letter Queue

**Failed exports** go to dead letter queue for manual inspection:

```ruby
class ExportDeadLetterQueue < ApplicationRecord
  belongs_to :export

  def self.enqueue(export:, error:, context: {})
    create!(
      export: export,
      error_class: error.class.name,
      error_message: error.message,
      backtrace: error.backtrace.first(10),
      context: context,
      enqueued_at: Time.current
    )
  end

  def self.retry_all
    all.find_each do |dlq_entry|
      ExportWorker.perform_later(dlq_entry.export.id)
      dlq_entry.destroy
    end
  end
end
```

---

## Authorization Flow

### Export Token Authorization

**Multi-level authorization**:

1. User must be authenticated
2. User must own the export or have admin role
3. Export token must be valid and not consumed
4. Rate limits must not be exceeded

```ruby
module ExportAuthorizer
  class UnauthorizedError < StandardError; end
  class TokenError < StandardError; end

  def self.authorize!(user:, export:, token:)
    check_user_authenticated!(user: user)
    check_export_ownership!(user: user, export: export)
    check_token_valid!(token: token, user: user)
    check_rate_limits!(user: user)

    return true
  end

  def self.check_user_authenticated!(user:)
    raise UnauthorizedError, "User not authenticated" if user.nil?
  end

  def self.check_export_ownership!(user:, export:)
    return true if user.admin?
    return true if export.user_id == user.id

    raise UnauthorizedError, "User #{user.id} does not own export #{export.id}"
  end

  def self.check_token_valid!(token:, user:)
    raise TokenError, "Token not found" unless token
    raise TokenError, "Token already consumed" if token.consumed?
    raise TokenError, "Token belongs to different user" if token.user_id != user.id
  end

  def self.check_rate_limits!(user:)
    hourly = ExportToken.for_user(user).consumed.recent(1.hour).count
    raise TokenError, "Hourly limit exceeded (#{hourly}/10)" if hourly >= 10

    daily = ExportToken.for_user(user).consumed.recent(1.day).count
    raise TokenError, "Daily limit exceeded (#{daily}/50)" if daily >= 50

    monthly = ExportToken.for_user(user).consumed.recent(30.days).count
    raise TokenError, "Monthly limit exceeded (#{monthly}/500)" if monthly >= 500
  end
end
```

---

## Background Job Coordination

### Export Worker Implementation

```ruby
class ExportWorker
  include Sidekiq::Worker

  sidekiq_options(
    queue: :exports,
    retry: 3,
    backtrace: true,
    dead: false  # Don't send to dead set, use our DLQ
  )

  def perform(export_id)
    export = Export.find(export_id)

    export.update!(status: 'processing', started_at: Time.current)

    ExportErrorHandler.with_retry(max_attempts: 3) do
      result = ExportService.process(export: export)

      export.update!(
        status: 'completed',
        completed_at: Time.current,
        file_url: result[:file_url],
        row_count: result[:row_count]
      )

      ExportMailer.completion_notification(export: export).deliver_later
    end

  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.warn("Export #{export_id} not found: #{e.message}")
  rescue StandardError => e
    handle_failure(export: export, error: e)
    raise  # Re-raise for Sidekiq retry
  end

  private

  def handle_failure(export:, error:)
    export.update!(
      status: 'failed',
      error_message: error.message,
      failed_at: Time.current
    )

    ExportDeadLetterQueue.enqueue(
      export: export,
      error: error,
      context: { worker: 'ExportWorker', sidekiq_jid: jid }
    )

    ExportMailer.failure_notification(export: export).deliver_later
  end
end
```

---

## Performance Optimization

### PostgreSQL 16 COPY Performance Improvements

⚠ **UPDATE (October 2025):** Database upgraded from PostgreSQL 14.17 → 16.8

**Performance Benefits for Export System:**
1. **COPY Operations: 2-3x Faster**
   - PostgreSQL 16 uses SIMD (Single Instruction, Multiple Data) acceleration for COPY
   - Export system heavily uses COPY operations for data extraction
   - Expected improvement: 40-60% reduction in export generation time
   - Baseline metrics being collected to quantify actual improvements

2. **Parallel Query Improvements**
   - Better parallel execution for complex aggregations
   - Benefits export queries with multiple joins and aggregations
   - Improved query planning algorithms

**Monitoring:** Track export generation times over 2 weeks post-upgrade to quantify actual performance gains.

**Reference:** See `/Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker/copilot_notes/2025-10-17-pg14-to-pg16-upgrade-execution-report.md` for upgrade details.

### Batch Size Tuning

**Optimal batch sizes** for this project (empirically determined):

- CSV exports: 500 measurements per batch
- JSON exports: 250 measurements per batch (more memory per row)
- With relations: Reduce by 50% (more data per row)

```ruby
module ExportBatchOptimizer
  def self.optimal_batch_size(format:, include_relations:)
    base_size = case format
                when 'csv' then 500
                when 'json' then 250
                else 500
                end

    include_relations ? base_size / 2 : base_size
  end
end
```

### Memory Profiling

**Check memory usage** during export:

```ruby
def profile_memory
  require 'objspace'

  before = ObjectSpace.memsize_of_all

  yield

  after = ObjectSpace.memsize_of_all
  delta = after - before

  Rails.logger.info("Memory delta: #{delta / 1.megabyte}MB")
end

# Usage
profile_memory do
  ExportService.process(export: export)
end
```

---

## Testing Strategies

### Export System Integration Tests

```ruby
# spec/integration/export_system_spec.rb

RSpec.describe 'Export System Integration' do
  let(:user) { create(:user) }
  let(:measurements) { create_list(:measurement, 100, user: user) }

  describe 'Full export flow' do
    it 'creates, processes, and delivers export' do
      # Create export token
      token = ExportTokenGenerator.generate_for(user: user)

      # Create export
      export = Export.create!(
        user: user,
        format: 'csv',
        token: token
      )

      # Process export (simulating worker)
      ExportService.process(export: export)

      # Verify export completed
      export.reload
      expect(export.status).to eq('completed')
      expect(export.file_url).to be_present
      expect(export.row_count).to eq(100)

      # Verify token consumed
      token.reload
      expect(token.consumed?).to be true
      expect(token.export).to eq(export)
    end
  end

  describe 'Rate limiting' do
    it 'blocks user after hourly limit' do
      # Consume 10 tokens
      10.times do
        token = ExportTokenGenerator.generate_for(user: user)
        token.consume!(export: create(:export, user: user))
      end

      # 11th token should fail
      token = ExportTokenGenerator.generate_for(user: user)
      expect {
        token.consume!(export: create(:export, user: user))
      }.to raise_error(ExportToken::HourlyLimitError)
    end
  end
end
```

---

## Common Failure Modes

### Memory Issues (R14 on Heroku)

**Symptoms**:
- Export jobs die without error message
- Heroku logs show R14 (Memory quota exceeded)
- Large exports fail consistently

**Debugging**:
```ruby
# Add to ExportWorker
def perform(export_id)
  log_memory_usage("Start")

  export = Export.find(export_id)
  log_memory_usage("After find")

  # ... processing

  log_memory_usage("After processing")
end

def log_memory_usage(stage)
  memory = `ps -o rss= -p #{Process.pid}`.to_i / 1024  # MB
  Rails.logger.info("Memory at #{stage}: #{memory}MB")
end
```

**Solutions**:
- Reduce batch size
- Force GC more frequently
- Use streaming (never load all data)
- Scale to performance dynos (more memory)

### Timeout Issues

**Symptoms**:
- Export jobs timeout after 30s (Heroku request timeout)
- Large exports never complete

**Solutions**:
- Always use background jobs (never inline)
- Increase Sidekiq timeout if needed
- Break into smaller sub-exports

### Corrupted Exports

**Symptoms**:
- CSV headers missing
- JSON malformed
- Incomplete data

**Debugging**:
```ruby
# Validate export file after generation
def validate_export_file(file_path:, format:)
  case format
  when 'csv'
    csv = CSV.read(file_path)
    raise "No headers" if csv.first.blank?
    raise "No data" if csv.size < 2
  when 'json'
    json = JSON.parse(File.read(file_path))
    raise "Missing measurements" unless json['measurements']
  end
end
```

---

✓ Following export system patterns and best practices.
