# Export System Production Deployment Commands
*Exact commands to deploy and verify the export system on Heroku*

## PRE-DEPLOYMENT: Critical Configuration

**MUST DO FIRST - Set WEB_CONCURRENCY to prevent immediate crash**:
```bash
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
```

## Step 1: Deploy Code with Export System

```bash
# Ensure you're on the right branch with export system
git status
git log --oneline -5  # Should show export-related commits

# Deploy to Heroku
git push heroku main

# Monitor deployment
heroku logs --tail --app covid-co2-tracker
```

## Step 2: Run Export Token Migration

```bash
# Run the migration to create export_tokens table
heroku run rails db:migrate --app covid-co2-tracker

# Verify migration succeeded
heroku run rails db:migrate:status --app covid-co2-tracker | grep export_tokens
# Should show: up    [timestamp]  Create export tokens
```

## Step 3: Create Production Export Token

```bash
# Create token via Rails console
heroku run rails console --app covid-co2-tracker

# In console, run:
token = ExportToken.create!(
  description: "AirSpot Production API",
  expires_at: 1.year.from_now,
  permissions: {
    formats: ["csv", "jsonl", "multi_csv"],
    max_records: 100000,
    rate_limit_per_hour: 20
  }
)
puts "Token created: #{token.token}"
puts "Expires: #{token.expires_at}"
exit
```

**Save the token securely** - it cannot be retrieved later!

## Step 4: Verify Export Endpoints

```bash
# Set the token as environment variable for testing
export EXPORT_TOKEN="[token-from-step-3]"

# Test CSV export
curl -I -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=csv"
# Should return: HTTP/1.1 200 OK

# Test JSONL export with filter
curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=jsonl&limit=5"
# Should return: 5 JSON lines of data

# Test multi-CSV ZIP export
curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=multi_csv" \
  -o test_export.zip
unzip -l test_export.zip
# Should show: measurements.csv, places.csv, sub_locations.csv, devices.csv, manifest.json
```

## Step 5: Monitor Memory Usage

```bash
# Check memory after exports
heroku logs --app covid-co2-tracker | grep "sample#memory"
# Should be < 400MB

# Check for R14 errors
heroku logs --app covid-co2-tracker | grep "R14"
# Should return nothing
```

## Step 6: Performance Verification

```bash
# Check response times
heroku logs --app covid-co2-tracker | grep "service=" | tail -20
# Export endpoints should be < 5000ms for small datasets

# Monitor active database connections
heroku pg:ps --app covid-co2-tracker
# Should show < 10 connections with single dyno
```

## Rollback Commands (if needed)

```bash
# If exports cause issues, rollback immediately:
heroku rollback --app covid-co2-tracker

# Disable problematic endpoints via maintenance mode
heroku maintenance:on --app covid-co2-tracker

# Remove export_tokens table if necessary
heroku run rails db:rollback STEP=1 --app covid-co2-tracker

# Re-enable after fix
heroku maintenance:off --app covid-co2-tracker
```

## Post-Deployment Monitoring

```bash
# Set up continuous monitoring
heroku logs --tail --app covid-co2-tracker | grep -E "export|Export|R14|memory"

# Check token usage
heroku run rails runner "puts ExportToken.first.usage_count" --app covid-co2-tracker
```

## Success Criteria

✓ All export formats return data without errors
✓ Memory usage stays below 400MB
✓ No R14/R15 errors in logs
✓ Response times < 5 seconds for normal queries
✓ Database connections < 15 (leaving headroom)
✓ Export token authentication works
✓ Rate limiting prevents abuse

## Important Notes

- **Token Security**: Never commit tokens to git or expose in logs
- **Memory Monitoring**: Watch memory closely for first 24 hours
- **Database Connections**: Monitor pg:ps regularly during peak usage
- **Scaling Decision**: If consistent R14 errors, must upgrade to Standard-2X