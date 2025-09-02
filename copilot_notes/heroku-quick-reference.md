# Heroku Quick Reference Guide
*For COVID CO2 Tracker Production Operations*

## Critical Configuration for 512MB/20-Connection Setup

**MUST-HAVE Environment Variables** (copy-paste ready):
```bash
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
heroku config:set RAILS_ENV=production RAILS_SERVE_STATIC_FILES=true --app covid-co2-tracker
heroku config:set RAILS_LOG_TO_STDOUT=true --app covid-co2-tracker
```

**Ruby GC Optimization** (prevents R14 errors):
```bash
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 \
                  RUBY_GC_HEAP_INIT_SLOTS=600000 \
                  RUBY_GC_HEAP_FREE_SLOTS=200000 \
                  --app covid-co2-tracker
```

## Essential Daily Commands

### Deployment & Monitoring
```bash
# Deploy with zero-downtime
heroku features:enable preboot -a covid-co2-tracker
git push heroku main

# Monitor deployment
heroku logs --tail --app covid-co2-tracker

# Emergency rollback
heroku rollback --app covid-co2-tracker

# Check app status
heroku ps --app covid-co2-tracker
```

### Memory Monitoring (Critical for 512MB)
```bash
# Check current memory usage
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# Watch for memory errors (R14/R15)
heroku logs --grep "R14\|R15" --app covid-co2-tracker

# Emergency memory recovery
heroku restart --app covid-co2-tracker
```

### Database Operations (20-connection limit)
```bash
# Check connection usage
heroku pg:ps --app covid-co2-tracker

# Kill stuck connections
heroku pg:killall --app covid-co2-tracker

# Database health check
heroku pg:info --app covid-co2-tracker

# Create backup
heroku pg:backups:capture --app covid-co2-tracker
```

## Critical Thresholds & Alerts

### Memory Limits (512MB dyno)
- **Warning**: >400MB (80%)
- **Critical**: >460MB (90%)
- **Action**: Immediate restart if >480MB

### Database Connections (20 total)
- **Warning**: >15 connections (75%)
- **Critical**: >18 connections (90%)
- **Emergency**: `heroku pg:killall` if exhausted

### Response Times
- **Target**: <500ms P95
- **Warning**: >750ms P95
- **Critical**: >1000ms P95

## Emergency Procedures

### R14 Memory Error (IMMEDIATE ACTION)
```bash
#!/bin/bash
# Emergency memory recovery
APP=covid-co2-tracker

heroku restart --app $APP
heroku config:set WEB_CONCURRENCY=1 --app $APP
heroku logs --tail --app $APP | grep "R14\|memory"
```

### Database Connection Exhaustion
```bash
# Nuclear option - kills all connections
heroku pg:killall --app covid-co2-tracker
heroku restart --app covid-co2-tracker

# Then monitor recovery
heroku pg:ps --app covid-co2-tracker
```

### H12 Timeout (Streaming Issues)
- Streaming requests timeout at 30 seconds on Heroku
- Must send data within 30s to keep connection alive
- Use heartbeat mechanism in streaming controllers

## Required Puma Configuration

**config/puma.rb** (CRITICAL - prevents R14 errors):
```ruby
# MUST BE EXACTLY THIS for 512MB dynos
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

## Database Configuration

**config/database.yml** (for 20-connection limit):
```yaml
production:
  url: <%= ENV['DATABASE_URL'] %>
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>
  checkout_timeout: 5
  reaping_frequency: 10
  prepared_statements: false  # Required for PgBouncer
  advisory_locks: false       # Required for PgBouncer
```

## Essential Buildpacks

```bash
# Add jemalloc for better memory management
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git

# Add PgBouncer for connection pooling (if needed)
heroku buildpacks:add --index 1 heroku/pgbouncer
```

## Health Check Commands

**Quick System Check**:
```bash
# One-liner system health
heroku ps --app covid-co2-tracker && heroku pg:info --app covid-co2-tracker && curl -I https://www.co2trackers.com/health
```

**Memory Usage Check**:
```bash
# Check last 100 memory samples
heroku logs --num 1000 --app covid-co2-tracker | grep "sample#memory_total" | tail -10
```

**Connection Health**:
```bash
# See active database connections
heroku pg:ps --app covid-co2-tracker | head -20
```

## Configuration Verification

**Check Critical Settings**:
```bash
heroku config --app covid-co2-tracker | grep -E "WEB_CONCURRENCY|RAILS_MAX_THREADS|RUBY_GC"
```

**Expected Output**:
```
WEB_CONCURRENCY: 1
RAILS_MAX_THREADS: 3
RUBY_GC_HEAP_GROWTH_FACTOR: 1.03
```

## Common Error Codes & Quick Fixes

- **R14**: Memory quota exceeded → Restart + check WEB_CONCURRENCY=1
- **R15**: Memory quota vastly exceeded → Emergency restart + GC tuning
- **H12**: Request timeout → Check for streaming issues, reduce request complexity
- **H15**: Idle connection timeout → Normal for streaming, implement heartbeat
- **PG::ConnectionBad**: Database connection issues → Check pg:ps, maybe pg:killall

## Scaling Constraints

**Current Setup (Standard-1X + Essential-1)**:
- **Maximum**: 1 Puma worker safely
- **Threads**: 3-5 per worker maximum
- **Dynos**: Up to 6 web dynos (3 connections each)
- **Memory**: ~200-300MB for Rails, ~100MB for streaming

**Next Tier Upgrade Points**:
- Standard-2X dyno: $50/month (1GB RAM, allows 2 workers)
- Essential-2 database: $20/month (50 connections)

Following these configurations and procedures ensures reliable operation within Heroku's constraints while maintaining optimal performance for the CO2 tracking application.