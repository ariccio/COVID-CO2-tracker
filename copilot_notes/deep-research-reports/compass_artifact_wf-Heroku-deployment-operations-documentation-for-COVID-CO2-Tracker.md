# Heroku deployment operations documentation for COVID CO2 Tracker

This comprehensive documentation provides production-ready guidance for deploying and operating a Rails 7.1+ COVID CO2 Tracker application on Heroku with streaming capabilities, memory constraints, and public health data requirements. The documentation reflects the most current Heroku platform capabilities and best practices as of 2024-2025.

## Quick Reference Guide

### Essential commands for daily operations

**Deployment Commands**
```bash
# Deploy to production
git push heroku main

# Deploy specific branch
git push heroku feature-branch:main

# Rollback deployment
heroku rollback v47 --app your-app

# Enable preboot for zero-downtime
heroku features:enable preboot -a your-app

# Run database migrations
heroku run rails db:migrate --app your-app
```

**Database Management**
```bash
# Check database status and connections
heroku pg:info --app your-app

# Monitor active connections
heroku pg:ps --app your-app

# Kill stuck queries
heroku pg:kill 12345 --app your-app

# Manual backup
heroku pg:backups:capture --app your-app

# Diagnose database health
heroku pg:diagnose --app your-app

# Check slow queries
heroku pg:outliers --app your-app
```

**Memory and Performance**
```bash
# Monitor memory usage
heroku logs --tail | grep "sample#memory_total"

# Check for memory errors
heroku logs --grep "R14\|R15" --app your-app

# Restart dynos to clear memory
heroku restart --app your-app

# Scale dynos
heroku ps:scale web=2 worker=1 --app your-app
```

**Configuration Management**
```bash
# Set environment variables
heroku config:set RAILS_MAX_THREADS=3 WEB_CONCURRENCY=1 --app your-app

# View all config vars
heroku config --app your-app

# Set Ruby garbage collection optimization
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app your-app
```

### Critical configuration settings for Standard-1X with Essential-1

**Puma Configuration** (`config/puma.rb`)
```ruby
# Optimized for 512MB RAM constraint
workers Integer(ENV.fetch("WEB_CONCURRENCY") { 1 })
threads_count = Integer(ENV.fetch("RAILS_MAX_THREADS") { 3 })
threads threads_count, threads_count

preload_app!

before_fork do
  ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
end

on_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end
```

**Database Configuration** (`config/database.yml`)
```yaml
production:
  url: <%= ENV['DATABASE_URL'] %>
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>
  checkout_timeout: 5
  reaping_frequency: 10
  prepared_statements: false  # Required for PgBouncer
  advisory_locks: false       # Required for PgBouncer
```

**Essential Environment Variables**
```bash
WEB_CONCURRENCY=1           # Single worker for 512MB RAM
RAILS_MAX_THREADS=3         # Conservative thread count
RAILS_ENV=production
RAILS_SERVE_STATIC_FILES=true
RAILS_LOG_TO_STDOUT=true
SECRET_KEY_BASE=<your-secret>
DATABASE_URL=<auto-set-by-heroku>
```

## Deployment Runbook

### Pre-deployment checklist

- [ ] All tests passing locally and in CI
- [ ] Database migrations reviewed for safety
- [ ] Memory usage profiled (target <400MB)
- [ ] Environment variables updated if needed
- [ ] Asset precompilation tested locally
- [ ] Connection pool settings verified
- [ ] Streaming endpoints tested
- [ ] Review app deployed and tested

### Step-by-step deployment procedure

**1. Prepare for deployment**
```bash
# Verify current production status
heroku ps --app co2-tracker-production
heroku pg:info --app co2-tracker-production

# Check current memory usage
heroku logs --tail --num 50 --app co2-tracker-production | grep memory

# Create backup before deployment
heroku pg:backups:capture --app co2-tracker-production
```

**2. Deploy with zero downtime**
```bash
# Enable preboot if not already enabled
heroku features:enable preboot -a co2-tracker-production

# Push code to Heroku
git push heroku main

# Monitor deployment
heroku logs --tail --app co2-tracker-production
```

**3. Run migrations safely**
```ruby
# Use strong_migrations gem for safety
# Gemfile
gem 'strong_migrations'

# Safe migration example
class AddIndexToCo2Readings < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!  # For concurrent index creation
  
  def change
    add_index :co2_readings, :recorded_at, algorithm: :concurrently
  end
end
```

**4. Post-deployment verification**
```bash
# Health check
curl -I https://co2-tracker-production.herokuapp.com/health

# Verify version
heroku releases --app co2-tracker-production

# Check error rates
heroku logs --grep ERROR --num 100 --app co2-tracker-production

# Monitor memory
heroku logs --tail --app co2-tracker-production | grep R14
```

### Rollback procedures

**Emergency rollback**
```bash
#!/bin/bash
# scripts/emergency_rollback.sh

APP_NAME=co2-tracker-production

echo "🚨 EMERGENCY ROLLBACK for $APP_NAME"
heroku maintenance:on --app $APP_NAME
heroku rollback --app $APP_NAME
sleep 30
heroku maintenance:off --app $APP_NAME

# Verify health
if curl -f https://$APP_NAME.herokuapp.com/health; then
  echo "✅ Rollback successful"
else
  echo "❌ Health check failed - manual intervention required"
fi
```

**Database migration rollback**
```bash
# Check migration status
heroku run rails db:migrate:status --app co2-tracker-production

# Rollback specific migration
heroku run rails db:rollback STEP=1 --app co2-tracker-production
```

## Troubleshooting Guide

### Memory exhaustion (R14 errors)

**Problem**: Rails 7.1+ defaults to multiple Puma workers causing immediate R14 errors on 512MB dynos.

**Solution 1: Set WEB_CONCURRENCY immediately**
```bash
heroku config:set WEB_CONCURRENCY=1 --app co2-tracker-production
heroku restart --app co2-tracker-production
```

**Solution 2: Optimize Ruby garbage collection**
```bash
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 \
                  RUBY_GC_HEAP_INIT_SLOTS=600000 \
                  RUBY_GC_HEAP_FREE_SLOTS=200000 \
                  --app co2-tracker-production
```

**Solution 3: Use jemalloc for better memory management**
```bash
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git
```

### Database connection exhaustion

**Problem**: PG::ConnectionBad errors or "remaining connection slots reserved" errors.

**Solution 1: Add PgBouncer buildpack**
```bash
heroku buildpacks:add --index 1 heroku/pgbouncer
# Update Procfile:
# web: bin/start-pgbouncer-stunnel bundle exec puma -C config/puma.rb
```

**Solution 2: Optimize connection distribution**
```ruby
# For 20-connection limit on essential-1:
# Web dynos: 3 connections each
# Worker dynos: 3 connections each
# Reserve: 5 connections for operations

# config/database.yml
production:
  pool: 3  # Per dyno connection limit
```

**Solution 3: Emergency connection recovery**
```bash
# Kill all connections
heroku pg:killall --app co2-tracker-production

# Scale down to reduce pressure
heroku ps:scale web=1 worker=0 --app co2-tracker-production
```

### Streaming timeout issues (H12 errors)

**Problem**: ActionController::Live streams timing out after 30 seconds.

**Solution: Implement heartbeat mechanism**
```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  def stream_co2_data
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    begin
      loop do
        response.stream.write "data: #{fetch_latest_readings.to_json}\n\n"
        sleep 20  # Send data before 30-second timeout
      end
    rescue IOError
      # Client disconnected
    ensure
      response.stream.close
    end
  end
end
```

### Large file generation memory issues

**Problem**: ZIP file generation for sensor data exports causing memory exhaustion.

**Solution: Stream ZIP files without loading into memory**
```ruby
# Using zip_tricks gem for streaming
class ExportsController < ApplicationController
  include ActionController::Live
  
  def download_all_readings
    response.headers['Content-Type'] = 'application/zip'
    response.headers['Content-Disposition'] = 'attachment; filename="co2_data.zip"'
    response.headers['X-Accel-Buffering'] = 'no'
    
    zip_stream = ZipTricks::Streamer.new(response.stream)
    
    begin
      Co2Reading.find_each(batch_size: 1000) do |reading|
        zip_stream.write_deflated_file("reading_#{reading.id}.json") do |writer|
          writer << reading.to_json
        end
      end
    ensure
      zip_stream.close
      response.stream.close
    end
  end
end
```

## Monitoring Checklist

### Key metrics and thresholds

**Memory Monitoring**
- **Warning**: >400MB (80% of 512MB)
- **Critical**: >460MB (90% of 512MB)
- **Action**: R14 errors require immediate intervention

**Response Time**
- **Target**: P95 < 500ms
- **Warning**: P95 > 750ms
- **Critical**: P95 > 1000ms

**Database Connections**
- **Warning**: >15 connections (75% of 20)
- **Critical**: >18 connections (90% of 20)
- **Monitor**: `heroku pg:ps --app co2-tracker-production`

**Error Rates**
- **Warning**: >1% 5xx errors
- **Critical**: >5% 5xx errors
- **H12 timeouts**: Any occurrence needs investigation

### Monitoring setup

**Enable runtime metrics**
```bash
# Install Barnes gem for better metrics
echo "gem 'barnes'" >> Gemfile
bundle install
git add Gemfile Gemfile.lock
git commit -m "Add Barnes for runtime metrics"
git push heroku main
```

**Configure alerts with logging add-on**
```bash
# Add Papertrail for log aggregation
heroku addons:create papertrail:choklad --app co2-tracker-production

# Set up alerts in Papertrail dashboard for:
# - "R14" (memory errors)
# - "H12" (request timeouts)
# - "PG::ConnectionBad" (database issues)
```

**Custom monitoring middleware**
```ruby
# app/middleware/performance_monitor.rb
class PerformanceMonitor
  def initialize(app)
    @app = app
  end
  
  def call(env)
    start_time = Time.current
    memory_before = `ps -o rss= -p #{Process.pid}`.to_i / 1024
    
    status, headers, response = @app.call(env)
    
    duration = (Time.current - start_time) * 1000
    memory_after = `ps -o rss= -p #{Process.pid}`.to_i / 1024
    
    if memory_after > 400
      Rails.logger.warn "High memory usage: #{memory_after}MB"
    end
    
    if duration > 1000
      Rails.logger.warn "Slow request: #{env['PATH_INFO']} took #{duration}ms"
    end
    
    [status, headers, response]
  end
end
```

## Emergency Procedures

### Memory crisis response

**Immediate actions for R14/R15 errors**
```bash
#!/bin/bash
# scripts/memory_emergency.sh

APP=co2-tracker-production

# 1. Restart dynos to clear memory
heroku restart --app $APP

# 2. Reduce worker count if multiple
heroku config:set WEB_CONCURRENCY=1 --app $APP

# 3. Scale horizontally to distribute load
heroku ps:scale web=2 --app $APP

# 4. Monitor recovery
heroku logs --tail --app $APP | grep "R14\|memory"
```

### Database connection pool exhaustion

**Recovery procedure**
```bash
# 1. Check current connections
heroku pg:ps --app co2-tracker-production

# 2. Kill all connections (forces reconnect)
heroku pg:killall --app co2-tracker-production

# 3. Restart application
heroku restart --app co2-tracker-production

# 4. Consider scaling down if persistent
heroku ps:scale web=1 worker=0 --app co2-tracker-production
```

### Streaming failure recovery

**H12 timeout resolution**
```ruby
# Add rack-timeout for better timeout handling
# Gemfile
gem 'rack-timeout'

# config/initializers/rack_timeout.rb
Rack::Timeout.service_timeout = 25  # Less than Heroku's 30s
Rack::Timeout.wait_timeout = 10
Rack::Timeout.wait_overtime = 5
```

### Complete system failure

**Full recovery procedure**
```bash
#!/bin/bash
# scripts/full_recovery.sh

APP=co2-tracker-production

echo "Starting full system recovery..."

# 1. Enable maintenance mode
heroku maintenance:on --app $APP

# 2. Check database status
heroku pg:info --app $APP

# 3. Restart database if needed
heroku pg:restart --app $APP

# 4. Clear all connections
heroku pg:killall --app $APP

# 5. Restart all dynos
heroku restart --app $APP

# 6. Verify configuration
heroku config --app $APP | grep -E "WEB_CONCURRENCY|RAILS_MAX_THREADS"

# 7. Run health check
sleep 30
if curl -f https://$APP.herokuapp.com/health; then
  echo "✅ System recovered"
  heroku maintenance:off --app $APP
else
  echo "❌ Recovery failed - escalate to senior engineer"
fi
```

## Scaling Playbook

### Current constraints and limits

**Standard-1X Dyno (512MB RAM)**
- Maximum 1 Puma worker safely
- 3-5 threads per worker
- ~200-300MB for Rails application
- ~50-100MB for streaming operations

**Essential-1 Database (20 connections)**
- Maximum 6 web dynos @ 3 connections each
- Or 4 web + 2 worker dynos @ 3 connections each
- Connection pooling critical at this scale

### Vertical scaling decision points

**When to upgrade to Standard-2X ($50/month)**
- Consistent R14 memory errors despite optimization
- Need for 2+ Puma workers for concurrency
- Response times > 1 second at low traffic
- Streaming to >10 concurrent users

**When to upgrade database to Essential-2 ($20/month)**
- Approaching 10GB storage limit
- Need >20 connections for scaling
- Query performance degradation
- Regular connection exhaustion

### Horizontal scaling strategy

**Adding dynos progressively**
```bash
# Monitor current performance
heroku logs --tail --app co2-tracker-production | grep "service="

# Scale incrementally
heroku ps:scale web=2 --app co2-tracker-production
# Monitor for 24 hours

# If stable, continue scaling
heroku ps:scale web=3 --app co2-tracker-production
# Maximum with Essential-1: 6 dynos
```

**Implementing autoscaling**
```bash
# For Standard dynos, use HireFire
# $25/month for autoscaling
# Configure to scale 1-3 dynos based on response time

# Alternative: Manual scheduled scaling
# Scale up during peak hours (9am-5pm)
heroku ps:scale web=2 --app co2-tracker-production
# Scale down during off-hours
heroku ps:scale web=1 --app co2-tracker-production
```

### Performance optimization before scaling

**Query optimization checklist**
- [ ] Add indexes for all foreign keys
- [ ] Create composite indexes for common queries
- [ ] Use `find_each` instead of `all.each`
- [ ] Implement eager loading with `includes`
- [ ] Add database query caching

**Memory optimization checklist**
- [ ] Enable jemalloc buildpack
- [ ] Configure Ruby GC tuning
- [ ] Use streaming for large data exports
- [ ] Implement pagination for listings
- [ ] Move file processing to background jobs

**Caching implementation**
```ruby
# Add Redis for caching
# $3/month for Mini plan
heroku addons:create heroku-redis:mini --app co2-tracker-production

# Configure Rails caching
config.cache_store = :redis_cache_store, {
  url: ENV['REDIS_URL'],
  expires_in: 1.hour
}

# Implement fragment caching
<% cache ['co2-readings', @sensor, Date.current] do %>
  <%= render @readings %>
<% end %>
```

### Cost-optimized scaling path

**Phase 1: Optimization (Current: $34/month)**
- Standard-1X dyno: $25
- Essential-1 database: $9
- Actions: Implement caching, optimize queries

**Phase 2: Minimal scaling ($70/month)**
- 2x Standard-1X dynos: $50
- Essential-2 database: $20
- Supports ~100 concurrent users

**Phase 3: Growth scaling ($145/month)**
- 3x Standard-1X dynos: $75
- Standard-0 database: $50
- Redis Mini: $3
- Papertrail: $7
- New Relic: $10
- Supports ~500 concurrent users

**Phase 4: Performance tier ($535/month)**
- 1x Performance-M dyno: $250
- Standard-2 database: $200
- Redis Premium-0: $60
- Monitoring suite: $25
- Supports ~2000 concurrent users

## Critical gotchas and solutions

### Rails 7.1+ specific issues

**WEB_CONCURRENCY default problem**
Rails 7.1+ defaults to `Concurrent.physical_processor_count` for Puma workers, which returns 4+ on Heroku dynos despite memory constraints. Always explicitly set `WEB_CONCURRENCY=1` for Standard-1X dynos.

**Solid Queue/Cable incompatibility**
Rails 8 defaults to SQLite-based Solid Queue/Cable which fails on Heroku's ephemeral filesystem. Must configure Redis or PostgreSQL adapters.

### Heroku-24 stack considerations

**Git only available at build time**
```ruby
# This will fail in production on Heroku-24
git_revision = `git rev-parse HEAD`.strip

# Use environment variable instead
git_revision = ENV['HEROKU_SLUG_COMMIT']
```

**Stricter memory limits during asset compilation**
```bash
# May need to increase Node memory for webpack
heroku config:set NODE_OPTIONS="--max_old_space_size=2560"
```

### Essential-1 database limitations

- No automatic backups (must schedule manually)
- No point-in-time recovery
- No database followers for read scaling
- No server-side connection pooling
- Limited to 20 connections total

### Streaming operation constraints

- 30-second initial response requirement
- 55-second rolling timeout between data
- No WebSocket sticky sessions
- Nginx buffering must be disabled
- Memory usage increases with concurrent streams

This comprehensive documentation provides production-ready guidance for operating a Rails 7.1+ CO2 tracking application on Heroku with specific attention to memory constraints, database limitations, and streaming requirements. Regular monitoring and gradual scaling following these guidelines will ensure reliable operation while managing costs effectively.