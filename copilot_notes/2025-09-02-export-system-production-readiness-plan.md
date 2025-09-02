# Export System Production Readiness Plan
*Created: 2025-09-02*
*Purpose: Complete plan to make export system production-ready*

## Security Audit Results

### Current State
The export system currently does NOT export any user identification:
- ❌ No emails
- ❌ No user names  
- ❌ No user IDs
- ❌ No OAuth tokens or passwords
- ✅ Only exports: CO2 measurements, locations, device info (serial/model)

### Proposed Change
**ADD user name export** for data integrity and scientific attribution:
- User names help track data quality and consistency
- Important for scientific reproducibility
- No email addresses will be exported (privacy protection)
- Names are less sensitive than emails for this public health use case

### Implementation for User Name Export
```ruby
# Update ALLOWED_FIELDS in base_service.rb:
ALLOWED_FIELDS = %w[
  measurement_id co2_ppm timestamp crowding
  lat lng place_name place_google_id
  device_serial device_model manufacturer
  is_realtime
  user_name  # ADD THIS
].freeze

# Add to build_measurement_data method:
user_name: sanitize_for_export(measurement.device&.user&.name),
```

## Critical Gaps to Address

### 1. Add Production Monitoring Gems

```ruby
# Add to Gemfile:
group :production do
  gem 'barnes'           # Memory metrics for Heroku (auto-reports to logs)
  gem 'rack-timeout'     # Request timeout protection (prevent H12 errors)
  gem 'strong_migrations' # Safe database migrations (prevent locks)
end
```

**Why these are critical**:
- `barnes`: Provides detailed memory breakdowns in Heroku logs
- `rack-timeout`: Prevents requests from hitting Heroku's 30s timeout
- `strong_migrations`: Prevents accidental production database locks during migrations

### 2. Set Critical Heroku Configuration

```bash
# MUST SET or Rails 7.1 will crash on 512MB dyno:
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
heroku config:set RAILS_MAX_THREADS=3 --app covid-co2-tracker

# Rack timeout (less than Heroku's 30s):
heroku config:set RACK_TIMEOUT_SERVICE_TIMEOUT=25 --app covid-co2-tracker

# Ruby GC optimization for 512MB:
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker
heroku config:set RUBY_GC_HEAP_INIT_SLOTS=600000 --app covid-co2-tracker
```

**Critical**: Without `WEB_CONCURRENCY=1`, Rails 7.1+ will spawn 4+ workers and immediately crash with R14 memory errors.

### 3. Create Comprehensive RSpec Test Suite

```ruby
# spec/services/export/base_service_spec.rb
RSpec.describe Export::BaseService do
  describe 'security' do
    it 'never exports user emails' do
      # Verify email field not in ALLOWED_FIELDS
    end
    
    it 'only exports user names when requested' do
      # Test user_name field inclusion
    end
  end
  
  describe 'memory safety' do
    it 'aborts export when memory exceeds 450MB' do
      # Mock memory check
    end
  end
  
  describe 'transaction safety' do
    it 'prevents exports during open transactions' do
      # Test read-only enforcement
    end
  end
end

# spec/services/export/csv_service_spec.rb
# spec/services/export/jsonl_service_spec.rb  
# spec/services/export/multi_csv_service_spec.rb
# spec/models/export_token_spec.rb
# spec/controllers/api/v1/exports_controller_spec.rb
```

**Test Coverage Required**:
- Token authentication (valid, expired, missing)
- Rate limiting (under limit, at limit, over limit)
- Memory pressure scenarios
- Streaming functionality (connection drops, timeouts)
- ZIP generation edge cases
- Cache invalidation logic
- Each export format with various filters
- Field selection and sanitization
- User name export (when included in fields)

### 4. Create API Documentation

Create `/docs/api/export-system.md`:

```markdown
# COVID CO2 Tracker Export API

## Authentication
All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### GET /api/v1/export
Export measurement data in various formats.

**Parameters:**
- `format_type`: csv, jsonl, or multi_csv (default: csv)
- `fields`: Comma-separated list of fields to include
  - Available: measurement_id, co2_ppm, timestamp, crowding, lat, lng, 
    place_name, place_google_id, device_serial, device_model, 
    manufacturer, is_realtime, user_name
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `above_ppm`: Filter for CO2 readings above this value
- `below_ppm`: Filter for CO2 readings below this value
- `place_id`: Filter by specific place
- `device_id`: Filter by specific device

**Rate Limits:** 20 requests per hour per token

**Examples:**
```bash
# CSV export with specific fields
curl -H "Authorization: Bearer TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=csv&fields=co2_ppm,timestamp,user_name"

# JSONL export for high CO2 readings
curl -H "Authorization: Bearer TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=jsonl&above_ppm=1000"

# Multi-CSV ZIP export
curl -H "Authorization: Bearer TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=multi_csv" \
  -o export.zip
```
```

### 5. Add Database Indexes for Export Performance

```ruby
# db/migrate/XXXXXX_add_export_performance_indexes.rb
class AddExportPerformanceIndexes < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!  # Allow concurrent index creation
  
  def change
    # Compound index for time-based queries with location
    add_index :measurements, [:measurementtime, :sub_location_id], 
              algorithm: :concurrently,
              name: 'index_measurements_on_time_and_location'
    
    # Index for CO2 threshold queries
    add_index :measurements, [:co2ppm, :measurementtime], 
              algorithm: :concurrently,
              name: 'index_measurements_on_co2_and_time'
    
    # Compound index for device queries (already has user_id index)
    add_index :devices, [:user_id, :id], 
              algorithm: :concurrently,
              name: 'index_devices_on_user_and_id'
  end
end
```

**Note**: Using `algorithm: :concurrently` prevents table locks during index creation.

### 6. Enhanced Error Handling

```ruby
# app/services/export/base_service.rb additions:

def handle_streaming_errors
  begin
    yield
  rescue IOError => e
    Rails.logger.error "Export stream interrupted: #{e.message}"
    # Client disconnected, clean up resources
  rescue PG::Error => e
    Rails.logger.error "Database error during export: #{e.message}"
    raise ExportError, "Database connection issue"
  rescue Redis::BaseError => e
    Rails.logger.warn "Cache unavailable, continuing without cache: #{e.message}"
    # Continue without caching
  ensure
    cleanup_resources
  end
end

# For ZIP generation, consider switching to zip_tricks:
# gem 'zip_tricks' # More robust streaming ZIP generation
```

### 7. Configure Long-Lived Export Token

```ruby
# Rails console command for production:
token = ExportToken.create!(
  description: "Public Science Data Export - Long Term",
  expires_at: 100.years.from_now,  # Effectively indefinite
  permissions: {
    formats: ["csv", "jsonl", "multi_csv"],
    max_records: 1_000_000,
    rate_limit_per_hour: 20,
    allowed_fields: ["co2_ppm", "timestamp", "lat", "lng", "user_name", 
                     "device_serial", "place_name", "crowding", "is_realtime"]
  }
)
puts "Export token created: #{token.token}"
puts "Save this token securely - it cannot be retrieved later!"
```

**Rationale for indefinite token**:
- Public health data for scientific benefit
- No sensitive data exported (only names, not emails)
- Rate limiting prevents abuse
- Token can be revoked if compromised

## Implementation Sequence

### Phase 1: Development (Local)
1. **Add monitoring gems** to Gemfile and bundle install
2. **Update ALLOWED_FIELDS** to include user_name
3. **Write comprehensive RSpec tests** (ensures nothing breaks)
4. **Add enhanced error handling** for streaming/network issues
5. **Create database migration** for indexes
6. **Run tests** to verify everything works

### Phase 2: Staging Deployment
1. Deploy to staging/review app if available
2. Run migrations with indexes
3. Create test token
4. Test all export formats
5. Monitor memory usage

### Phase 3: Production Deployment
1. **Set Heroku config vars** (CRITICAL - do this first!)
2. **Deploy code**: `git push heroku main`
3. **Run migrations**: `heroku run rails db:migrate`
4. **Create production token** with long expiration
5. **Verify endpoints** with curl tests
6. **Monitor logs** for first 24 hours

## Monitoring Checklist Post-Deployment

```bash
# Memory monitoring (should stay < 400MB):
heroku logs --tail --app covid-co2-tracker | grep "sample#memory"

# Check for errors:
heroku logs --app covid-co2-tracker | grep -E "R14|R15|H12|Error"

# Database connections (should stay < 15):
heroku pg:ps --app covid-co2-tracker

# Export usage:
heroku run rails console --app covid-co2-tracker
ExportToken.first.usage_count
```

## Risk Assessment

### Risks Mitigated
- ✅ Memory exhaustion prevented by WEB_CONCURRENCY=1
- ✅ Data integrity improved with user names
- ✅ Security maintained (no emails/passwords exported)
- ✅ Performance optimized with indexes
- ✅ Monitoring enabled with Barnes

### Remaining Risks
- ⚠️ No automated tests until we write them
- ⚠️ Network interruptions may cause partial exports
- ⚠️ Large exports could still timeout (mitigated by streaming)

### Overall Risk Level: **MEDIUM → LOW** after implementation

## Estimated Timeline
- **Gems & Config**: 30 minutes
- **User name field addition**: 15 minutes  
- **Test Suite Creation**: 2-3 hours
- **Error Handling Improvements**: 1 hour
- **Database Indexes**: 30 minutes
- **API Documentation**: 1 hour
- **Staging Testing**: 1 hour
- **Production Deployment**: 30 minutes
- **Total**: ~7-8 hours

## Success Criteria
✓ All tests passing
✓ Memory usage < 400MB during exports
✓ No R14/R15 errors in production
✓ Export token working for all formats
✓ User names included in exports (when requested)
✓ API documentation published
✓ Database queries optimized with indexes
✓ Rate limiting functioning
✓ Error handling graceful

## Notes
- The addition of user names improves scientific data quality while maintaining privacy
- Long-lived tokens are acceptable since we're not exposing sensitive data
- The export system serves public health and scientific research goals
- Monitor closely for first week after deployment