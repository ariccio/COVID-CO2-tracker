# Multi-Format Export System Complete Implementation Plan
Generated: 2025-08-28

## Executive Summary
Comprehensive plan for multiple export formats from COVID CO2 Tracker to support AirSpot and other data consumers. Prioritizes safety (zero data deletion risk), privacy (no PII leakage), and flexibility (multiple formats).

## Export Format Options

### 1. JSONL (JSON Lines) Export
**Format Example:**
```jsonl
{"measurement_id":123,"co2_ppm":850,"timestamp":"2025-08-28T10:30:00Z","crowding":3,"lat":37.7749,"lng":-122.4194,"place_name":"Conference Room A","place_google_id":"ChIJI...","device_serial":"SN12345","device_model":"Aranet4","manufacturer":"SAF","is_realtime":false}
{"measurement_id":124,"co2_ppm":920,"timestamp":"2025-08-28T10:31:00Z","crowding":4,"lat":37.7749,"lng":-122.4194,"place_name":"Conference Room A","place_google_id":"ChIJI...","device_serial":"SN12345","device_model":"Aranet4","manufacturer":"SAF","is_realtime":false}
```

**Implementation:**
```ruby
class JsonlExportService
  def export_measurements(output_stream, filters = {})
    measurements_query(filters).find_each(batch_size: 1000) do |measurement|
      output_stream.puts(build_measurement_json(measurement).to_json)
    end
  end
  
  private
  
  def build_measurement_json(measurement)
    {
      measurement_id: measurement.id,
      co2_ppm: measurement.co2ppm,
      timestamp: measurement.measurementtime.iso8601,
      crowding: measurement.crowding,
      lat: measurement.sub_location&.place&.place_lat,
      lng: measurement.sub_location&.place&.place_lng,
      place_name: measurement.sub_location&.description,
      place_google_id: measurement.sub_location&.place&.google_place_id,
      device_serial: measurement.device&.serial,
      device_model: measurement.device&.model&.name,
      manufacturer: measurement.device&.model&.manufacturer&.name,
      is_realtime: measurement.is_realtime?
    }
  end
end
```

**Pros:**
- Self-describing fields
- Handles optional/null values gracefully
- Streamable line-by-line
- Easy to parse in any language
- Supports nested data naturally

**Cons:**
- Slightly larger than CSV (~20% overhead)
- Not Excel-native

### 2. Single Denormalized CSV Export
**Format Example:**
```csv
measurement_id,co2_ppm,timestamp,crowding,lat,lng,place_name,place_google_id,device_serial,device_model,manufacturer,is_realtime
123,850,2025-08-28T10:30:00Z,3,37.7749,-122.4194,"Conference Room A",ChIJI...,SN12345,Aranet4,SAF,false
124,920,2025-08-28T10:31:00Z,4,37.7749,-122.4194,"Conference Room A",ChIJI...,SN12345,Aranet4,SAF,false
```

**Implementation:**
```ruby
class DenormalizedCsvExportService
  require 'csv'
  
  def export_measurements(output_stream, filters = {})
    CSV(output_stream, write_headers: true, headers: csv_headers) do |csv|
      measurements_query(filters).find_each(batch_size: 1000) do |measurement|
        csv << build_csv_row(measurement)
      end
    end
  end
  
  private
  
  def csv_headers
    %w[measurement_id co2_ppm timestamp crowding lat lng place_name 
       place_google_id device_serial device_model manufacturer is_realtime]
  end
  
  def build_csv_row(measurement)
    [
      measurement.id,
      measurement.co2ppm,
      measurement.measurementtime&.iso8601,
      measurement.crowding,
      measurement.sub_location&.place&.place_lat,
      measurement.sub_location&.place&.place_lng,
      measurement.sub_location&.description,
      measurement.sub_location&.place&.google_place_id,
      measurement.device&.serial,
      measurement.device&.model&.name,
      measurement.device&.model&.manufacturer&.name,
      measurement.is_realtime?
    ]
  end
end
```

**Pros:**
- Simplest for consumers
- Excel/Google Sheets compatible
- Single file to manage
- Smallest file size

**Cons:**
- Redundant data (places repeated)
- No relationship preservation

### 3. Multiple CSV Files Export
**Structure:**
```
export_20250828_103000/
├── manifest.json
├── measurements.csv
├── places.csv
├── sub_locations.csv
└── devices.csv
```

**measurements.csv:**
```csv
measurement_id,co2_ppm,timestamp,crowding,device_id,sub_location_id,is_realtime
123,850,2025-08-28T10:30:00Z,3,456,789,false
```

**places.csv:**
```csv
place_id,latitude,longitude,google_place_id,last_fetched
101,37.7749,-122.4194,ChIJI...,2025-08-28T00:00:00Z
```

**sub_locations.csv:**
```csv
sub_location_id,place_id,description
789,101,"Conference Room A"
```

**devices.csv:**
```csv
device_id,serial,model_name,manufacturer_name
456,SN12345,Aranet4,SAF
```

**Implementation:**
```ruby
class MultiCsvExportService
  def export_all(output_dir, filters = {})
    export_id = "export_#{Time.current.strftime('%Y%m%d_%H%M%S')}"
    export_path = File.join(output_dir, export_id)
    FileUtils.mkdir_p(export_path)
    
    manifest = {
      export_id: export_id,
      created_at: Time.current.iso8601,
      files: [],
      record_counts: {}
    }
    
    # Export each entity type
    export_measurements(File.join(export_path, 'measurements.csv'), filters, manifest)
    export_places(File.join(export_path, 'places.csv'), filters, manifest)
    export_sub_locations(File.join(export_path, 'sub_locations.csv'), filters, manifest)
    export_devices(File.join(export_path, 'devices.csv'), filters, manifest)
    
    # Write manifest
    File.write(File.join(export_path, 'manifest.json'), JSON.pretty_generate(manifest))
    
    export_path
  end
end
```

**Pros:**
- Normalized data (no redundancy)
- Can import specific entities
- Preserves relationships
- Efficient for updates

**Cons:**
- Multiple files to manage
- Requires join logic for analysis

### 4. YAML Stream Export
**Format Example:**
```yaml
---
type: measurement
id: 123
co2_ppm: 850
timestamp: 2025-08-28T10:30:00Z
crowding: 3
location:
  lat: 37.7749
  lng: -122.4194
  name: Conference Room A
  google_place_id: ChIJI...
device:
  serial: SN12345
  model: Aranet4
  manufacturer: SAF
is_realtime: false
---
type: measurement
id: 124
co2_ppm: 920
```

**Implementation:**
```ruby
class YamlStreamExportService
  require 'yaml'
  
  def export_measurements(output_stream, filters = {})
    measurements_query(filters).find_each(batch_size: 1000) do |measurement|
      output_stream.puts(build_yaml_document(measurement))
      output_stream.puts("---") # YAML document separator
    end
  end
  
  private
  
  def build_yaml_document(measurement)
    {
      'type' => 'measurement',
      'id' => measurement.id,
      'co2_ppm' => measurement.co2ppm,
      'timestamp' => measurement.measurementtime&.iso8601,
      'crowding' => measurement.crowding,
      'location' => {
        'lat' => measurement.sub_location&.place&.place_lat,
        'lng' => measurement.sub_location&.place&.place_lng,
        'name' => measurement.sub_location&.description,
        'google_place_id' => measurement.sub_location&.place&.google_place_id
      },
      'device' => {
        'serial' => measurement.device&.serial,
        'model' => measurement.device&.model&.name,
        'manufacturer' => measurement.device&.model&.manufacturer&.name
      },
      'is_realtime' => measurement.is_realtime?
    }.to_yaml
  end
end
```

**Pros:**
- Human-readable
- Preserves structure/hierarchy
- Type-aware
- Comments possible

**Cons:**
- Larger file size
- Slower parsing
- Less common for data exchange

### 5. PostgreSQL Export from Heroku
**Two Approaches:**

#### A. Direct pg_dump Command
```bash
# From local machine with Heroku CLI
heroku pg:backups:capture --app covid-co2-tracker
heroku pg:backups:download --app covid-co2-tracker

# Export specific tables only (safer)
pg_dump $(heroku config:get DATABASE_URL -a covid-co2-tracker) \
  --table=measurements \
  --table=devices \
  --table=places \
  --table=sub_locations \
  --no-owner \
  --no-privileges \
  --data-only \
  --format=plain > export.sql
```

#### B. COPY Command via Rails
```ruby
class PostgresExportService
  def export_to_csv_via_copy(table_name, output_file)
    # CRITICAL: Validate table name to prevent SQL injection
    unless ALLOWED_TABLES.include?(table_name)
      raise "Invalid table name: #{table_name}"
    end
    
    # Use COPY for efficient export
    sql = <<~SQL
      COPY (
        SELECT * FROM #{table_name}
        WHERE created_at >= '#{1.year.ago.to_date}'
      ) TO STDOUT WITH CSV HEADER
    SQL
    
    File.open(output_file, 'w') do |file|
      connection = ActiveRecord::Base.connection.raw_connection
      connection.copy_data(sql) do
        while row = connection.get_copy_data
          file.write(row)
        end
      end
    end
  end
  
  ALLOWED_TABLES = %w[measurements devices places sub_locations].freeze
end
```

**Safety Measures for Production:**
```ruby
# Read-only database user (create on Heroku)
heroku pg:credentials:create --name readonly_export -a covid-co2-tracker

# Grant only SELECT permissions
heroku pg:psql -a covid-co2-tracker
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_export;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM readonly_export;
```

### 6. GraphQL-Style Query Export API
**Endpoint Design:**
```
GET /api/export?fields=co2_ppm,timestamp,lat,lng&format=csv&from=2024-01-01&to=2025-01-01
GET /api/export?fields=all&format=jsonl&place_id=123
GET /api/export?fields=co2_ppm,timestamp&format=yaml&above_ppm=1000
```

**Implementation:**
```ruby
class Api::ExportController < ApiController
  before_action :require_export_token
  
  def index
    format = params[:format] || 'csv'
    fields = parse_fields(params[:fields])
    filters = build_filters(params)
    
    respond_to do |format_type|
      format_type.any do
        stream_response(format, fields, filters)
      end
    end
  end
  
  private
  
  def stream_response(format, fields, filters)
    response.headers['Content-Type'] = content_type_for(format)
    response.headers['Content-Disposition'] = "attachment; filename=\"co2_export.#{format}\""
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no' # For nginx
    
    self.response_body = Enumerator.new do |yielder|
      exporter = exporter_for(format).new
      exporter.stream(yielder, fields, filters)
    end
  end
  
  def parse_fields(fields_param)
    return DEFAULT_FIELDS if fields_param == 'all'
    
    requested = fields_param.to_s.split(',').map(&:strip)
    requested & ALLOWED_FIELDS # Intersection for safety
  end
  
  def build_filters(params)
    {
      from: params[:from] ? Date.parse(params[:from]) : nil,
      to: params[:to] ? Date.parse(params[:to]) : nil,
      place_id: params[:place_id],
      above_ppm: params[:above_ppm]&.to_i,
      below_ppm: params[:below_ppm]&.to_i
    }.compact
  end
  
  ALLOWED_FIELDS = %w[
    measurement_id co2_ppm timestamp crowding
    lat lng place_name place_google_id
    device_serial device_model manufacturer
    is_realtime
  ].freeze
  
  DEFAULT_FIELDS = %w[co2_ppm timestamp lat lng].freeze
end
```

**Query Builder:**
```ruby
class ExportQueryBuilder
  def build(base_scope = Measurement, fields:, filters:)
    query = base_scope.includes(necessary_includes(fields))
    
    # Apply filters
    query = query.where('measurementtime >= ?', filters[:from]) if filters[:from]
    query = query.where('measurementtime <= ?', filters[:to]) if filters[:to]
    query = query.where('co2ppm > ?', filters[:above_ppm]) if filters[:above_ppm]
    query = query.where('co2ppm < ?', filters[:below_ppm]) if filters[:below_ppm]
    
    if filters[:place_id]
      query = query.joins(sub_location: :place)
                   .where(places: { id: filters[:place_id] })
    end
    
    query
  end
  
  private
  
  def necessary_includes(fields)
    includes = []
    includes << :device if fields.any? { |f| f.start_with?('device') }
    includes << { sub_location: :place } if fields.any? { |f| f.match?(/place|lat|lng/) }
    includes << :extra_measurement_info if fields.include?('is_realtime')
    includes
  end
end
```

## Unified Export Architecture

### Core Service Layer
```ruby
# app/services/export/base_service.rb
module Export
  class BaseService
    def initialize(filters = {})
      @filters = filters
      validate_filters!
      validate_safety!
    end
    
    protected
    
    def measurements_query(filters = @filters)
      ExportQueryBuilder.new.build(filters: filters)
    end
    
    def validate_safety!
      # Ensure no DELETE/UPDATE permissions
      if ActiveRecord::Base.connection.transaction_open?
        raise ExportError, "Cannot export during transaction"
      end
      
      # Check memory on Heroku
      memory_mb = `ps -o rss= -p #{Process.pid}`.to_i / 1024
      if memory_mb > 450
        raise ExportError, "Insufficient memory for export"
      end
    end
    
    def validate_filters!
      # Ensure date ranges are reasonable
      if @filters[:from] && @filters[:to]
        days = (@filters[:to] - @filters[:from]).to_i
        raise ExportError, "Date range too large" if days > 365
      end
    end
  end
end
```

### Authentication & Authorization
```ruby
# app/models/export_token.rb
class ExportToken < ApplicationRecord
  has_secure_token :token
  
  scope :active, -> { where('expires_at > ?', Time.current) }
  
  def self.authenticate(token_string)
    active.find_by(token: token_string)
  end
  
  def record_usage!
    increment(:usage_count)
    update!(last_used_at: Time.current)
  end
end

# Migration
class CreateExportTokens < ActiveRecord::Migration[7.1]
  def change
    create_table :export_tokens do |t|
      t.string :token, null: false, index: { unique: true }
      t.string :description
      t.datetime :expires_at
      t.integer :usage_count, default: 0
      t.datetime :last_used_at
      t.jsonb :permissions, default: {}
      t.timestamps
    end
  end
end
```

### API Rate Limiting
```ruby
# app/middleware/export_rate_limiter.rb
class ExportRateLimiter
  def initialize(app)
    @app = app
  end
  
  def call(env)
    if export_request?(env)
      token = extract_token(env)
      
      if rate_limited?(token)
        return [429, { 'Content-Type' => 'application/json' }, 
                [{ error: 'Rate limit exceeded' }.to_json]]
      end
      
      record_request(token)
    end
    
    @app.call(env)
  end
  
  private
  
  def rate_limited?(token)
    key = "export_rate:#{token}"
    count = Redis.current.get(key).to_i
    count >= 10 # 10 exports per hour
  end
  
  def record_request(token)
    key = "export_rate:#{token}"
    Redis.current.multi do |r|
      r.incr(key)
      r.expire(key, 1.hour.to_i)
    end
  end
end
```

## Production Deployment Plan

### Phase 1: Local Testing
```bash
# Test all export formats locally
rails console
Export::JsonlService.new.export_measurements(STDOUT)
Export::CsvService.new.export_measurements(STDOUT)
Export::YamlService.new.export_measurements(STDOUT)
```

### Phase 2: Staging Deployment
```bash
# Create review app
heroku create covid-co2-tracker-export-staging --stack heroku-22

# Deploy branch
git push heroku feature/multi-export:main

# Test with limited data
heroku run rails c -a covid-co2-tracker-export-staging
```

### Phase 3: Production Safety Checks
```ruby
# Create read-only check rake task
# lib/tasks/export_safety.rake
namespace :export do
  task safety_check: :environment do
    puts "Checking export safety..."
    
    # Test read-only
    begin
      ActiveRecord::Base.connection.execute("DELETE FROM measurements LIMIT 0")
      puts "❌ DANGER: Delete permission exists!"
      exit 1
    rescue
      puts "✅ No delete permission"
    end
    
    # Check memory
    memory_mb = `ps -o rss= -p #{Process.pid}`.to_i / 1024
    puts "✅ Memory usage: #{memory_mb}MB / 512MB"
    
    # Test small export
    count = Export::CsvService.new.export_measurements(StringIO.new, limit: 10)
    puts "✅ Test export successful: #{count} records"
  end
end
```

### Phase 4: Production Rollout
```bash
# Generate secure token
heroku run rails c -a covid-co2-tracker
ExportToken.create!(
  description: "AirSpot Initial Export",
  expires_at: 1.year.from_now,
  permissions: { formats: ['csv', 'jsonl'], max_records: 100000 }
)

# Enable feature flag
heroku config:set EXPORT_API_ENABLED=true -a covid-co2-tracker

# Monitor
heroku logs --tail -a covid-co2-tracker | grep export
```

## Performance Optimizations

### Streaming for Large Datasets
```ruby
class StreamingExporter
  include ActionController::Live
  
  def stream_csv
    response.headers['Content-Type'] = 'text/csv'
    response.stream.write CSV.generate_line(headers)
    
    Measurement.find_in_batches(batch_size: 1000) do |batch|
      csv_data = CSV.generate do |csv|
        batch.each { |m| csv << build_row(m) }
      end
      response.stream.write csv_data
    end
  ensure
    response.stream.close
  end
end
```

### Database Query Optimization
```ruby
# Add indexes for common export queries
class AddExportIndexes < ActiveRecord::Migration[7.1]
  def change
    add_index :measurements, [:measurementtime, :co2ppm]
    add_index :measurements, :created_at
    add_index :places, [:place_lat, :place_lng]
  end
end
```

## Error Handling & Monitoring

### Comprehensive Error Handling
```ruby
class ExportError < StandardError; end

class ExportService
  def export_with_monitoring
    start_time = Time.current
    record_count = 0
    
    begin
      record_count = perform_export
      
      Rails.logger.info({
        event: 'export_success',
        format: self.class.name,
        records: record_count,
        duration: Time.current - start_time
      }.to_json)
      
      Sentry.capture_message("Export completed", level: :info)
      
    rescue ExportError => e
      Rails.logger.error({
        event: 'export_failed',
        error: e.message,
        format: self.class.name
      }.to_json)
      
      Sentry.capture_exception(e)
      raise
    end
    
    record_count
  end
end
```

## Documentation for AirSpot

### Quick Start Guide
```markdown
# COVID CO2 Tracker Data Export API

## Authentication
Include your token in the Authorization header:
```
Authorization: Bearer YOUR_EXPORT_TOKEN
```

## Available Formats

### CSV Export
GET https://covid-co2-tracker.herokuapp.com/api/export?format=csv

### JSONL Export  
GET https://covid-co2-tracker.herokuapp.com/api/export?format=jsonl

### Custom Fields
GET /api/export?fields=co2_ppm,timestamp,lat,lng&format=csv

### Date Filtering
GET /api/export?from=2024-01-01&to=2024-12-31&format=csv

### High CO2 Only
GET /api/export?above_ppm=1000&format=jsonl

## Rate Limits
- 10 exports per hour
- Maximum 100,000 records per export
- 30 second timeout per request
```

## Testing Strategy

### Unit Tests
```ruby
# spec/services/export/csv_service_spec.rb
RSpec.describe Export::CsvService do
  it 'excludes PII fields' do
    export = described_class.new.export_measurements(StringIO.new)
    expect(export).not_to include('email')
    expect(export).not_to include('name')
    expect(export).not_to include('sub_google_uid')
  end
  
  it 'handles nil values gracefully' do
    measurement = create(:measurement, sub_location: nil)
    csv = described_class.new.build_csv_row(measurement)
    expect(csv).not_to include(nil)
  end
end
```

### Integration Tests
```ruby
# spec/requests/api/export_spec.rb
RSpec.describe 'Export API' do
  it 'requires authentication' do
    get '/api/export?format=csv'
    expect(response).to have_http_status(:unauthorized)
  end
  
  it 'streams CSV data' do
    token = create(:export_token)
    get '/api/export?format=csv', headers: { 'Authorization' => "Bearer #{token.token}" }
    
    expect(response.headers['Content-Type']).to eq('text/csv')
    expect(response.body).to include('co2_ppm,timestamp')
  end
end
```

## Next Steps Priority

1. **Immediate**: Create ExportToken model and migration
2. **Day 1**: Implement base service and CSV export
3. **Day 2**: Add JSONL and denormalized CSV
4. **Day 3**: Implement GraphQL-style API
5. **Day 4**: Add PostgreSQL export tools
6. **Day 5**: Deploy to staging and test
7. **Week 2**: Production deployment with monitoring

## Risk Mitigation Summary

- **No data deletion**: Read-only queries only
- **Memory safe**: Streaming + batching
- **Privacy protected**: PII fields excluded
- **Rate limited**: Prevent abuse
- **Monitored**: Sentry + logs
- **Reversible**: Feature flags for rollback

---
*This plan incorporates knowledge from the COVID CO2 Tracker semantic index and follows the project's public health mission of transparency and accessibility*