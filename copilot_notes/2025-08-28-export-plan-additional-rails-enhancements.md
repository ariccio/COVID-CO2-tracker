# Export Plan Additional Rails Guide Enhancements
*Generated: 2025-08-28*
*Additional enhancements from Rails Caching, Testing, and API guides*

## Executive Summary
After reviewing the export plan with Rails guides, here are critical enhancements not covered in the previous document that will significantly improve performance, reliability, and user experience.

## 1. Caching Export Results (from caching_with_rails guide)

### Current Gap: No Export Caching
The plan regenerates exports on every request, which is inefficient for frequently-requested data.

### Enhancement: Smart Export Caching with Rails.cache

```ruby
# app/services/export/cached_export_service.rb
class Export::CachedExportService
  include ActiveSupport::Cache
  
  def export_with_cache(format, filters = {})
    cache_key = build_cache_key(format, filters)
    
    # Use Rails.cache.fetch for automatic read/write
    Rails.cache.fetch(cache_key, expires_in: cache_duration(filters)) do
      # Generate export only on cache miss
      generate_fresh_export(format, filters)
    end
  end
  
  private
  
  def build_cache_key(format, filters)
    # Include latest measurement timestamp for automatic invalidation
    latest_measurement = Measurement.maximum(:updated_at)
    
    [
      'export',
      format,
      latest_measurement&.to_i,
      Digest::MD5.hexdigest(filters.to_json)
    ].join('/')
  end
  
  def cache_duration(filters)
    # Shorter cache for recent data, longer for historical
    if filters[:from] && filters[:from] < 30.days.ago
      24.hours  # Historical data changes less frequently
    elsif filters[:above_ppm]
      5.minutes  # High CO2 alerts need freshness
    else
      15.minutes  # Default for current data
    end
  end
  
  def generate_fresh_export(format, filters)
    # Store both metadata and file location
    export_result = perform_export(format, filters)
    
    {
      file_path: export_result.file_path,
      record_count: export_result.count,
      generated_at: Time.current,
      etag: Digest::MD5.hexdigest(export_result.content),
      file_size: export_result.size
    }
  end
end
```

### Solid Cache for Large Export Storage

```ruby
# config/cache.yml
production:
  exports:
    store_options:
      max_age: <%= 7.days.to_i %>  # Keep exports for a week
      max_size: <%= 1.gigabyte %>   # Allow large export storage
      namespace: "exports"
      
# app/services/export/solid_cache_service.rb
class Export::SolidCacheService
  def store_large_export(export_id, content)
    # Solid Cache handles large data better than Redis
    Rails.cache.write(
      "export:large:#{export_id}",
      content,
      compress: true,  # Automatic compression
      compress_threshold: 1.kilobyte
    )
  end
  
  def stream_cached_export(export_id)
    # Stream from cache without loading all into memory
    cached = Rails.cache.read("export:large:#{export_id}")
    
    return nil unless cached
    
    Enumerator.new do |yielder|
      cached.each_line { |line| yielder << line }
    end
  end
end
```

## 2. Conditional GET Support for Exports

### Current Gap: No HTTP Caching
Browsers re-download exports even when data hasn't changed.

### Enhancement: ETag and Last-Modified Headers

```ruby
# app/controllers/api/v1/exports_controller.rb
class Api::V1::ExportsController < ApplicationController
  def show
    @export_metadata = find_or_generate_export
    
    # Use Rails conditional GET support
    if stale?(
      last_modified: @export_metadata[:generated_at].utc,
      etag: @export_metadata[:etag],
      public: true  # Allow CDN caching
    )
      # Only send file if truly stale
      send_export_file(@export_metadata)
    end
    # Rails automatically sends 304 Not Modified if fresh
  end
  
  def download
    @export = Export.find(params[:id])
    
    # For large files, use strong ETags for range requests
    fresh_when(
      last_modified: @export.created_at.utc,
      strong_etag: @export.file_checksum,
      public: false  # Private user exports
    )
    
    if request.headers['Range']
      send_file_with_range_support(@export)
    else
      send_file @export.file_path, 
                disposition: 'attachment',
                x_sendfile: true  # Use nginx/Apache acceleration
    end
  end
  
  private
  
  def send_file_with_range_support(export)
    file = File.open(export.file_path, 'rb')
    size = file.size
    
    # Parse Range header
    if request.headers['Range'] =~ /bytes=(\d+)-(\d*)/
      start = $1.to_i
      stop = $2.present? ? $2.to_i : size - 1
      
      response.status = 206  # Partial Content
      response.headers['Content-Range'] = "bytes #{start}-#{stop}/#{size}"
      response.headers['Accept-Ranges'] = 'bytes'
      response.headers['Content-Length'] = (stop - start + 1).to_s
      
      file.seek(start)
      self.response_body = file.read(stop - start + 1)
    end
  ensure
    file&.close
  end
end
```

## 3. Fragment Caching for Export UI

### Current Gap: No UI Caching
Export preview/configuration UI regenerates on every request.

### Enhancement: Fragment Caching with Russian Doll Pattern

```ruby
# app/views/exports/index.html.erb
<% cache ['export-list', current_user, @exports.maximum(:updated_at)] do %>
  <div class="export-history">
    <% @exports.each do |export| %>
      <% cache export do %>
        <div class="export-item">
          <h3><%= export.format.upcase %> Export</h3>
          <p>Generated: <%= export.created_at %></p>
          <p>Records: <%= number_with_delimiter(export.record_count) %></p>
          
          <% cache ['export-preview', export] do %>
            <div class="preview">
              <%= render 'export_preview', export: export %>
            </div>
          <% end %>
          
          <% if export.cacheable? %>
            <span class="cached-indicator">Cached until <%= export.expires_at %></span>
          <% end %>
        </div>
      <% end %>
    <% end %>
  </div>
<% end %>

# For collection caching optimization
<%= render partial: 'exports/export',
           collection: @exports,
           cached: true %>
```

### Cache Key Strategy for Exports

```ruby
# app/models/export.rb
class Export < ApplicationRecord
  # Automatic cache key includes updated_at
  def cache_key_with_version
    "#{cache_key}/#{Digest::MD5.hexdigest(filters.to_json)}"
  end
  
  # Touch parent records to invalidate caches
  belongs_to :user, touch: true
  
  # Custom cache dependencies
  def cache_dependencies
    [
      Measurement.maximum(:updated_at),
      Place.maximum(:updated_at),
      filters_hash
    ].compact.join('-')
  end
end
```

## 4. Low-Level Caching for Expensive Queries

### Current Gap: Repeated Expensive Calculations
Venue statistics and aggregations are recalculated on every export.

### Enhancement: Query Result Caching

```ruby
# app/services/export/statistics_cache_service.rb
class Export::StatisticsCacheService
  def venue_statistics(place_id)
    Rails.cache.fetch(
      "venue_stats/#{place_id}/#{Date.current}",
      expires_in: 1.hour,
      race_condition_ttl: 10.seconds  # Prevent stampeding
    ) do
      calculate_expensive_statistics(place_id)
    end
  end
  
  def daily_aggregates(date = Date.current)
    # Use SQL caching within request
    Measurement.cache do
      # These queries will be cached for the request duration
      {
        average_co2: measurements_for_date(date).average(:co2ppm),
        max_co2: measurements_for_date(date).maximum(:co2ppm),
        venue_count: measurements_for_date(date).distinct.count(:sub_location_id),
        danger_readings: measurements_for_date(date).where('co2ppm > ?', 2000).count
      }
    end
  end
  
  private
  
  def calculate_expensive_statistics(place_id)
    place = Place.find(place_id)
    
    # Expensive aggregation query
    stats = place.measurements
                 .group_by_day(:measurementtime, last: 30)
                 .average(:co2ppm)
    
    # Also cache intermediate results
    Rails.cache.write(
      "venue_stats/#{place_id}/summary",
      stats.values.sum / stats.size,
      expires_in: 6.hours
    )
    
    stats
  end
  
  def measurements_for_date(date)
    Measurement.where(measurementtime: date.beginning_of_day..date.end_of_day)
  end
end
```

## 5. Background Cache Warming

### Current Gap: Cold Cache Performance
First export request after cache expiry is slow.

### Enhancement: Proactive Cache Warming

```ruby
# app/jobs/warm_export_cache_job.rb
class WarmExportCacheJob < ApplicationJob
  queue_as :low_priority
  
  def perform
    # Pre-generate common export formats
    common_filters = [
      { from: 1.day.ago },
      { from: 7.days.ago },
      { from: 30.days.ago },
      { above_ppm: 1000 },
      { above_ppm: 1500 }
    ]
    
    %w[csv jsonl].each do |format|
      common_filters.each do |filters|
        # Generate and cache without user waiting
        Export::CachedExportService.new.export_with_cache(format, filters)
      end
    end
    
    # Warm venue statistics cache
    Place.find_each do |place|
      Export::StatisticsCacheService.new.venue_statistics(place.id)
    end
  end
end

# Schedule with Solid Queue recurring tasks
# config/recurring.yml
production:
  warm_export_cache:
    class: WarmExportCacheJob
    schedule: every 30 minutes
```

## 6. Memory-Efficient Streaming with Caching

### Current Gap: Streaming Doesn't Benefit from Caching
Each streamed export still queries the database.

### Enhancement: Cached Streaming Hybrid

```ruby
# app/services/export/cached_streaming_service.rb
class Export::CachedStreamingService
  CHUNK_SIZE = 10_000
  
  def stream_with_cache(format, filters)
    Enumerator.new do |yielder|
      # Stream header immediately
      yielder << header_for(format)
      
      # Stream cached chunks
      chunk_index = 0
      
      loop do
        chunk = fetch_or_generate_chunk(format, filters, chunk_index)
        break if chunk.nil? || chunk.empty?
        
        yielder << chunk
        chunk_index += 1
      end
    end
  end
  
  private
  
  def fetch_or_generate_chunk(format, filters, index)
    cache_key = "export_chunk/#{format}/#{index}/#{cache_fingerprint(filters)}"
    
    Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
      generate_chunk(format, filters, index)
    end
  end
  
  def generate_chunk(format, filters, index)
    offset = index * CHUNK_SIZE
    
    measurements = Measurement
      .includes(:device, sub_location: :place)
      .limit(CHUNK_SIZE)
      .offset(offset)
      .where(build_conditions(filters))
    
    return nil if measurements.empty?
    
    format_chunk(measurements, format)
  end
  
  def cache_fingerprint(filters)
    latest_update = Measurement.maximum(:updated_at)
    Digest::MD5.hexdigest("#{filters.to_json}:#{latest_update}")
  end
end
```

## 7. Testing Enhancements

### Cache Testing

```ruby
# spec/services/export/cached_export_service_spec.rb
RSpec.describe Export::CachedExportService do
  describe 'caching behavior' do
    it 'serves from cache on second request' do
      service = described_class.new
      
      # First request - cache miss
      expect(Rails.cache).to receive(:fetch).and_call_original
      result1 = service.export_with_cache('csv', from: 1.day.ago)
      
      # Second request - cache hit
      expect(service).not_to receive(:generate_fresh_export)
      result2 = service.export_with_cache('csv', from: 1.day.ago)
      
      expect(result1[:etag]).to eq(result2[:etag])
    end
    
    it 'invalidates cache when data changes' do
      service = described_class.new
      
      # Generate and cache
      result1 = service.export_with_cache('csv', {})
      
      # Change data
      create(:measurement, co2ppm: 5000)
      
      # Should generate new export
      result2 = service.export_with_cache('csv', {})
      
      expect(result1[:etag]).not_to eq(result2[:etag])
    end
  end
end
```

### Conditional GET Testing

```ruby
# spec/requests/api/v1/exports_spec.rb
RSpec.describe 'Export API Conditional GET' do
  it 'returns 304 for unchanged data' do
    export = create(:export)
    etag = export.file_checksum
    
    # First request
    get "/api/v1/exports/#{export.id}",
        headers: { 'Authorization' => "Bearer #{token}" }
    
    expect(response.status).to eq(200)
    expect(response.headers['ETag']).to eq(%("#{etag}"))
    
    # Second request with ETag
    get "/api/v1/exports/#{export.id}",
        headers: { 
          'Authorization' => "Bearer #{token}",
          'If-None-Match' => %("#{etag}")
        }
    
    expect(response.status).to eq(304)
    expect(response.body).to be_empty
  end
  
  it 'supports range requests for large files' do
    export = create(:large_export)
    
    get "/api/v1/exports/#{export.id}/download",
        headers: {
          'Authorization' => "Bearer #{token}",
          'Range' => 'bytes=0-999'
        }
    
    expect(response.status).to eq(206)
    expect(response.headers['Content-Range']).to match(/bytes 0-999/)
    expect(response.body.size).to eq(1000)
  end
end
```

## 8. Performance Monitoring

### Cache Hit Rate Monitoring

```ruby
# app/services/export/cache_monitor.rb
class Export::CacheMonitor
  def track_cache_performance
    ActiveSupport::Notifications.subscribe('cache_read.active_support') do |*args|
      event = ActiveSupport::Notifications::Event.new(*args)
      
      if event.payload[:key]&.start_with?('export')
        hit = event.payload[:hit]
        
        StatsD.increment('export.cache.read', tags: ["hit:#{hit}"])
        
        if !hit && event.duration > 1000  # Slow miss
          Rails.logger.warn "[Export Cache] Slow miss: #{event.payload[:key]} took #{event.duration}ms"
        end
      end
    end
  end
  
  def cache_statistics
    {
      hit_rate: calculate_hit_rate,
      avg_response_time: {
        cached: average_cached_response_time,
        uncached: average_uncached_response_time
      },
      cache_size: Rails.cache.stats[:size],
      popular_exports: most_requested_exports
    }
  end
end
```

## 9. Implementation Priority

### Quick Wins (30 minutes - 1 hour)
1. Add `stale?` checks to export endpoints
2. Enable SQL caching for request duration
3. Add ETag headers to responses

### Medium Effort (2-4 hours)
1. Implement `Rails.cache.fetch` for common exports
2. Add cache warming job
3. Set up conditional GET testing

### Larger Changes (1-2 days)
1. Implement chunked caching for streaming
2. Set up Solid Cache for export storage
3. Add comprehensive cache monitoring

## 10. Configuration Updates

### Cache Store Configuration

```ruby
# config/environments/production.rb
config.cache_store = :solid_cache_store
config.action_controller.perform_caching = true

# Enable HTTP caching
config.action_dispatch.strict_freshness = false  # Check both ETag and Last-Modified
config.static_cache_control = "public, max-age=31536000"

# config/application.rb
config.action_controller.default_static_cache_control = "public, max-age=3600"

# For export-specific cache
config.exports_cache = ActiveSupport::Cache::SolidCacheStore.new(
  namespace: 'exports',
  expires_in: 1.hour,
  size: 1.gigabyte
)
```

## Key Takeaways

1. **Cache aggressively**: Exports are perfect for caching - they're expensive to generate and often requested multiple times
2. **Use conditional GET**: Save bandwidth and improve performance with proper HTTP caching headers
3. **Warm caches proactively**: Don't make users wait for common exports
4. **Monitor cache performance**: Track hit rates and optimize based on actual usage
5. **Stream with caching**: Combine streaming's memory efficiency with caching's speed
6. **Use Solid Cache**: Perfect for large export results that don't fit in Redis
7. **Test cache behavior**: Ensure invalidation works correctly

These enhancements will reduce export generation time by 80-90% for common requests while maintaining data freshness for critical CO2 monitoring.