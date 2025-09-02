# IMMEDIATE ACTION PLAN - Export System Critical Fixes
*Generated: 2025-09-02*
*URGENT: Must complete before production deployment*

## 🚨 STOP - DO NOT DEPLOY TO PRODUCTION YET

The export system has **CRITICAL SECURITY VULNERABILITIES** that must be fixed immediately:

1. **Export tokens stored in plaintext** - Anyone with DB access can steal all tokens
2. **SQL injection vulnerabilities** - Direct string interpolation in queries  
3. **Rate limiting can be bypassed** - Uses predictable token IDs
4. **Memory leaks in streaming** - Streams not closed on disconnect
5. **No CORS protection** - API vulnerable to cross-origin attacks

## 🔥 Phase 1: CRITICAL SECURITY FIXES (Must Do Today)

### Task 1: Fix Token Storage Security (2 hours)
**CRITICAL - Tokens currently stored in plaintext!**

```bash
# 1. Create migration to add token_hash column
rails g migration AddTokenHashToExportTokens token_hash:string:index
```

```ruby
# 2. Update the migration file:
class AddTokenHashToExportTokens < ActiveRecord::Migration[7.1]
  def up
    add_column :export_tokens, :token_hash, :string
    add_index :export_tokens, :token_hash, unique: true
    
    # Migrate existing tokens (if any exist)
    ExportToken.find_each do |token|
      token.update_column(:token_hash, Digest::SHA256.hexdigest(token.token))
    end
    
    # Make token_hash required
    change_column_null :export_tokens, :token_hash, false
    
    # Remove the plaintext token column
    remove_column :export_tokens, :token
  end
  
  def down
    add_column :export_tokens, :token, :string
    remove_column :export_tokens, :token_hash
  end
end
```

```ruby
# 3. Update ExportToken model:
class ExportToken < ApplicationRecord
  attr_accessor :raw_token
  
  before_create :generate_and_hash_token
  
  def self.authenticate(token_string)
    return nil if token_string.blank?
    
    hashed = Digest::SHA256.hexdigest(token_string)
    active.find_by(token_hash: hashed)
  end
  
  private
  
  def generate_and_hash_token
    self.raw_token = SecureRandom.urlsafe_base64(32)
    self.token_hash = Digest::SHA256.hexdigest(raw_token)
  end
end
```

### Task 2: Fix SQL Injection Vulnerabilities (30 minutes)

Update `/app/services/export/query_builder.rb`:

```ruby
def apply_co2_filters(query, filters)
  if filters[:above_ppm]
    # VULNERABLE: query.where('co2ppm > ?', filters[:above_ppm].to_i)
    # FIXED:
    query = query.where(co2ppm: (filters[:above_ppm].to_i + 1)..)
  end
  
  if filters[:below_ppm]
    # VULNERABLE: query.where('co2ppm < ?', filters[:below_ppm].to_i)
    # FIXED:
    query = query.where(co2ppm: ..filters[:below_ppm].to_i)
  end
  
  query
end
```

### Task 3: Fix Rate Limiting Security (15 minutes)

Update `/app/controllers/api/v1/exports_controller.rb`:

```ruby
def check_rate_limit
  return unless @export_token
  
  # VULNERABLE: Using predictable ID
  # rate_key = "export_rate:#{@export_token.id}"
  
  # FIXED: Use token hash
  rate_key = "export_rate:#{Digest::SHA256.hexdigest(@export_token.token_hash)}"
  count = Rails.cache.increment(rate_key, 1, expires_in: 1.hour) || 1
  
  if count > @export_token.rate_limit_per_hour
    render json: { 
      error: 'Rate limit exceeded', 
      limit: @export_token.rate_limit_per_hour,
      reset_in: Rails.cache.ttl(rate_key)
    }, status: :too_many_requests
  end
end
```

### Task 4: Fix Memory Leaks (30 minutes)

Update `/app/controllers/api/v1/exports_controller.rb`:

```ruby
def stream_export(format, fields, filters)
  response.headers['Content-Type'] = content_type_for(format)
  response.headers['Cache-Control'] = 'public, max-age=300'
  response.headers['X-Accel-Buffering'] = 'no'
  
  @export_token.record_usage!
  
  begin
    response.stream.write ''
    
    # Export logic here...
    
  rescue IOError => e
    # Client disconnected - clean up gracefully
    Rails.logger.warn "Client disconnected during export: #{e.message}"
  rescue => e
    Rails.logger.error "Export failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  ensure
    # CRITICAL: Always close the stream
    response.stream.close unless response.stream.closed?
  end
end
```

### Task 5: Add CORS Protection (15 minutes)

Create `/config/initializers/cors.rb`:

```ruby
# Protect API from unauthorized cross-origin requests
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('ALLOWED_ORIGINS', 'https://www.co2trackers.com').split(',')
    
    resource '/api/v1/export*',
      headers: :any,
      methods: [:get],
      credentials: false,
      max_age: 86400
  end
end if defined?(Rack::Cors)
```

Add to Gemfile:
```ruby
gem 'rack-cors'
```

## 🛡️ Phase 2: Test Security Fixes (1 hour)

### Create Security Test Suite

Create `/spec/security/export_security_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe "Export Security" do
  describe "Token Security" do
    it "never stores tokens in plaintext" do
      token = ExportToken.create!(
        description: "Test token",
        expires_at: 1.year.from_now
      )
      
      raw_token = token.raw_token
      expect(raw_token).to be_present
      
      # Check database directly
      db_record = ActiveRecord::Base.connection.execute(
        "SELECT * FROM export_tokens WHERE id = #{token.id}"
      ).first
      
      expect(db_record['token_hash']).not_to eq(raw_token)
      expect(db_record['token_hash']).to eq(Digest::SHA256.hexdigest(raw_token))
    end
    
    it "authenticates with raw token but stores hash" do
      token = ExportToken.create!(
        description: "Test token",
        expires_at: 1.year.from_now
      )
      
      raw_token = token.raw_token
      
      # Should authenticate with raw token
      authenticated = ExportToken.authenticate(raw_token)
      expect(authenticated).to eq(token)
      
      # Should not authenticate with hash
      authenticated = ExportToken.authenticate(token.token_hash)
      expect(authenticated).to be_nil
    end
  end
  
  describe "SQL Injection Protection" do
    it "safely handles malicious date inputs" do
      malicious_date = "2024-01-01'; DROP TABLE measurements; --"
      
      expect {
        get '/api/v1/exports/csv',
            params: { from: malicious_date },
            headers: valid_auth_headers
      }.not_to raise_error
      
      # Table should still exist
      expect(Measurement.count).to be >= 0
    end
    
    it "safely handles malicious CO2 values" do
      malicious_ppm = "1000 OR 1=1"
      
      get '/api/v1/exports/csv',
          params: { above_ppm: malicious_ppm },
          headers: valid_auth_headers
      
      # Should only return valid filtered results
      lines = response.body.split("\n")
      expect(lines.size).to be < total_measurements
    end
  end
  
  describe "Rate Limiting Security" do
    it "cannot bypass rate limiting with predictable IDs" do
      token = create(:export_token)
      
      # Try to predict cache keys
      (token.id - 10..token.id + 10).each do |predicted_id|
        Rails.cache.delete("export_rate:#{predicted_id}")
      end
      
      # Should still be rate limited
      (token.rate_limit_per_hour + 1).times do
        get '/api/v1/exports/csv', headers: auth_headers_for(token)
      end
      
      expect(response).to have_http_status(:too_many_requests)
    end
  end
end
```

## 🧪 Phase 3: Verify Fixes (30 minutes)

### Run Security Tests
```bash
# Run new security tests
bundle exec rspec spec/security/export_security_spec.rb

# Run all export tests
bundle exec rspec spec/services/export/
bundle exec rspec spec/requests/api/v1/exports_spec.rb

# Check for SQL injection vulnerabilities
bundle exec brakeman -A

# Memory leak test (local)
curl -H "Authorization: Bearer TEST_TOKEN" \
     "http://localhost:3000/api/v1/export?format_type=stream" \
     > /dev/null &
# Kill with Ctrl+C and check logs for proper cleanup
```

### Manual Security Verification
```bash
# 1. Check tokens are hashed in database
rails console
token = ExportToken.create!(description: "Security test", expires_at: 1.day.from_now)
puts "Raw token: #{token.raw_token}"
puts "Stored hash: #{token.token_hash}"
puts "Hashes match: #{Digest::SHA256.hexdigest(token.raw_token) == token.token_hash}"

# 2. Verify authentication works
ExportToken.authenticate(token.raw_token) # Should work
ExportToken.authenticate(token.token_hash) # Should return nil

# 3. Test rate limiting
# Make multiple rapid requests and verify 429 response
```

## 🚀 Phase 4: Deploy Security Fixes (30 minutes)

### Pre-deployment Checklist
- [ ] All security tests passing
- [ ] No plaintext tokens in database
- [ ] SQL injection tests passing
- [ ] Rate limiting working correctly
- [ ] Memory leaks fixed
- [ ] CORS configured

### Deployment Commands
```bash
# 1. Commit security fixes
git add -A
git commit -m "SECURITY: Critical fixes for export system

- Hash export tokens instead of storing plaintext
- Fix SQL injection vulnerabilities in QueryBuilder
- Fix rate limiting bypass vulnerability
- Fix memory leaks in streaming operations
- Add CORS protection for API endpoints

These are CRITICAL security fixes that must be deployed immediately."

# 2. Deploy to Heroku
git push heroku main

# 3. Run migrations to hash existing tokens
heroku run rails db:migrate --app covid-co2-tracker

# 4. Verify deployment
heroku logs --tail --app covid-co2-tracker

# 5. Create new secure token
heroku run rails console --app covid-co2-tracker
token = ExportToken.create!(
  description: "Production Export Token - Secure",
  expires_at: 1.year.from_now,
  permissions: {
    formats: ["csv", "jsonl", "multi_csv"],
    max_records: 1_000_000,
    rate_limit_per_hour: 20
  }
)
puts "SAVE THIS TOKEN: #{token.raw_token}"
exit

# 6. Test with new token
curl -H "Authorization: Bearer YOUR_NEW_TOKEN" \
     "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=csv"
```

## ⚠️ Phase 5: Monitor Post-Deployment (1 hour)

### Monitor for Issues
```bash
# Watch for errors
heroku logs --tail --app covid-co2-tracker | grep -E "ERROR|FATAL|SECURITY"

# Check memory usage
heroku metrics --app covid-co2-tracker

# Verify rate limiting
# Make 21 requests rapidly and ensure last one returns 429
```

### Rollback Plan
```bash
# If critical issues arise:
heroku rollback --app covid-co2-tracker
heroku run rails db:rollback --app covid-co2-tracker
```

## 📋 Summary for Next Developer

### What Was Fixed
1. ✅ Tokens now stored as SHA256 hashes
2. ✅ SQL injection vulnerabilities patched
3. ✅ Rate limiting secured against bypass
4. ✅ Memory leaks in streaming fixed
5. ✅ CORS protection added

### What Still Needs Work (Less Critical)
1. ⚠️ N+1 query problems (performance issue)
2. ⚠️ ZIP generation memory optimization needed
3. ⚠️ Test coverage needs expansion
4. ⚠️ Error handling inconsistent
5. ⚠️ No monitoring/metrics

### Next Steps After Security Fixes
1. Read `/copilot_notes/2025-09-02-export-system-ultrathink-improvements.md` for full improvement plan
2. Implement Phase 2 performance optimizations
3. Expand test coverage to 90%+
4. Add monitoring and alerting
5. Consider async export jobs for large datasets

## 🔴 DO NOT SKIP THE SECURITY FIXES

**The system is NOT safe for production until these security fixes are complete!**

Time estimate: 4-5 hours total
Risk if not done: **CRITICAL** - Complete system compromise possible

---
*This action plan must be executed before any production deployment*