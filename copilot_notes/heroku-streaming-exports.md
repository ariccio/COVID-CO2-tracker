# Streaming Operations Guide
*ActionController::Live on Heroku - COVID CO2 Tracker*

## Critical Heroku Streaming Constraints

**Heroku Router Timeouts**:
- **Initial Response**: Must send first byte within 30 seconds
- **Rolling Timeout**: Must send data every 55 seconds
- **No WebSocket Sticky Sessions**: Each request can hit different dyno
- **Nginx Buffering**: Must be explicitly disabled

**Memory Constraints**:
- Streaming requests consume additional memory
- Each concurrent stream adds ~50MB memory usage
- Must use batching to prevent R14 errors

## Essential Streaming Headers

**MANDATORY Headers** (copy-paste into all streaming controllers):
```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  def stream_data
    # CRITICAL: These headers prevent buffering and timeouts
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['X-Accel-Buffering'] = 'no'        # Nginx directive
    response.headers['Cache-Control'] = 'no-cache'      # Prevent proxy caching
    response.headers['Connection'] = 'keep-alive'       # Maintain connection
    
    # For ZIP downloads specifically
    response.headers['Content-Disposition'] = 'attachment; filename="export.zip"'
    
    # Start streaming...
  end
end
```

## ZIP Streaming Without Memory Exhaustion

**Using zip_tricks gem** (recommended approach):
```ruby
# Gemfile
gem 'zip_tricks'

class ExportsController < ApplicationController
  include ActionController::Live
  
  def download_all_readings
    # Set headers for ZIP download
    response.headers['Content-Type'] = 'application/zip'
    response.headers['Content-Disposition'] = 'attachment; filename="co2_readings.zip"'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    # Create streaming ZIP writer
    zip_stream = ZipTricks::Streamer.new(response.stream)
    
    begin
      # Process readings in batches to control memory
      Co2Reading.find_in_batches(batch_size: 1000) do |batch|
        batch.each do |reading|
          # Add each reading as individual file
          zip_stream.write_deflated_file("reading_#{reading.id}.json") do |writer|
            writer << reading.to_json
          end
        end
        
        # CRITICAL: Force GC between batches
        GC.start if batch.size == 1000
      end
      
    rescue IOError
      # Client disconnected - normal for streaming
      Rails.logger.info "Client disconnected from ZIP stream"
    ensure
      zip_stream.close
      response.stream.close
    end
  end
end
```

## Heartbeat Mechanism (Prevents H12 Timeouts)

**For long-running streams**:
```ruby
class DataStreamController < ApplicationController
  include ActionController::Live
  
  def live_co2_feed
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    begin
      loop do
        # Send actual data
        latest_readings = Co2Reading.latest_batch
        response.stream.write "data: #{latest_readings.to_json}\n\n"
        
        # Wait 20 seconds (well under 55-second timeout)
        sleep 20
        
        # Send heartbeat if no data to send
        if latest_readings.empty?
          response.stream.write "data: {\"heartbeat\": #{Time.current.to_i}}\n\n"
        end
      end
      
    rescue IOError
      # Client disconnected
      Rails.logger.info "Client disconnected from live feed"
    ensure
      response.stream.close
    end
  end
end
```

## CSV Streaming Implementation

**Memory-efficient CSV export**:
```ruby
require 'csv'

class ExportsController < ApplicationController
  include ActionController::Live
  
  def download_csv
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename="co2_readings.csv"'
    response.headers['X-Accel-Buffering'] = 'no'
    
    begin
      # Write CSV header immediately
      csv_header = CSV.generate_line(['timestamp', 'co2_ppm', 'location', 'sensor_id'])
      response.stream.write csv_header
      
      # Stream rows in batches
      Co2Reading.find_each(batch_size: 1000) do |reading|
        csv_row = CSV.generate_line([
          reading.recorded_at.iso8601,
          reading.co2_ppm,
          reading.location_name,
          reading.sensor_id
        ])
        response.stream.write csv_row
      end
      
    rescue IOError
      Rails.logger.info "Client disconnected from CSV stream"
    ensure
      response.stream.close
    end
  end
end
```

## Error Handling and Recovery

**Common streaming errors and solutions**:

**H12 - Request timeout**:
```ruby
# Problem: Not sending data within 30 seconds
# Solution: Send immediate response, then stream

def stream_large_export
  # Send headers immediately
  response.headers['Content-Type'] = 'application/zip'
  response.headers['X-Accel-Buffering'] = 'no'
  
  # Send first byte immediately (prevents H12)
  response.stream.write ""
  response.stream.flush
  
  # Now process data
  process_and_stream_data
end
```

**IOError - Client disconnect**:
```ruby
begin
  # Streaming code
rescue IOError => e
  # Normal - client closed browser/cancelled download
  Rails.logger.info "Stream terminated: client disconnect"
  # Don't raise error, just clean up
ensure
  response.stream.close
end
```

**ActionController::Live::Buffer errors**:
```ruby
# Problem: Stream buffer overflow
# Solution: Write smaller chunks more frequently

# BAD: Large chunks
response.stream.write large_data_chunk

# GOOD: Small frequent writes
large_data_chunk.each_slice(1024) do |chunk|
  response.stream.write chunk.join
  response.stream.flush  # Force send immediately
end
```

## Memory Management for Streaming

**Monitor memory during streaming**:
```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  private
  
  def stream_with_memory_monitoring
    start_memory = memory_usage
    
    begin
      yield # Your streaming code
    ensure
      end_memory = memory_usage
      memory_diff = end_memory - start_memory
      
      if memory_diff > 100 # 100MB increase
        Rails.logger.warn "STREAMING MEMORY LEAK: #{memory_diff}MB increase"
      end
      
      if end_memory > 400 # Approaching limit
        Rails.logger.warn "HIGH MEMORY AFTER STREAMING: #{end_memory}MB"
      end
    end
  end
  
  def memory_usage
    `ps -o rss= -p #{Process.pid}`.to_i / 1024
  end
end
```

**Force garbage collection during streaming**:
```ruby
def stream_large_dataset
  batch_count = 0
  
  Dataset.find_in_batches(batch_size: 1000) do |batch|
    process_batch(batch)
    
    batch_count += 1
    
    # Force GC every 10 batches (10,000 records)
    if batch_count % 10 == 0
      GC.start
      Rails.logger.debug "GC forced after #{batch_count * 1000} records"
    end
  end
end
```

## Concurrent Streaming Limits

**For 512MB dyno, limit concurrent streams**:
```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  # Track active streams (use Redis in production)
  @@active_streams = 0
  @@stream_mutex = Mutex.new
  
  def stream_data
    # Check stream limit
    @@stream_mutex.synchronize do
      if @@active_streams >= 3  # Max 3 concurrent streams
        render json: { error: "Too many active streams" }, status: 503
        return
      end
      @@active_streams += 1
    end
    
    begin
      # Your streaming code here
      actual_streaming_work
    ensure
      # Always decrement counter
      @@stream_mutex.synchronize do
        @@active_streams -= 1
      end
    end
  end
end
```

## Testing Streaming Locally

**Local development setup**:
```ruby
# config/environments/development.rb
config.allow_concurrency = true  # Required for ActionController::Live

# Use Puma in development too
# config/puma.rb
if Rails.env.development?
  threads 1, 3  # Match production threading
end
```

**Test streaming endpoints**:
```bash
# Test basic connectivity
curl -v http://localhost:3000/api/v1/export/stream

# Test with timeout
timeout 65s curl http://localhost:3000/api/v1/export/stream

# Test concurrent streams
curl http://localhost:3000/api/v1/export/stream &
curl http://localhost:3000/api/v1/export/stream &
curl http://localhost:3000/api/v1/export/stream &
```

## Production Deployment Checklist

**Before deploying streaming features**:
- [ ] Headers set correctly (X-Accel-Buffering, Cache-Control)
- [ ] Timeout handling implemented (heartbeat or fast initial response)
- [ ] Memory usage tested with large datasets
- [ ] Error handling for client disconnects
- [ ] Concurrent stream limits implemented
- [ ] Batch processing used for large operations
- [ ] Garbage collection forced between batches

**After deployment monitoring**:
- [ ] No H12 timeout errors in logs
- [ ] Memory usage stays <400MB during streaming
- [ ] Client disconnects handled gracefully
- [ ] Stream completion rate acceptable

## Common Streaming Patterns

**Pattern 1: Immediate response with delayed processing**:
```ruby
def download_export
  # Send headers immediately
  response.headers['Content-Type'] = 'application/zip'
  response.headers['X-Accel-Buffering'] = 'no'
  
  # Send empty byte to start response
  response.stream.write ""
  
  # Now do the work
  generate_and_stream_zip
end
```

**Pattern 2: Progress indication**:
```ruby
def download_with_progress
  response.headers['Content-Type'] = 'text/plain'
  response.headers['X-Accel-Buffering'] = 'no'
  
  total_records = Co2Reading.count
  processed = 0
  
  Co2Reading.find_each do |reading|
    # Process record
    process_reading(reading)
    processed += 1
    
    # Send progress every 1000 records
    if processed % 1000 == 0
      progress = (processed.to_f / total_records * 100).round(1)
      response.stream.write "Progress: #{progress}%\n"
    end
  end
  
  response.stream.write "Complete!\n"
end
```

**Pattern 3: Server-Sent Events**:
```ruby
def sse_updates
  response.headers['Content-Type'] = 'text/event-stream'
  response.headers['X-Accel-Buffering'] = 'no'
  response.headers['Cache-Control'] = 'no-cache'
  
  # Send connection established event
  response.stream.write "event: connected\ndata: {\"status\": \"ready\"}\n\n"
  
  begin
    loop do
      # Get latest data
      latest_data = get_latest_co2_data
      
      # Send as Server-Sent Event
      response.stream.write "event: update\ndata: #{latest_data.to_json}\n\n"
      
      sleep 10  # Update every 10 seconds
    end
  rescue IOError
    # Client disconnected
  ensure
    response.stream.close
  end
end
```

These patterns ensure reliable streaming operations within Heroku's constraints while maintaining optimal memory usage and preventing timeouts.