# Security Deployment Guide for COVID CO2 Tracker Export System

## Overview
This guide provides step-by-step instructions for deploying critical security fixes to the production environment. All 5 vulnerabilities have been patched and tested.

## Security Fixes Summary
- ✅ **Token Hashing**: SHA256 hashing implemented for all export tokens
- ✅ **SQL Injection Prevention**: Parameterized queries with named placeholders
- ✅ **Rate Limiting**: Secure rate limiting using token hash keys
- ✅ **Memory Leak Prevention**: Proper resource cleanup and garbage collection
- ✅ **CORS Configuration**: Environment-based origin whitelisting

---

## Pre-Deployment Checklist

### Environment Preparation
- [ ] Backup production database
- [ ] Set `ALLOWED_ORIGINS` environment variable
- [ ] Prepare for 5-10 minutes of maintenance window
- [ ] Have rollback plan ready
- [ ] Notify team of deployment

### Local Verification
```bash
# Run security test suite locally
bundle exec rspec spec/security/export_system_security_spec.rb

# Run Brakeman security scan
bundle exec brakeman -A -w2 --except CrossSiteScripting

# Check for any pending migrations
bundle exec rails db:migrate:status
```

---

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# On Heroku
heroku config:set ALLOWED_ORIGINS="https://yourapp.com,https://api.yourapp.com" --app your-app-name

# Verify settings
heroku config:get ALLOWED_ORIGINS --app your-app-name
```

### Step 2: Deploy Code

```bash
# Push to Heroku
git push heroku main

# Or if using a different branch
git push heroku your-branch:main
```

### Step 3: Run Database Migration

```bash
# Run the token hashing migration
heroku run rails db:migrate --app your-app-name

# Verify migration completed
heroku run rails db:migrate:status --app your-app-name

# You should see:
# up     20250903001159  Add token hash to export tokens
```

### Step 4: Regenerate All Export Tokens

```bash
# Open Rails console on production
heroku run rails console --app your-app-name

# Run token regeneration script
ExportToken.find_each do |token|
  # Store old description and permissions
  desc = token.description
  perms = token.permissions
  expires = token.expires_at
  
  # Create new token with same settings
  new_token = ExportToken.create!(
    description: "#{desc} (regenerated #{Date.today})",
    permissions: perms,
    expires_at: expires
  )
  
  # Print new token for distribution
  puts "Token ID #{token.id} -> New Token: #{new_token.raw_token}"
  puts "Description: #{new_token.description}"
  puts "---"
  
  # Mark old token as expired
  token.update!(expires_at: 1.minute.ago, description: "#{desc} [EXPIRED - REGENERATED]")
end

# Verify all tokens have been regenerated
puts "Active tokens: #{ExportToken.active.count}"
puts "Expired tokens: #{ExportToken.expired.count}"
```

### Step 5: Remove Old Token Column (CRITICAL - AFTER VERIFICATION ONLY)

```bash
# First verify the migration worked
heroku run rails console --app your-app-name

# Check that token_hash is populated
ExportToken.pluck(:token_hash).compact.count == ExportToken.count
# Should return true

# If verified, create and run cleanup migration
cat > db/migrate/$(date +%Y%m%d%H%M%S)_remove_old_token_column.rb << 'EOF'
class RemoveOldTokenColumn < ActiveRecord::Migration[7.1]
  def change
    remove_column :export_tokens, :token, :string
  end
end
EOF

# Deploy and run
git add db/migrate/
git commit -m "Remove old plaintext token column after successful migration"
git push heroku main
heroku run rails db:migrate --app your-app-name
```

---

## Post-Deployment Verification

### Step 1: Test Token Authentication

```bash
# Get a test token from console
heroku run rails console --app your-app-name
test_token = ExportToken.active.first
puts test_token.raw_token  # Save this for testing

# Test API with new token
curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
     https://yourapp.com/api/v1/exports?format_type=csv

# Should return CSV data
```

### Step 2: Verify Rate Limiting

```bash
# Make multiple requests rapidly
for i in {1..15}; do
  curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
       https://yourapp.com/api/v1/exports?format_type=csv \
       -o /dev/null -s -w "%{http_code}\n"
done

# Should see:
# 200 (first 10 requests - default limit)
# 429 (requests 11-15 - rate limited)
```

### Step 3: Test CORS Configuration

```bash
# Test from allowed origin
curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
     -H "Origin: https://yourapp.com" \
     -I https://yourapp.com/api/v1/exports?format_type=csv

# Should include: Access-Control-Allow-Origin: https://yourapp.com

# Test from disallowed origin
curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
     -H "Origin: https://evil.com" \
     -I https://yourapp.com/api/v1/exports?format_type=csv

# Should NOT include Access-Control-Allow-Origin header
```

### Step 4: Run Security Scan

```bash
# Run Brakeman scan on production code
heroku run bash --app your-app-name
bundle exec brakeman -A -w2 --except CrossSiteScripting

# Should show:
# - No SQL injection warnings
# - No mass assignment warnings
# - No authentication warnings
```

### Step 5: Monitor Application Logs

```bash
# Watch for any errors
heroku logs --tail --app your-app-name

# Check for:
# - Successful token authentications
# - Rate limit enforcements
# - No memory warnings
# - No SQL errors
```

---

## Monitoring Setup

### Configure Alerts

```bash
# Set up Heroku alerts for memory usage
heroku alerts:add memory_quota --app your-app-name

# Set up error tracking (if using Rollbar/Sentry)
heroku addons:create rollbar:free --app your-app-name
# OR
heroku addons:create sentry:f0 --app your-app-name
```

### Log Monitoring Commands

```bash
# Monitor authentication failures
heroku logs --app your-app-name | grep "Invalid or expired token"

# Monitor rate limit violations
heroku logs --app your-app-name | grep "Rate limit exceeded"

# Monitor memory usage
heroku ps --app your-app-name
```

---

## Rollback Plan

If any issues arise during deployment:

### Immediate Rollback

```bash
# Rollback to previous release
heroku rollback --app your-app-name

# Check rollback status
heroku releases --app your-app-name
```

### Database Rollback (if needed)

```bash
# Only if absolutely necessary - this is destructive!
heroku run rails db:rollback STEP=1 --app your-app-name

# Restore tokens from backup
heroku run rails console --app your-app-name
# Run restoration script based on your backup
```

### Emergency Token Generation

If tokens are inaccessible:

```bash
heroku run rails console --app your-app-name

# Create emergency admin token
emergency_token = ExportToken.create!(
  description: "EMERGENCY TOKEN - #{Time.current}",
  expires_at: 1.hour.from_now,
  permissions: { formats: ['csv', 'json'], rate_limit_per_hour: 100 }
)
puts "Emergency token: #{emergency_token.raw_token}"
puts "Expires at: #{emergency_token.expires_at}"
```

---

## Security Best Practices Going Forward

### Token Management
1. **Rotate tokens quarterly** - Set calendar reminders
2. **Use separate tokens per client** - Never share tokens
3. **Set appropriate expiration** - Maximum 1 year
4. **Monitor usage** - Check `last_used_at` regularly

### Monitoring
1. **Daily log review** - Check for suspicious patterns
2. **Weekly security scan** - Run Brakeman
3. **Monthly token audit** - Review active tokens
4. **Quarterly penetration test** - Use OWASP ZAP or similar

### Code Review
1. **Review all SQL queries** - Ensure parameterization
2. **Check new endpoints** - Verify authentication
3. **Test rate limits** - Confirm enforcement
4. **Validate CORS changes** - Test origin restrictions

---

## Troubleshooting

### Common Issues and Solutions

#### Token Authentication Failures
```bash
# Check token exists and is active
heroku run rails console --app your-app-name
token = ExportToken.find_by(description: 'Your Token Description')
puts "Active: #{token.active?}"
puts "Expires: #{token.expires_at}"
puts "Hash exists: #{token.token_hash.present?}"
```

#### Rate Limiting Not Working
```bash
# Clear Redis cache if using Redis
heroku run rails console --app your-app-name
Rails.cache.clear

# Or restart dynos
heroku restart --app your-app-name
```

#### CORS Errors
```bash
# Verify environment variable
heroku config:get ALLOWED_ORIGINS --app your-app-name

# Restart to pick up changes
heroku restart --app your-app-name
```

#### Memory Issues
```bash
# Scale up if needed
heroku ps:scale web=1:standard-2x --app your-app-name

# Monitor memory
heroku logs --app your-app-name | grep "Memory quota"
```

---

## Contact Information

### Escalation Path
1. **Development Team Lead** - For code issues
2. **DevOps Team** - For deployment issues
3. **Security Team** - For security concerns
4. **On-Call Engineer** - For production emergencies

### Documentation
- Security Test Suite: `/spec/security/export_system_security_spec.rb`
- API Documentation: `/docs/api/exports.md`
- Token Management: `/app/models/export_token.rb`

---

## Sign-off Checklist

Before marking deployment complete:

- [ ] All pre-deployment checks passed
- [ ] Code deployed successfully
- [ ] Database migration completed
- [ ] Tokens regenerated and distributed
- [ ] All verification tests passed
- [ ] Monitoring configured
- [ ] Team notified of completion
- [ ] Documentation updated
- [ ] Backup verified

**Deployment Date:** _______________
**Deployed By:** _______________
**Verified By:** _______________

---

*This guide should be reviewed and updated after each deployment to incorporate lessons learned.*