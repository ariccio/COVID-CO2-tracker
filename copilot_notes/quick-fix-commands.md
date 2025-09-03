# Quick Fix Commands - Copy & Paste Solutions

## Step 1: Create JsonService (COPY THIS ENTIRE BLOCK)
```bash
cat > app/services/export/json_service.rb << 'EOF'
# frozen_string_literal: true

module Export
  class JsonService < BaseService
    def export(fields: nil)
      measurements = build_measurements_query
      fields = parse_export_fields(fields)
      
      {
        measurements: measurements.map { |m| format_measurement(m, fields) },
        metadata: {
          total_records: measurements.count,
          export_time: Time.current.iso8601,
          filters: @filters || {}
        }
      }.to_json
    end
    
    private
    
    def format_measurement(m, fields)
      {}.tap do |h|
        fields.each do |f|
          h[f] = case f
          when 'measurement_id' then m.id
          when 'co2_ppm' then m.co2ppm
          when 'timestamp' then m.measurementtime.iso8601
          when 'lat' then m.sub_location&.place&.place_lat
          when 'lng' then m.sub_location&.place&.place_lng
          when 'place_name' then m.sub_location&.description
          when 'place_google_id' then m.sub_location&.place&.google_place_id
          when 'device_serial' then m.device&.serial
          when 'device_model' then m.device&.model&.name
          when 'manufacturer' then m.device&.model&.manufacturer&.name
          when 'crowding' then m.crowding
          when 'is_realtime' then m.is_realtime || false
          when 'user_name' then m.device&.user&.name
          end
        end
      end
    end
    
    def parse_export_fields(fields)
      return DEFAULT_FIELDS if fields.nil?
      return ALLOWED_FIELDS if fields == 'all'
      fields.is_a?(Array) ? (fields & ALLOWED_FIELDS) : DEFAULT_FIELDS
    end
  end
end
EOF
```

## Step 2: Create StreamingCsvService (COPY THIS ENTIRE BLOCK)
```bash
cat > app/services/export/streaming_csv_service.rb << 'EOF'
# frozen_string_literal: true

require 'csv'

module Export
  class StreamingCsvService < BaseService
    BATCH_SIZE = 100
    
    def stream(fields: nil, &block)
      fields = parse_export_fields(fields)
      measurements = build_measurements_query
      
      # Memory check
      memory_mb = `ps -o rss= -p #{Process.pid}`.to_i / 1024
      raise ExportError, "Memory limit exceeded" if memory_mb > 450
      
      # Yield header
      block.call(CSV.generate { |csv| csv << fields.map(&:humanize) })
      
      # Stream data
      measurements.find_in_batches(batch_size: BATCH_SIZE) do |batch|
        csv_data = CSV.generate do |csv|
          batch.each do |m|
            csv << fields.map { |f| get_field_value(m, f) }
          end
        end
        block.call(csv_data)
      end
    rescue => e
      Rails.logger.error "Stream error: #{e.message}"
      raise
    end
    
    private
    
    def get_field_value(m, field)
      case field
      when 'measurement_id' then m.id
      when 'co2_ppm' then m.co2ppm
      when 'timestamp' then m.measurementtime&.iso8601
      when 'lat' then m.sub_location&.place&.place_lat
      when 'lng' then m.sub_location&.place&.place_lng
      when 'place_name' then m.sub_location&.description
      when 'place_google_id' then m.sub_location&.place&.google_place_id
      when 'device_serial' then m.device&.serial
      when 'device_model' then m.device&.model&.name
      when 'manufacturer' then m.device&.model&.manufacturer&.name
      when 'crowding' then m.crowding
      when 'is_realtime' then m.is_realtime || false
      when 'user_name' then m.device&.user&.name
      end
    end
    
    def parse_export_fields(fields)
      return DEFAULT_FIELDS if fields.nil?
      return ALLOWED_FIELDS if fields == 'all'
      fields.is_a?(Array) ? (fields & ALLOWED_FIELDS) : DEFAULT_FIELDS
    end
  end
end
EOF
```

## Step 3: Fix Test Transaction Issues (COPY THIS ENTIRE BLOCK)
```bash
cat >> spec/rails_helper.rb << 'EOF'

# Export service test configuration
RSpec.configure do |config|
  config.before(:each) do |example|
    if example.metadata[:file_path]&.include?('export')
      DatabaseCleaner.strategy = :truncation
    end
  end
  
  config.after(:each) do |example|
    if example.metadata[:file_path]&.include?('export')
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :transaction
    end
  end
end
EOF
```

## Step 4: Quick Factory Fix (COPY THIS ENTIRE BLOCK)
```bash
# Check if manufacturer factory needs sequence
grep -A 5 "factory :manufacturer" spec/factories/*.rb

# If it doesn't have sequence, add it:
cat > /tmp/fix_factory.rb << 'EOF'
content = File.read(Dir.glob("spec/factories/*.rb").find { |f| f.include?("manufacturer") })
unless content.include?("sequence")
  content.gsub!(/factory :manufacturer do.*?end/m) do |match|
    match.gsub(/name.*$/, 'sequence(:name) { |n| "Manufacturer #{n}" }')
  end
  File.write(Dir.glob("spec/factories/*.rb").find { |f| f.include?("manufacturer") }, content)
end
EOF
ruby /tmp/fix_factory.rb
```

## Step 5: Run Tests to Verify (RUN THESE COMMANDS)
```bash
# Test JSON service
bundle exec rspec spec/services/export/json_service_spec.rb --format documentation

# Test Streaming CSV service  
bundle exec rspec spec/services/export/streaming_csv_service_spec.rb --format documentation

# Check total failures
bundle exec rspec --format progress 2>&1 | tail -5
```

## Step 6: If Tests Still Fail Due to Transactions (EMERGENCY FIX)
```bash
# Add this to the TOP of both service spec files:
sed -i '' '1a\
# Disable transactional tests for export services\
RSpec.configure do |c|\
  c.before(:suite) do\
    DatabaseCleaner.strategy = :truncation\
  end\
end\
' spec/services/export/json_service_spec.rb

sed -i '' '1a\
# Disable transactional tests for export services\
RSpec.configure do |c|\
  c.before(:suite) do\
    DatabaseCleaner.strategy = :truncation\
  end\
end\
' spec/services/export/streaming_csv_service_spec.rb
```

## Expected Results After These Commands:
- JsonService: ~11 passing tests
- StreamingCsvService: ~10 passing tests  
- Total failures should drop by 60-70%

## If Something Doesn't Work:
1. Check if BaseService exists: `cat app/services/export/base_service.rb | head -20`
2. Check DEFAULT_FIELDS constant: `grep DEFAULT_FIELDS app/services/export/base_service.rb`
3. Check factory files: `ls spec/factories/`
4. Check for syntax errors: `ruby -c app/services/export/json_service.rb`

## Next Priority After These Pass:
1. Fix ExportToken raw_token issue
2. Add CORS headers to controller
3. Fix rate limiting implementation
4. Add missing controller actions