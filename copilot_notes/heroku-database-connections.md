# Database Connection Management Guide
*For Heroku Essential-1 (20-connection limit) - COVID CO2 Tracker*

## The 20-Connection Constraint

**Essential-1 Database Limits**:
- **Total connections**: 20 maximum
- **No connection pooling**: Each Rails thread = 1 connection
- **No automatic cleanup**: Stuck connections stay stuck
- **No followers**: Can't scale read operations

## Connection Distribution Formula

**For our 512MB/20-connection setup**:
```
Current Setup (1 web dyno):
- Web dyno: 3 connections (RAILS_MAX_THREADS=3)
- Admin/background tasks: 2 connections
- Heroku operations: 2 connections reserved
- Safety buffer: 3 connections
Total used: 10/20 connections

Maximum Scale (without PgBouncer):
- 6 web dynos × 3 connections = 18 connections
- 2 connections reserved for operations
Total: 20/20 connections (no buffer - risky!)
```

## Current Database Configuration

**config/database.yml** (MUST match these settings):
```yaml
production:
  url: <%= ENV['DATABASE_URL'] %>
  # CRITICAL: Pool size must match RAILS_MAX_THREADS
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>
  # Aggressive timeout to prevent stuck connections
  checkout_timeout: 5
  # Clean up idle connections quickly
  reaping_frequency: 10
  # Required for PgBouncer compatibility (if added later)
  prepared_statements: false
  advisory_locks: false
```

**Environment Variables**:
```bash
heroku config:set RAILS_MAX_THREADS=3 --app covid-co2-tracker
# This sets database pool size to 3 connections per dyno
```

## Connection Monitoring Commands

**Check active connections** (run frequently):
```bash
# See all active connections
heroku pg:ps --app covid-co2-tracker

# Count connections by state
heroku pg:psql --app covid-co2-tracker -c "
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = current_database() 
GROUP BY state;"
```

**Example healthy output**:
```
 state  | count 
--------+-------
 active |     2
 idle   |     4
        |     1
(3 rows)
```

**Check connection usage over time**:
```bash
# Monitor connection count (run every 30 seconds)
watch -n 30 "heroku pg:psql --app covid-co2-tracker -c \"SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database();\""
```

## Connection Limits by Dyno Scale

**Safe Scaling Guidelines**:
```bash
# 1 dyno = 3 connections (current, safe)
heroku ps:scale web=1 --app covid-co2-tracker

# 2 dynos = 6 connections (safe)
heroku ps:scale web=2 --app covid-co2-tracker

# 3 dynos = 9 connections (safe with monitoring)
heroku ps:scale web=3 --app covid-co2-tracker

# 4 dynos = 12 connections (monitor closely)
heroku ps:scale web=4 --app covid-co2-tracker

# 5 dynos = 15 connections (warning threshold)
heroku ps:scale web=5 --app covid-co2-tracker

# 6 dynos = 18 connections (MAXIMUM - no safety buffer)
heroku ps:scale web=6 --app covid-co2-tracker

# 7+ dynos = WILL FAIL with connection errors
```

## PgBouncer Setup (Connection Pooling)

**When to add PgBouncer**:
- Approaching 15+ connections regularly
- Need to scale beyond 5 dynos
- Experiencing connection exhaustion
- Want to add background workers

**Installation**:
```bash
# Add PgBouncer buildpack
heroku buildpacks:add --index 1 heroku/pgbouncer --app covid-co2-tracker

# Update Procfile (create if doesn't exist)
echo "web: bin/start-pgbouncer-stunnel bundle exec puma -C config/puma.rb" > Procfile

# Commit and deploy
git add Procfile
git commit -m "Add PgBouncer for connection pooling"
git push heroku main
```

**PgBouncer Configuration**:
```bash
# Set pool mode (transaction pooling is most efficient)
heroku config:set PGBOUNCER_DEFAULT_POOL_SIZE=25 --app covid-co2-tracker
heroku config:set PGBOUNCER_POOL_MODE=transaction --app covid-co2-tracker
```

**With PgBouncer, you can scale to**:
```
Up to 10+ dynos safely:
- Each dyno: 3 Rails connections to PgBouncer
- PgBouncer: 20 connections to actual database
- Much better connection reuse
```

## Connection Exhaustion Recovery

**Symptoms of connection exhaustion**:
```
PG::ConnectionBad: FATAL: remaining connection slots are reserved
ActiveRecord::ConnectionTimeoutError: could not obtain a database connection
```

**Emergency Recovery Procedure**:
```bash
#!/bin/bash
# Save as scripts/connection_emergency.sh
APP=covid-co2-tracker

echo "🚨 DATABASE CONNECTION EMERGENCY"

# 1. Check current connection count
echo "Current connections:"
heroku pg:psql --app $APP -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();"

# 2. Kill ALL connections (nuclear option)
heroku pg:killall --app $APP

# 3. Restart application to clean up
heroku restart --app $APP

# 4. Scale down to reduce pressure
heroku ps:scale web=1 --app $APP

# 5. Wait for recovery
sleep 30

# 6. Check connection count again
heroku pg:ps --app $APP | head -10
```

**Gradual Recovery** (preferred when not in crisis):
```bash
# 1. Identify stuck connections
heroku pg:psql --app covid-co2-tracker -c "
SELECT pid, state, query_start, state_change, query 
FROM pg_stat_activity 
WHERE datname = current_database() 
AND state != 'idle' 
ORDER BY query_start;"

# 2. Kill specific stuck connections (replace PID)
heroku pg:kill 12345 --app covid-co2-tracker

# 3. Monitor recovery
heroku pg:ps --app covid-co2-tracker
```

## Connection Health Monitoring

**Daily Health Check**:
```bash
# One-liner connection health check
heroku pg:psql --app covid-co2-tracker -c "SELECT count(*) as total_connections, count(*) FILTER (WHERE state = 'active') as active, count(*) FILTER (WHERE state = 'idle') as idle FROM pg_stat_activity WHERE datname = current_database();"
```

**Expected healthy output**:
```
 total_connections | active | idle 
------------------+--------+------
                 5 |      1 |    4
```

**Warning Signs**:
- Total connections >15
- Active connections >10 
- Idle connections >8
- Any connection running >5 minutes

**Set up alerts in your monitoring**:
```bash
# Add to your monitoring script
CONNECTION_COUNT=$(heroku pg:psql --app covid-co2-tracker -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();")

if [ $CONNECTION_COUNT -gt 15 ]; then
  echo "⚠️  HIGH CONNECTION COUNT: $CONNECTION_COUNT/20"
fi

if [ $CONNECTION_COUNT -gt 18 ]; then
  echo "🚨 CRITICAL CONNECTION COUNT: $CONNECTION_COUNT/20"
  # Send alert/notification
fi
```

## Long-Running Query Management

**Find long-running queries**:
```bash
heroku pg:psql --app covid-co2-tracker -c "
SELECT 
  pid, 
  now() - pg_stat_activity.query_start AS duration, 
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active'
  AND datname = current_database();"
```

**Kill specific long-running query**:
```bash
# Replace 12345 with actual PID from above query
heroku pg:kill 12345 --app covid-co2-tracker
```

## Application-Level Connection Optimization

**Use find_each for large datasets**:
```ruby
# BAD: Uses one connection for entire operation
Co2Reading.all.each do |reading|
  process_reading(reading)
end

# GOOD: Releases connection between batches
Co2Reading.find_each(batch_size: 1000) do |reading|
  process_reading(reading)
end
```

**Explicit connection management for streaming**:
```ruby
class ExportsController < ApplicationController
  include ActionController::Live
  
  def stream_export
    # Acquire connection explicitly
    ActiveRecord::Base.connection_pool.with_connection do |conn|
      # Stream data with explicit connection
      Co2Reading.find_each(batch_size: 1000) do |reading|
        response.stream.write reading.to_json
      end
    end
    # Connection automatically released
  ensure
    response.stream.close
  end
end
```

## Connection Upgrade Path

**When to upgrade to Essential-2 ($20/month)**:
- Consistently using >15 connections
- Need to scale beyond 5 dynos
- Adding background workers
- Connection exhaustion incidents

**Essential-2 Benefits**:
- 50 connections (vs 20)
- Can scale to 15+ dynos safely
- Better performance under load
- Point-in-time recovery

**Standard-0 Upgrade ($50/month)**:
- 120 connections
- Built-in connection pooling
- Database followers for read scaling
- Automatic backups

## Emergency Procedures by Scenario

**Scenario 1: "Can't get database connection"**
```bash
# Quick fix
heroku restart --app covid-co2-tracker

# If persistent
heroku pg:killall --app covid-co2-tracker
heroku ps:scale web=1 --app covid-co2-tracker
```

**Scenario 2: Stuck at exactly 20 connections**
```bash
# Force connection cleanup
heroku pg:killall --app covid-co2-tracker
# Scale down temporarily
heroku ps:scale web=1 --app covid-co2-tracker
```

**Scenario 3: Regular connection exhaustion**
```bash
# Time to add PgBouncer or upgrade database
heroku addons:upgrade heroku-postgresql:essential-2 --app covid-co2-tracker
```

## Connection Monitoring Dashboard

**Create a simple monitoring script**:
```bash
#!/bin/bash
# scripts/monitor_connections.sh
APP=covid-co2-tracker

while true; do
  CONN_COUNT=$(heroku pg:psql --app $APP -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();" | tr -d ' ')
  ACTIVE_COUNT=$(heroku pg:psql --app $APP -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active';" | tr -d ' ')
  
  echo "$(date): Total: $CONN_COUNT/20, Active: $ACTIVE_COUNT"
  
  if [ $CONN_COUNT -gt 15 ]; then
    echo "⚠️  WARNING: High connection count"
  fi
  
  sleep 60
done
```

Following these guidelines ensures you stay within the 20-connection limit while maximizing your application's ability to scale and handle concurrent users effectively.