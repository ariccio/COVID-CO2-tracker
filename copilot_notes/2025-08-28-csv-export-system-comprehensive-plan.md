# CSV Export System Comprehensive Implementation Plan
Generated: 2025-08-28

## Current Analysis Summary

### Existing Implementation (PR #19)
- **Service Class**: CsvExportService with two export methods
  1. Direct database export via `export_measurements_to_csv`
  2. PostgreSQL dump file processing via `export_from_pg_dump`
- **Safety Features**: Validation checks, batched processing, error handling
- **Privacy Protection**: Excludes PII (emails, names, Google UIDs)
- **Output Format**: Single CSV with all measurement data

### Issues with Current Implementation
1. **Single monolithic CSV** - Not ideal for AirSpot's needs
2. **No authentication/authorization** for production access
3. **Temporary database approach** for dump files is risky
4. **Missing relationship exports** (places, sub_locations as separate files)
5. **No API endpoints** - only rake tasks
6. **No streaming support** for large datasets
7. **No export history/tracking**

## Improved Design Plan

### Core Principles
1. **ZERO risk of data deletion** - Read-only operations only
2. **Privacy-first** - Never expose PII beyond normal API boundaries  
3. **Production-safe** - Must work on Heroku dyno without disruption
4. **AirSpot-compatible** - Format suitable for their import needs
5. **Incremental exports** - Support date-range filtering

### Architecture Components

#### 1. Export Service Improvements
```ruby
# Modular export with multiple output files
class ImprovedCsvExportService
  # Separate methods for each entity type
  def export_measurements(filters = {})
  def export_places(filters = {})
  def export_sub_locations(filters = {})
  def export_devices(filters = {})
  
  # Streaming support for large datasets
  def stream_measurements(&block)
  
  # Export manifest for tracking
  def create_export_manifest(export_id, files)
end
```

#### 2. API Endpoints (Protected)
```ruby
# app/controllers/api/exports_controller.rb
class Api::ExportsController < ApiController
  before_action :require_admin_or_special_export_token
  
  # GET /api/exports/measurements.csv
  def measurements
    respond_to do |format|
      format.csv { stream_csv_response }
    end
  end
  
  # GET /api/exports/manifest
  def manifest
    # Returns JSON with available exports
  end
end
```

#### 3. Authentication Strategy
- **Option A**: Admin-only access via existing admin_users
- **Option B**: Special export tokens with limited scope
- **Option C**: OAuth2 flow for partner services (complex)
- **Recommended**: Start with Option B - special tokens

#### 4. CSV Format Structure

**measurements.csv**
```csv
measurement_id,co2_ppm,timestamp,crowding,device_id,sub_location_id,is_realtime
123,850,2025-08-28T10:30:00Z,3,device_456,subloc_789,false
```

**places.csv**
```csv
place_id,latitude,longitude,google_place_id
place_123,37.7749,-122.4194,ChIJI...
```

**sub_locations.csv**
```csv
sub_location_id,place_id,description
subloc_789,place_123,"Conference Room A"
```

**devices.csv** 
```csv
device_id,serial,model_name,manufacturer_name
device_456,SN12345,Model-X,ManuCorp
```

**manifest.json**
```json
{
  "export_id": "exp_20250828_103000",
  "created_at": "2025-08-28T10:30:00Z",
  "record_counts": {
    "measurements": 50000,
    "places": 123,
    "sub_locations": 456,
    "devices": 78
  },
  "files": [...]
}
```

### Implementation Steps

#### Phase 1: Core Service (Safe Foundation)
1. Create new service class with modular export methods
2. Add comprehensive specs with privacy validation
3. Implement streaming support for large datasets
4. Add export manifest generation

#### Phase 2: Authentication & Authorization
1. Create ExportToken model with scopes
2. Add token generation rake task for admins
3. Implement token validation middleware
4. Add rate limiting for export endpoints

#### Phase 3: API Endpoints
1. Create exports controller with CSV responses
2. Add streaming support with ActionController::Live
3. Implement date range filtering
4. Add compression support (gzip)

#### Phase 4: Production Deployment
1. Test on staging/review app first
2. Generate secure export token
3. Document API for AirSpot team
4. Monitor performance and adjust batching

### Safety Validations

```ruby
# Critical safety checks
def validate_export_safety!
  # 1. Ensure read-only database connection
  if ActiveRecord::Base.connection.transaction_open?
    raise "Cannot export during open transaction"
  end
  
  # 2. Verify no DELETE/UPDATE permissions
  result = ActiveRecord::Base.connection.execute(
    "SELECT has_table_privilege(current_user, 'measurements', 'DELETE')"
  )
  if result.first['has_table_privilege'] == 't'
    raise "Export user has dangerous DELETE permissions"
  end
  
  # 3. Memory check for Heroku
  memory_usage = `ps -o rss= -p #{Process.pid}`.to_i / 1024
  if memory_usage > 450 # MB, Heroku limit is 512MB
    raise "Insufficient memory for export"
  end
end
```

### Alternative Formats

#### Option: JSONL (JSON Lines)
```jsonl
{"measurement_id":123,"co2_ppm":850,"timestamp":"2025-08-28T10:30:00Z",...}
{"measurement_id":124,"co2_ppm":920,"timestamp":"2025-08-28T10:31:00Z",...}
```

#### Option: Parquet (for large datasets)
- Binary columnar format
- Better compression
- Requires additional gem

### Monitoring & Observability

```ruby
# Track export metrics
class ExportMetrics
  def self.record_export(format:, records:, duration:)
    Rails.logger.info({
      event: 'data_export',
      format: format,
      record_count: records,
      duration_seconds: duration,
      memory_used_mb: memory_usage
    }.to_json)
    
    Sentry.capture_message("Data export completed", level: 'info', extra: {...})
  end
end
```

### Rollback Plan
1. Feature flag for export endpoints
2. Separate deployment from activation
3. Token revocation capability
4. Rate limiting as circuit breaker

### Open Questions for User
1. Does AirSpot prefer single CSV or multiple files?
2. What date range of data do they need?
3. Do they need real-time data included?
4. Preferred authentication method?
5. Compression requirements?
6. Update frequency needs?

### Next Steps Priority
1. ✅ Review existing implementation
2. ✅ Document comprehensive plan
3. ⬜ Get user feedback on plan
4. ⬜ Implement Phase 1 (safe service)
5. ⬜ Add tests with privacy validation
6. ⬜ Implement authentication
7. ⬜ Create API endpoints
8. ⬜ Test on staging
9. ⬜ Deploy to production
10. ⬜ Provide docs to AirSpot

## Risk Mitigation

### Production Database Safety
- Use read-only database role if possible
- Implement query timeout (30 seconds max)
- Monitor lock acquisition
- Use COPY command for efficiency

### Heroku Dyno Constraints
- Stream responses to avoid memory issues
- Use background job for large exports
- Implement chunked downloads
- Monitor dyno memory usage

### Privacy Protection
- Audit log all exports
- Validate no PII in output
- Use allowlist for exportable fields
- Regular privacy review

## Code Quality Notes
Following repo conventions:
- Free functions over class methods where sensible
- Explicit error handling
- No silent failures
- Clear parameter passing
- Comprehensive validation