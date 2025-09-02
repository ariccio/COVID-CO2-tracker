# Heroku Problem-Solution Map
*Error Code Reference for COVID CO2 Tracker Production*

## Memory Errors (Most Critical)

### R14 - Memory Quota Exceeded
**Error Pattern**: `Error R14 (Memory quota exceeded)`
**Cause**: Process using >512MB RAM
**Root Cause**: Usually WEB_CONCURRENCY > 1 on Rails 7.1+

**Immediate Solution**:
```bash
heroku restart --app covid-co2-tracker
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
```

**Prevention**:
```bash
# Set these BEFORE deployment
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker
```

### R15 - Memory Quota Vastly Exceeded  
**Error Pattern**: `Error R15 (Memory quota vastly exceeded)`
**Cause**: Process using >1GB RAM (immediate termination)
**Root Cause**: Memory leak or multiple workers

**Emergency Solution**:
```bash
#!/bin/bash
# Emergency memory recovery
heroku restart --app covid-co2-tracker
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker
# Monitor recovery
heroku logs --tail --app covid-co2-tracker | grep "memory\|R14\|R15"
```

## Request Timeout Errors

### H12 - Request Timeout  
**Error Pattern**: `Error H12 (Request timeout)`
**Cause**: Request took >30 seconds to respond
**Root Cause**: Usually streaming operations or slow database queries

**For Streaming Operations** (most likely):
```ruby
# Add to streaming controllers
response.headers['X-Accel-Buffering'] = 'no'
response.headers['Cache-Control'] = 'no-cache'

# Send immediate response
response.stream.write ""
response.stream.flush

# Then do work...
```

**For Database Operations**:
```bash
# Check for slow queries
heroku pg:outliers --app covid-co2-tracker

# Kill stuck queries
heroku pg:kill <pid> --app covid-co2-tracker
```

### H15 - Idle Connection Timeout
**Error Pattern**: `Error H15 (Idle connection)`
**Cause**: No data sent for >55 seconds in streaming connection
**Root Cause**: Normal for long streams, needs heartbeat

**Solution**:
```ruby
# Add heartbeat to streaming operations
loop do
  # Send data or heartbeat every 20 seconds
  response.stream.write "data: #{data.to_json}\n\n"
  sleep 20
end
```

## Database Connection Errors

### PG::ConnectionBad - Connection Failed
**Error Pattern**: `PG::ConnectionBad: FATAL: remaining connection slots are reserved`
**Cause**: Hit 20-connection limit on Essential-1
**Root Cause**: Too many dynos or stuck connections

**Immediate Fix**:
```bash
# Nuclear option - kills all connections
heroku pg:killall --app covid-co2-tracker
heroku restart --app covid-co2-tracker
```

**Check Connection Usage**:
```bash
# See current connections
heroku pg:ps --app covid-co2-tracker

# Count by state
heroku pg:psql --app covid-co2-tracker -c "
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = current_database() 
GROUP BY state;"
```

**Scale Down if Needed**:
```bash
# Temporarily scale to 1 dyno
heroku ps:scale web=1 --app covid-co2-tracker
```

### ActiveRecord::ConnectionTimeoutError
**Error Pattern**: `ActiveRecord::ConnectionTimeoutError: could not obtain a database connection`
**Cause**: Rails can't get connection from pool within timeout
**Root Cause**: All connections busy or pool exhausted

**Solutions**:
```bash
# 1. Restart to clear pool
heroku restart --app covid-co2-tracker

# 2. Check database.yml pool size matches RAILS_MAX_THREADS
heroku config --app covid-co2-tracker | grep RAILS_MAX_THREADS

# 3. Consider PgBouncer if persistent
heroku buildpacks:add --index 1 heroku/pgbouncer --app covid-co2-tracker
```

## Application Boot Errors

### R10 - Boot Timeout
**Error Pattern**: `Error R10 (Boot timeout)`
**Cause**: App didn't bind to $PORT within 60 seconds
**Root Cause**: Usually database connection issues or asset compilation

**Check Boot Process**:
```bash
heroku logs --app covid-co2-tracker | grep "Starting\|Listening"
```

**Common Fixes**:
```bash
# 1. Check database connectivity
heroku pg:info --app covid-co2-tracker

# 2. Verify Puma configuration
heroku config --app covid-co2-tracker | grep WEB_CONCURRENCY

# 3. Clear buildpack cache if assets issue
heroku plugins:install heroku-repo
heroku repo:purge_cache --app covid-co2-tracker
```

### R12 - Exit Timeout  
**Error Pattern**: `Error R12 (Exit timeout)`
**Cause**: Process didn't exit within 30 seconds of SIGTERM
**Root Cause**: Graceful shutdown issues, usually streaming connections

**Add to Puma Config**:
```ruby
# config/puma.rb
on_worker_shutdown do
  # Close streaming connections
  ActiveSupport::Notifications.publish('worker.shutdown')
end
```

## Deployment Errors

### Git Push Rejected
**Error Pattern**: `Updates were rejected because the remote contains work`
**Cause**: Heroku has commits not in local branch
**Solution**:
```bash
git pull heroku main
git push heroku main
```

### Migration Errors
**Error Pattern**: `PG::Error during db:migrate`
**Cause**: Migration failed, database in inconsistent state
**Recovery**:
```bash
# Check migration status
heroku run rails db:migrate:status --app covid-co2-tracker

# Rollback if needed
heroku run rails db:rollback --app covid-co2-tracker

# Fix migration and redeploy
```

## Performance Degradation

### Slow Response Times (>1000ms)
**Symptoms**: API calls taking seconds instead of milliseconds
**Common Causes**: 
1. High memory usage causing GC pressure
2. Database connection contention
3. Unoptimized queries

**Diagnostic Steps**:
```bash
# 1. Check memory usage
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# 2. Check database performance
heroku pg:outliers --app covid-co2-tracker

# 3. Check connection count
heroku pg:ps --app covid-co2-tracker | wc -l
```

### High Memory Baseline (>300MB idle)
**Symptoms**: Memory usage high even with no traffic
**Solution**:
```bash
# Optimize GC settings
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 \
                  RUBY_GC_HEAP_INIT_SLOTS=600000 \
                  RUBY_GC_HEAP_FREE_SLOTS=200000 \
                  --app covid-co2-tracker
```

## Streaming-Specific Errors

### IOError in Streaming Controllers
**Error Pattern**: `IOError: stream closed`
**Cause**: Client disconnected during stream
**Solution**: This is NORMAL - handle gracefully:
```ruby
begin
  # Streaming code
rescue IOError
  Rails.logger.info "Client disconnected from stream"
  # Don't raise error
ensure
  response.stream.close
end
```

### ZIP Generation Out of Memory
**Error Pattern**: R14/R15 during large ZIP export
**Solution**: Use streaming with batching:
```ruby
# Use zip_tricks gem with find_in_batches
Co2Reading.find_in_batches(batch_size: 1000) do |batch|
  # Process batch
  GC.start if batch.size == 1000  # Force GC
end
```

## Emergency Response Procedures

### Complete System Failure
**Multiple errors, app unresponsive**:
```bash
#!/bin/bash
# Full emergency recovery
APP=covid-co2-tracker

echo "🚨 FULL SYSTEM RECOVERY"
heroku maintenance:on --app $APP
heroku pg:killall --app $APP
heroku restart --app $APP
heroku config:set WEB_CONCURRENCY=1 --app $APP
sleep 60
heroku maintenance:off --app $APP
```

### Memory Crisis (Repeated R14/R15)
```bash
#!/bin/bash
# Memory emergency protocol
APP=covid-co2-tracker

heroku restart --app $APP
heroku config:set WEB_CONCURRENCY=1 --app $APP
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app $APP

# Add jemalloc if not present
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git --app $APP

# Monitor recovery
heroku logs --tail --app $APP | grep -E "R14|R15|memory"
```

### Database Connection Crisis
```bash
#!/bin/bash
# Connection emergency
APP=covid-co2-tracker

# Kill all connections and restart
heroku pg:killall --app $APP
heroku restart --app $APP
heroku ps:scale web=1 --app $APP  # Scale down temporarily

# Monitor connection count
watch -n 10 "heroku pg:ps --app $APP | wc -l"
```

## Monitoring Commands Reference

**Daily Health Check**:
```bash
#!/bin/bash
APP=covid-co2-tracker

echo "=== DAILY HEALTH CHECK ==="
echo "App Status:"
heroku ps --app $APP

echo "Memory Usage (last 5 samples):"
heroku logs --num 500 --app $APP | grep "sample#memory_total" | tail -5

echo "Database Connections:"
heroku pg:psql --app $APP -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();"

echo "Recent Errors:"
heroku logs --num 100 --app $APP | grep -i error || echo "No errors"

echo "Configuration:"
heroku config --app $APP | grep -E "WEB_CONCURRENCY|RAILS_MAX_THREADS|RUBY_GC"
```

**Continuous Monitoring** (run during deployment):
```bash
# Monitor all critical metrics
heroku logs --tail --app covid-co2-tracker | grep -E "R14|R15|H12|PG::ConnectionBad|sample#memory_total|error"
```

This problem-solution map provides immediate, copy-paste solutions for all common production issues specific to the 512MB/20-connection Heroku constraints.