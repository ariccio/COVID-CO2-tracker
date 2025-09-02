# Heroku Complete Operations Guide
*The definitive reference for COVID CO2 Tracker production operations on Heroku*

## Table of Contents

1. **[Quick Reference](#quick-reference)** - Most used commands and critical configurations
2. **[Deployment & Configuration](#deployment--configuration)** - Deploying code, environment setup, buildpacks
3. **[Memory Management](#memory-management)** - R14/R15 prevention, GC tuning, memory optimization
4. **[Database Operations](#database-operations)** - PostgreSQL management, connection pooling, PgBouncer
5. **[Monitoring & Alerts](#monitoring--alerts)** - Barnes, Papertrail, custom monitoring, health checks
6. **[Security & Compliance](#security--compliance)** - Token management, authentication, security best practices
7. **[Cost Optimization](#cost-optimization)** - Scaling economics, upgrade paths, cost-saving strategies
8. **[Scaling Strategies](#scaling-strategies)** - When and how to scale, decision matrix
9. **[Streaming Operations](#streaming-operations)** - ActionController::Live, ZIP exports, heartbeats
10. **[Troubleshooting](#troubleshooting)** - Error fixes, emergency procedures, recovery protocols
11. **[Export System Management](#export-system-management)** - API exports, token creation, deployment
12. **[Appendix A: All Commands Reference](#appendix-a-all-commands-reference)** - Alphabetical command list
13. **[Appendix B: Error Code Reference](#appendix-b-error-code-reference)** - All H and R codes with fixes
14. **[Appendix C: Configuration Files](#appendix-c-configuration-files)** - Critical config file templates

---

## Quick Reference

### 20 Most Common Commands

```bash
# 1. Deploy application
git push heroku main

# 2. Monitor logs in real-time
heroku logs --tail --app covid-co2-tracker

# 3. Restart dynos (memory recovery)
heroku restart --app covid-co2-tracker

# 4. Check app status
heroku ps --app covid-co2-tracker

# 5. Set critical environment variable (MUST DO for Rails 7.1+)
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker

# 6. Run database migration
heroku run rails db:migrate --app covid-co2-tracker

# 7. Open Rails console
heroku run rails console --app covid-co2-tracker

# 8. Check database connections
heroku pg:ps --app covid-co2-tracker

# 9. Kill all database connections (nuclear option)
heroku pg:killall --app covid-co2-tracker

# 10. Check memory usage
heroku logs --app covid-co2-tracker | grep "sample#memory_total"

# 11. Watch for memory errors
heroku logs --grep "R14\|R15" --app covid-co2-tracker

# 12. Create database backup
heroku pg:backups:capture --app covid-co2-tracker

# 13. Check database info
heroku pg:info --app covid-co2-tracker

# 14. Rollback deployment
heroku rollback --app covid-co2-tracker

# 15. Scale dynos
heroku ps:scale web=2 --app covid-co2-tracker

# 16. View configuration
heroku config --app covid-co2-tracker

# 17. Enable maintenance mode
heroku maintenance:on --app covid-co2-tracker

# 18. Check releases history
heroku releases --app covid-co2-tracker

# 19. View slow database queries
heroku pg:outliers --app covid-co2-tracker

# 20. Emergency memory fix (combined)
heroku restart --app covid-co2-tracker && heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
```

### Critical Configuration (MUST HAVE)

**Environment Variables** (copy-paste ready):
```bash
# CRITICAL for Rails 7.1+ on 512MB dynos
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
heroku config:set RAILS_ENV=production RAILS_SERVE_STATIC_FILES=true --app covid-co2-tracker
heroku config:set RAILS_LOG_TO_STDOUT=true --app covid-co2-tracker

# Ruby GC Optimization (prevents R14 errors)
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 \
                  RUBY_GC_HEAP_INIT_SLOTS=600000 \
                  RUBY_GC_HEAP_FREE_SLOTS=200000 \
                  RUBY_GC_MALLOC_LIMIT=16000000 \
                  RUBY_GC_OLDMALLOC_LIMIT=16000000 \
                  --app covid-co2-tracker
```

### Critical Thresholds

| Resource | Warning | Critical | Emergency Action |
|----------|---------|----------|------------------|
| Memory | >400MB (80%) | >460MB (90%) | Restart if >480MB |
| DB Connections | >15 (75%) | >18 (90%) | `pg:killall` if exhausted |
| Response Time | >750ms P95 | >1000ms P95 | Investigate queries |

---

## Deployment & Configuration

### Pre-Deployment Checklist

**CRITICAL: Rails 7.1+ Issue**
Rails 7.1+ defaults to `Concurrent.physical_processor_count` for Puma workers, which returns 4+ on Heroku dynos despite only having 512MB RAM. This causes **IMMEDIATE R14 errors**.

```bash
# MUST DO BEFORE ANY DEPLOYMENT
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
```

### Zero-Downtime Deployment

```bash
# Enable preboot for zero-downtime deploys
heroku features:enable preboot -a covid-co2-tracker

# Deploy
git push heroku main

# Monitor deployment
heroku logs --tail --app covid-co2-tracker
```

### Essential Buildpacks

```bash
# 1. Jemalloc for better memory management (15-30% reduction)
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git

# 2. PgBouncer for connection pooling (when needed)
heroku buildpacks:add --index 1 heroku/pgbouncer

# Verify buildpacks
heroku buildpacks --app covid-co2-tracker
```

### Puma Configuration (MANDATORY)

**config/puma.rb**:
```ruby
# CRITICAL: Must be exactly 1 worker for 512MB dyno
workers Integer(ENV.fetch("WEB_CONCURRENCY") { 1 })

# Conservative thread count for memory safety
threads_count = Integer(ENV.fetch("RAILS_MAX_THREADS") { 3 })
threads threads_count, threads_count

# Preload for memory efficiency
preload_app!

# Essential for proper connection handling
before_fork do
  ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
end

on_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end

# Graceful shutdown for streaming
on_worker_shutdown do
  ActiveSupport::Notifications.publish('worker.shutdown')
end
```

### Database Configuration

**config/database.yml**:
```yaml
production:
  url: <%= ENV['DATABASE_URL'] %>
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>
  checkout_timeout: 5
  reaping_frequency: 10
  prepared_statements: false  # Required for PgBouncer
  advisory_locks: false       # Required for PgBouncer
```

### Procfile Setup (with PgBouncer)

```bash
# Create Procfile if using PgBouncer
echo "web: bin/start-pgbouncer-stunnel bundle exec puma -C config/puma.rb" > Procfile
```

---

## Memory Management

### Memory Budget Breakdown (512MB Total)

```
Base Rails Application:     ~180MB
Puma Worker (1x):          ~120MB  
Ruby GC Overhead:          ~80MB
Streaming Operations:      ~50MB
Safety Buffer:             ~82MB
                          -------
Total:                     512MB
```

### Ruby Garbage Collection Tuning

```bash
# Deploy these settings to prevent memory fragmentation
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 \
                  RUBY_GC_HEAP_INIT_SLOTS=600000 \
                  RUBY_GC_HEAP_FREE_SLOTS=200000 \
                  RUBY_GC_MALLOC_LIMIT=16000000 \
                  RUBY_GC_OLDMALLOC_LIMIT=16000000 \
                  --app covid-co2-tracker
```

**What These Do**:
- `GROWTH_FACTOR=1.03`: Smaller heap growth (default 1.8 is too aggressive)
- `INIT_SLOTS=600000`: Start with more slots to avoid early expansions
- `FREE_SLOTS=200000`: Keep more free slots to reduce GC pressure
- `MALLOC_LIMIT=16MB`: Conservative malloc limits for tight memory

### Memory Monitoring

```bash
# Real-time memory monitoring
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# Historical memory usage (last hour)
heroku logs --num 1500 --app covid-co2-tracker | grep "sample#memory_total" | tail -20

# Watch for memory errors in real-time
heroku logs --tail --app covid-co2-tracker | grep -E "R14|R15|memory"

# Check last 100 memory samples
heroku logs --num 1000 --app covid-co2-tracker | grep "sample#memory_total" | tail -10
```

### R14/R15 Error Prevention and Recovery

**R14 (Memory Quota Exceeded)** - Process using >512MB:
```bash
# Immediate fix
heroku restart --app covid-co2-tracker
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
```

**R15 (Memory Quota Vastly Exceeded)** - Process using >1GB:
```bash
#!/bin/bash
# Emergency memory recovery script
APP=covid-co2-tracker

echo "🚨 MEMORY EMERGENCY - Fixing R14/R15 errors"

# 1. Immediate restart
heroku restart --app $APP

# 2. Force single worker
heroku config:set WEB_CONCURRENCY=1 --app $APP

# 3. Optimize GC if not already done
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app $APP

# 4. Monitor recovery
sleep 30
heroku logs --tail --app $APP | grep -E "memory|R14|R15" &

# 5. Health check
curl -I https://www.co2trackers.com/health
```

### Application-Level Memory Optimizations

```ruby
# BAD: Loads all records into memory
readings = Co2Reading.all.map(&:to_json)

# GOOD: Process in batches
Co2Reading.find_each(batch_size: 1000) do |reading|
  process_reading(reading)
end

# BAD: Accumulates large arrays
def export_all_data
  data = []
  Co2Reading.find_each do |reading|
    data << reading.to_hash  # Builds huge array in memory
  end
  data.to_json
end

# GOOD: Stream processing
def stream_all_data
  Co2Reading.find_each do |reading|
    yield reading.to_json  # Process immediately
  end
end
```

### Memory Monitoring Middleware

```ruby
# app/middleware/memory_monitor.rb
class MemoryMonitor
  def initialize(app)
    @app = app
  end
  
  def call(env)
    start_memory = memory_usage
    
    status, headers, response = @app.call(env)
    
    end_memory = memory_usage
    memory_diff = end_memory - start_memory
    
    if end_memory > 400 # 400MB threshold
      Rails.logger.warn "HIGH MEMORY: #{end_memory}MB (#{env['PATH_INFO']})"
    end
    
    if memory_diff > 50 # 50MB increase
      Rails.logger.warn "MEMORY LEAK: #{memory_diff}MB increase (#{env['PATH_INFO']})"
    end
    
    [status, headers, response]
  end
  
  private
  
  def memory_usage
    `ps -o rss= -p #{Process.pid}`.to_i / 1024
  end
end
```

---

## Database Operations

### Connection Limits and Distribution

**Essential-1 Database (20 connections max)**:
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

### Connection Monitoring

```bash
# See all active connections
heroku pg:ps --app covid-co2-tracker

# Count connections by state
heroku pg:psql --app covid-co2-tracker -c "
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = current_database() 
GROUP BY state;"

# Monitor connection count continuously
watch -n 30 "heroku pg:psql --app covid-co2-tracker -c \"SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database();\""

# Daily health check
heroku pg:psql --app covid-co2-tracker -c "SELECT count(*) as total_connections, count(*) FILTER (WHERE state = 'active') as active, count(*) FILTER (WHERE state = 'idle') as idle FROM pg_stat_activity WHERE datname = current_database();"
```

### Safe Scaling Guidelines

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

### PgBouncer Setup (Connection Pooling)

**When to add PgBouncer**:
- Approaching 15+ connections regularly
- Need to scale beyond 5 dynos
- Experiencing connection exhaustion
- Want to add background workers

```bash
# Add PgBouncer buildpack
heroku buildpacks:add --index 1 heroku/pgbouncer --app covid-co2-tracker

# Update Procfile
echo "web: bin/start-pgbouncer-stunnel bundle exec puma -C config/puma.rb" > Procfile

# Configure PgBouncer
heroku config:set PGBOUNCER_DEFAULT_POOL_SIZE=25 --app covid-co2-tracker
heroku config:set PGBOUNCER_POOL_MODE=transaction --app covid-co2-tracker

# Commit and deploy
git add Procfile
git commit -m "Add PgBouncer for connection pooling"
git push heroku main
```

### Connection Exhaustion Recovery

```bash
#!/bin/bash
# Connection emergency script
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

### Long-Running Query Management

```bash
# Find long-running queries
heroku pg:psql --app covid-co2-tracker -c "
SELECT 
  pid, 
  now() - pg_stat_activity.query_start AS duration, 
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active'
  AND datname = current_database();"

# Kill specific long-running query (replace 12345 with PID)
heroku pg:kill 12345 --app covid-co2-tracker

# Monitor slow queries
heroku pg:outliers --app covid-co2-tracker

# Database vacuum and analyze
heroku pg:psql --app covid-co2-tracker -c "VACUUM ANALYZE;"
```

### Database Backup Operations

```bash
# Create manual backup
heroku pg:backups:capture --app covid-co2-tracker

# Schedule automatic daily backups
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/New_York' --app covid-co2-tracker

# List backups
heroku pg:backups --app covid-co2-tracker

# Download backup
heroku pg:backups:download --app covid-co2-tracker

# Restore from backup (careful!)
heroku pg:backups:restore b001 DATABASE_URL --app covid-co2-tracker
```

---

## Monitoring & Alerts

### Essential Production Gems

```ruby
# Gemfile additions for production monitoring
gem 'barnes'          # Heroku runtime metrics
gem 'rack-timeout'    # Request timeout handling  
gem 'strong_migrations' # Safe database migrations
gem 'newrelic_rpm'    # Application performance monitoring (optional)
```

```bash
# Install monitoring gems
bundle add barnes rack-timeout strong_migrations
git add Gemfile Gemfile.lock
git commit -m "Add essential production monitoring gems"
git push heroku main
```

### Barnes Configuration (Runtime Metrics)

Barnes automatically sends detailed metrics to Heroku logs:

```bash
# After deployment, view enhanced metrics
heroku logs --tail --app covid-co2-tracker | grep "sample#"

# Expected output includes:
# sample#memory_total=185.23MB
# sample#memory_rss=183.06MB  
# sample#memory_cache=2.17MB
# sample#memory_swap=0.00MB
# sample#load_avg_1m=0.04
```

### Rack::Timeout Configuration

```ruby
# config/initializers/rack_timeout.rb
Rack::Timeout.service_timeout = 25  # 5 seconds under Heroku's 30s limit
Rack::Timeout.wait_timeout = 10     # Time waiting for server
Rack::Timeout.wait_overtime = 5     # Grace period after timeout

# Skip timeout for streaming endpoints
Rack::Timeout.unregister_state_change_observer(:logger) if Rails.env.production?

# Custom timeout handling
Rack::Timeout.register_state_change_observer(:custom_logger) do |env|
  case env[Rack::Timeout::ENV_INFO_KEY].state
  when :timed_out
    Rails.logger.error "Request timeout: #{env['REQUEST_URI']}"
  when :completed
    duration = env[Rack::Timeout::ENV_INFO_KEY].ms
    if duration > 10000  # 10 seconds
      Rails.logger.warn "Slow request: #{env['REQUEST_URI']} took #{duration}ms"
    end
  end
end
```

### Custom Performance Monitoring Middleware

```ruby
# app/middleware/performance_monitor.rb
class PerformanceMonitor
  def initialize(app)
    @app = app
  end
  
  def call(env)
    start_time = Time.current
    start_memory = memory_usage_mb
    request_path = env['PATH_INFO']
    request_method = env['REQUEST_METHOD']
    
    # Process request
    status, headers, response = @app.call(env)
    
    # Calculate metrics
    duration = (Time.current - start_time) * 1000  # milliseconds
    end_memory = memory_usage_mb
    memory_diff = end_memory - start_memory
    
    # Log performance metrics
    log_performance_metrics(request_method, request_path, status, duration, start_memory, end_memory, memory_diff)
    
    # Alert on concerning metrics
    alert_on_high_usage(request_path, duration, end_memory, memory_diff)
    
    [status, headers, response]
  end
  
  private
  
  def memory_usage_mb
    `ps -o rss= -p #{Process.pid}`.to_i / 1024
  end
  
  def log_performance_metrics(method, path, status, duration, start_mem, end_mem, mem_diff)
    Rails.logger.info [
      "PERF",
      "method=#{method}",
      "path=#{path}",
      "status=#{status}",
      "duration=#{duration.round(1)}ms",
      "memory_start=#{start_mem}MB",
      "memory_end=#{end_mem}MB",
      "memory_diff=#{mem_diff > 0 ? '+' : ''}#{mem_diff}MB"
    ].join(' ')
  end
  
  def alert_on_high_usage(path, duration, memory, memory_diff)
    # Memory alerts
    if memory > 450  # Critical: approaching 512MB limit
      Rails.logger.error "🚨 CRITICAL MEMORY: #{memory}MB on #{path}"
    elsif memory > 400  # Warning: 80% of limit
      Rails.logger.warn "⚠️ HIGH MEMORY: #{memory}MB on #{path}"
    end
    
    # Duration alerts
    if duration > 20000  # Critical: >20 seconds
      Rails.logger.error "🚨 CRITICAL TIMEOUT RISK: #{duration}ms on #{path}"
    elsif duration > 5000  # Warning: >5 seconds
      Rails.logger.warn "⚠️ SLOW REQUEST: #{duration}ms on #{path}"
    end
    
    # Memory leak detection
    if memory_diff > 50  # >50MB increase in single request
      Rails.logger.error "🚨 POTENTIAL MEMORY LEAK: +#{memory_diff}MB on #{path}"
    end
  end
end

# Register in config/application.rb
config.middleware.use PerformanceMonitor
```

### Health Check Endpoint

```ruby
# config/routes.rb
get '/health', to: 'health#show'

# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def show
    health_data = {
      status: 'healthy',
      timestamp: Time.current.iso8601,
      version: ENV['HEROKU_SLUG_COMMIT']&.first(8) || 'unknown',
      memory_usage: memory_usage_mb,
      database: database_health,
      redis: redis_health # if using Redis
    }
    
    # Determine overall status
    if health_data[:memory_usage] > 450
      health_data[:status] = 'critical'
      render json: health_data, status: 503
    elsif health_data[:memory_usage] > 400 || !health_data[:database]
      health_data[:status] = 'degraded'
      render json: health_data, status: 200  # Still functional
    else
      render json: health_data, status: 200
    end
  end
  
  private
  
  def memory_usage_mb
    `ps -o rss= -p #{Process.pid}`.to_i / 1024
  end
  
  def database_health
    ActiveRecord::Base.connection.execute("SELECT 1").present?
  rescue
    false
  end
  
  def redis_health
    return true unless defined?(Redis)
    Redis.current.ping == 'PONG'
  rescue
    false
  end
end
```

### Papertrail Log Aggregation

```bash
# Add Papertrail for log aggregation and search
heroku addons:create papertrail:choklad --app covid-co2-tracker

# View Papertrail dashboard
heroku addons:open papertrail --app covid-co2-tracker
```

**Configure alerts in Papertrail dashboard**:

1. **Memory Error Alert**:
   - Search: `R14 OR R15 OR "CRITICAL MEMORY"`
   - Frequency: Immediate
   - Action: Email + Slack notification

2. **Timeout Alert**:
   - Search: `H12 OR "CRITICAL TIMEOUT" OR "Request timeout"`
   - Frequency: 2+ occurrences in 5 minutes
   - Action: Email notification

3. **Database Connection Alert**:
   - Search: `"PG::ConnectionBad" OR "remaining connection slots"`
   - Frequency: Immediate
   - Action: Email + SMS notification

4. **Memory Leak Alert**:
   - Search: `"POTENTIAL MEMORY LEAK" OR "HIGH MEMORY"`
   - Frequency: 3+ occurrences in 10 minutes
   - Action: Email notification

### Monitoring Scripts

```bash
#!/bin/bash
# Daily dashboard script
APP=covid-co2-tracker

echo "📊 COVID CO2 Tracker - Daily Dashboard"
echo "========================================"
echo "Date: $(date)"
echo ""

# App status
echo "🏃 App Status:"
heroku ps --app $APP

echo ""
echo "💾 Memory Usage (last 10 samples):"
heroku logs --num 1000 --app $APP | grep "sample#memory_total" | tail -10 | sed 's/.*memory_total=\([0-9.]*MB\).*/\1/'

echo ""
echo "🗄️ Database Health:"
heroku pg:info --app $APP

echo ""
echo "🔗 Database Connections:"
heroku pg:ps --app $APP | head -10

echo ""
echo "⚠️ Recent Errors:"
heroku logs --grep "ERROR\|R14\|R15\|H12" --num 50 --app $APP | head -5

echo ""
echo "📈 Recent Releases:"
heroku releases --app $APP | head -5

echo ""
echo "✅ Dashboard complete - $(date)"
```

### Alert Thresholds Reference

| Metric | Normal | Elevated | Warning | Critical | Emergency |
|--------|--------|----------|---------|----------|-----------|
| Memory | <350MB | 350-400MB | 400-450MB | 450-480MB | >480MB |
| Response Time P95 | <500ms | 500-1000ms | 1-5s | 5-20s | >20s |
| DB Connections | <10 | 10-15 | 15-18 | 18-20 | 20 (exhausted) |
| 5xx Error Rate | <0.1% | 0.1-1% | 1-5% | >5% | >10% |

---

## Security & Compliance

### Export Token Management

```bash
# Create production export token via Rails console
heroku run rails console --app covid-co2-tracker

# In console:
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

### Token Security Best Practices

- **Never commit tokens to git** or expose in logs
- Store tokens in environment variables or secure vault
- Rotate tokens regularly (quarterly minimum)
- Monitor token usage for anomalies
- Implement rate limiting per token
- Log all token access attempts

### Environment Variable Security

```bash
# Set sensitive variables
heroku config:set SECRET_KEY_BASE=$(openssl rand -hex 64) --app covid-co2-tracker
heroku config:set DATABASE_ENCRYPTION_KEY=$(openssl rand -hex 32) --app covid-co2-tracker

# Never log sensitive variables
heroku config --app covid-co2-tracker | grep -v "SECRET\|KEY\|TOKEN\|PASSWORD"
```

---

## Cost Optimization

### Current Baseline: $34/month
- **Dyno**: Standard-1X (512MB) - $25/month
- **Database**: Essential-1 (10GB, 20 connections) - $9/month
- **Capabilities**: ~50 concurrent users, 100k records/day

### Scaling Tiers and Costs

| Phase | Monthly Cost | Configuration | Capabilities |
|-------|-------------|---------------|--------------|
| **Current** | $34 | 1x Standard-1X + Essential-1 | 50 users, 100k records/day |
| **Minimal** | $70 | 2x Standard-1X + Essential-2 | 200 users, 500k records/day |
| **Growth** | $145 | 3x Standard-1X + Standard-0 + Redis + Monitoring | 500 users, 2M records/day |
| **Performance** | $535 | Performance-M + Standard-2 + Premium Redis | 2000 users, 10M records/day |

### Cost-Saving Strategies

#### 1. Scheduled Scaling
```bash
# Scale up during peak (9am-5pm)
heroku ps:scale web=2 --app covid-co2-tracker

# Scale down during off-hours
heroku ps:scale web=1 --app covid-co2-tracker

# Automate with Heroku Scheduler (free)
```

#### 2. Database Optimization Before Upgrade
```bash
# Check actual usage
heroku pg:info --app covid-co2-tracker

# Vacuum and analyze
heroku pg:psql --app covid-co2-tracker -c "VACUUM ANALYZE;"

# Check bloat
heroku pg:bloat --app covid-co2-tracker
```

#### 3. Free Monitoring Alternatives
- Barnes gem (free, included in dynos)
- Heroku metrics dashboard (free)
- Custom health endpoints (free)
- GitHub Actions for uptime monitoring (free)

### Optimization Before Scaling

```bash
# Memory optimizations (no cost)
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git

# Connection pooling (no cost)
heroku buildpacks:add --index 1 heroku/pgbouncer
```

---

## Scaling Strategies

### Decision Matrix

| Metric | Stay Current | Scale Dynos | Upgrade DB | Full Scale |
|--------|-------------|-------------|------------|------------|
| Memory Usage | <400MB | 400-450MB | N/A | >450MB |
| Response Time | <1s | 1-2s | N/A | >2s |
| DB Connections | <15 | 15-18 | >18 | >35 |
| DB Size | <5GB | <8GB | >8GB | >50GB |
| Daily Requests | <100k | 100k-500k | N/A | >500k |
| Concurrent Users | <50 | 50-200 | N/A | >200 |
| R14 Errors | None | Occasional | N/A | Frequent |
| Monthly Budget | $34 | $50-70 | $70-100 | >$150 |

### Upgrade Commands

```bash
# Scale dynos
heroku ps:scale web=2 --app covid-co2-tracker

# Upgrade database (requires downtime)
heroku addons:upgrade heroku-postgresql:essential-2 --app covid-co2-tracker

# Add Redis for caching
heroku addons:create heroku-redis:mini --app covid-co2-tracker

# Add monitoring
heroku addons:create papertrail:choklad --app covid-co2-tracker
heroku addons:create newrelic:wayne --app covid-co2-tracker
```

### Export System Scaling Formula
- Max concurrent exports = (Available Memory - 300MB) / 50MB
- On Standard-1X: ~4 concurrent exports safely
- On Performance-M: ~40 concurrent exports safely

---

## Streaming Operations

### Critical Heroku Streaming Constraints

- **Initial Response**: Must send first byte within 30 seconds
- **Rolling Timeout**: Must send data every 55 seconds
- **No WebSocket Sticky Sessions**: Each request can hit different dyno
- **Nginx Buffering**: Must be explicitly disabled
- **Memory Impact**: Each concurrent stream adds ~50MB

### Essential Streaming Headers

```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  def stream_data
    # CRITICAL: These headers prevent buffering and timeouts
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['X-Accel-Buffering'] = 'no'        # Nginx directive
    response.headers['Cache-Control'] = 'no-cache'      # Prevent proxy caching
    response.headers['Connection'] = 'keep-alive'       # Maintain connection
    
    # For ZIP downloads specifically
    response.headers['Content-Disposition'] = 'attachment; filename="export.zip"'
    
    # Send immediate response to prevent H12
    response.stream.write ""
    response.stream.flush
    
    # Start streaming...
  end
end
```

### ZIP Streaming Without Memory Exhaustion

```ruby
# Gemfile
gem 'zip_tricks'

class ExportsController < ApplicationController
  include ActionController::Live
  
  def download_all_readings
    # Set headers for ZIP download
    response.headers['Content-Type'] = 'application/zip'
    response.headers['Content-Disposition'] = 'attachment; filename="co2_readings.zip"'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    # Create streaming ZIP writer
    zip_stream = ZipTricks::Streamer.new(response.stream)
    
    begin
      # Process readings in batches to control memory
      Co2Reading.find_in_batches(batch_size: 1000) do |batch|
        batch.each do |reading|
          # Add each reading as individual file
          zip_stream.write_deflated_file("reading_#{reading.id}.json") do |writer|
            writer << reading.to_json
          end
        end
        
        # CRITICAL: Force GC between batches
        GC.start if batch.size == 1000
      end
      
    rescue IOError
      # Client disconnected - normal for streaming
      Rails.logger.info "Client disconnected from ZIP stream"
    ensure
      zip_stream.close
      response.stream.close
    end
  end
end
```

### Heartbeat Mechanism (Prevents H12/H15 Timeouts)

```ruby
class DataStreamController < ApplicationController
  include ActionController::Live
  
  def live_co2_feed
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    begin
      loop do
        # Send actual data
        latest_readings = Co2Reading.latest_batch
        response.stream.write "data: #{latest_readings.to_json}\n\n"
        
        # Wait 20 seconds (well under 55-second timeout)
        sleep 20
        
        # Send heartbeat if no data to send
        if latest_readings.empty?
          response.stream.write "data: {\"heartbeat\": #{Time.current.to_i}}\n\n"
        end
      end
      
    rescue IOError
      # Client disconnected
      Rails.logger.info "Client disconnected from live feed"
    ensure
      response.stream.close
    end
  end
end
```

### CSV Streaming Implementation

```ruby
require 'csv'

class ExportsController < ApplicationController
  include ActionController::Live
  
  def download_csv
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename="co2_readings.csv"'
    response.headers['X-Accel-Buffering'] = 'no'
    
    begin
      # Write CSV header immediately
      csv_header = CSV.generate_line(['timestamp', 'co2_ppm', 'location', 'sensor_id'])
      response.stream.write csv_header
      
      # Stream rows in batches
      Co2Reading.find_each(batch_size: 1000) do |reading|
        csv_row = CSV.generate_line([
          reading.recorded_at.iso8601,
          reading.co2_ppm,
          reading.location_name,
          reading.sensor_id
        ])
        response.stream.write csv_row
      end
      
    rescue IOError
      Rails.logger.info "Client disconnected from CSV stream"
    ensure
      response.stream.close
    end
  end
end
```

### Concurrent Streaming Limits

```ruby
class StreamingController < ApplicationController
  include ActionController::Live
  
  # Track active streams (use Redis in production)
  @@active_streams = 0
  @@stream_mutex = Mutex.new
  
  def stream_data
    # Check stream limit
    @@stream_mutex.synchronize do
      if @@active_streams >= 3  # Max 3 concurrent streams for 512MB
        render json: { error: "Too many active streams" }, status: 503
        return
      end
      @@active_streams += 1
    end
    
    begin
      # Your streaming code here
      actual_streaming_work
    ensure
      # Always decrement counter
      @@stream_mutex.synchronize do
        @@active_streams -= 1
      end
    end
  end
end
```

### Testing Streaming Locally

```ruby
# config/environments/development.rb
config.allow_concurrency = true  # Required for ActionController::Live

# config/puma.rb
if Rails.env.development?
  threads 1, 3  # Match production threading
end
```

```bash
# Test streaming endpoints
curl -v http://localhost:3000/api/v1/export/stream

# Test with timeout
timeout 65s curl http://localhost:3000/api/v1/export/stream

# Test concurrent streams
curl http://localhost:3000/api/v1/export/stream &
curl http://localhost:3000/api/v1/export/stream &
curl http://localhost:3000/api/v1/export/stream &
```

---

## Troubleshooting

### Emergency Response Procedures

#### Complete System Failure
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

#### Memory Crisis (Repeated R14/R15)
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

#### Database Connection Crisis
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

### Common Error Solutions

#### H12 - Request Timeout
**Cause**: Request took >30 seconds to respond

For streaming operations:
```ruby
# Add to streaming controllers
response.headers['X-Accel-Buffering'] = 'no'
response.headers['Cache-Control'] = 'no-cache'

# Send immediate response
response.stream.write ""
response.stream.flush
```

For database operations:
```bash
# Check for slow queries
heroku pg:outliers --app covid-co2-tracker

# Kill stuck queries
heroku pg:kill <pid> --app covid-co2-tracker
```

#### PG::ConnectionBad
**Cause**: Hit 20-connection limit

```bash
# Nuclear option - kills all connections
heroku pg:killall --app covid-co2-tracker
heroku restart --app covid-co2-tracker

# Scale down if needed
heroku ps:scale web=1 --app covid-co2-tracker
```

#### R10 - Boot Timeout
**Cause**: App didn't bind to $PORT within 60 seconds

```bash
# Check database connectivity
heroku pg:info --app covid-co2-tracker

# Verify Puma configuration
heroku config --app covid-co2-tracker | grep WEB_CONCURRENCY

# Clear buildpack cache if assets issue
heroku plugins:install heroku-repo
heroku repo:purge_cache --app covid-co2-tracker
```

### Deployment Issues

#### Git Push Rejected
```bash
git pull heroku main
git push heroku main
```

#### Migration Errors
```bash
# Check migration status
heroku run rails db:migrate:status --app covid-co2-tracker

# Rollback if needed
heroku run rails db:rollback --app covid-co2-tracker
```

### Performance Degradation

```bash
# Diagnostic steps
# 1. Check memory usage
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# 2. Check database performance
heroku pg:outliers --app covid-co2-tracker

# 3. Check connection count
heroku pg:ps --app covid-co2-tracker | wc -l
```

---

## Export System Management

### Deployment Steps

```bash
# 1. Set critical configuration FIRST
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker

# 2. Deploy code
git push heroku main

# 3. Run migrations
heroku run rails db:migrate --app covid-co2-tracker

# 4. Create production token
heroku run rails console --app covid-co2-tracker
```

In Rails console:
```ruby
token = ExportToken.create!(
  description: "AirSpot Production API",
  expires_at: 1.year.from_now,
  permissions: {
    formats: ["csv", "jsonl", "multi_csv"],
    max_records: 100000,
    rate_limit_per_hour: 20
  }
)
puts "Token: #{token.token}"
exit
```

### Export Endpoint Testing

```bash
# Set token for testing
export EXPORT_TOKEN="[your-token]"

# Test CSV export
curl -I -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=csv"

# Test JSONL export with filter
curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=jsonl&limit=5"

# Test multi-CSV ZIP export
curl -H "Authorization: Bearer $EXPORT_TOKEN" \
  "https://covid-co2-tracker.herokuapp.com/api/v1/export?format_type=multi_csv" \
  -o test_export.zip
```

### Export System Monitoring

```bash
# Monitor memory during exports
heroku logs --app covid-co2-tracker | grep "sample#memory"

# Check for timeout errors
heroku logs --app covid-co2-tracker | grep "H12"

# Monitor export endpoints
heroku logs --tail --app covid-co2-tracker | grep -E "export|Export|R14|memory"

# Check token usage
heroku run rails runner "puts ExportToken.first.usage_count" --app covid-co2-tracker
```

### Success Criteria
- ✓ All export formats return data without errors
- ✓ Memory usage stays below 400MB
- ✓ No R14/R15 errors in logs
- ✓ Response times < 5 seconds for normal queries
- ✓ Database connections < 15 (leaving headroom)
- ✓ Export token authentication works
- ✓ Rate limiting prevents abuse

---

## Appendix A: All Commands Reference

### Application Management
```bash
heroku apps:info --app covid-co2-tracker
heroku apps:errors --app covid-co2-tracker
heroku apps:favorites:add --app covid-co2-tracker
heroku apps:rename newname --app covid-co2-tracker
heroku apps:stacks --app covid-co2-tracker
```

### Buildpack Management
```bash
heroku buildpacks --app covid-co2-tracker
heroku buildpacks:add <buildpack-url> --app covid-co2-tracker
heroku buildpacks:add --index 1 <buildpack-url> --app covid-co2-tracker
heroku buildpacks:remove <buildpack-url> --app covid-co2-tracker
heroku buildpacks:clear --app covid-co2-tracker
heroku buildpacks:set <buildpack-url> --app covid-co2-tracker
```

### Configuration Management
```bash
heroku config --app covid-co2-tracker
heroku config:get KEY --app covid-co2-tracker
heroku config:set KEY=value --app covid-co2-tracker
heroku config:unset KEY --app covid-co2-tracker
heroku config:edit --app covid-co2-tracker
```

### Database Commands
```bash
heroku pg:backups --app covid-co2-tracker
heroku pg:backups:capture --app covid-co2-tracker
heroku pg:backups:download --app covid-co2-tracker
heroku pg:backups:restore <backup-id> DATABASE_URL --app covid-co2-tracker
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/New_York' --app covid-co2-tracker
heroku pg:bloat --app covid-co2-tracker
heroku pg:copy SOURCE TARGET --app covid-co2-tracker
heroku pg:credentials --app covid-co2-tracker
heroku pg:diagnose --app covid-co2-tracker
heroku pg:info --app covid-co2-tracker
heroku pg:kill <pid> --app covid-co2-tracker
heroku pg:killall --app covid-co2-tracker
heroku pg:links --app covid-co2-tracker
heroku pg:locks --app covid-co2-tracker
heroku pg:maintenance --app covid-co2-tracker
heroku pg:outliers --app covid-co2-tracker
heroku pg:ps --app covid-co2-tracker
heroku pg:psql --app covid-co2-tracker
heroku pg:reset DATABASE_URL --app covid-co2-tracker
heroku pg:settings --app covid-co2-tracker
heroku pg:upgrade ADDON_NAME --app covid-co2-tracker
heroku pg:vacuum-stats --app covid-co2-tracker
heroku pg:wait --app covid-co2-tracker
```

### Deployment Commands
```bash
git push heroku main
git push heroku branch:main
heroku container:push web --app covid-co2-tracker
heroku container:release web --app covid-co2-tracker
heroku plugins:install heroku-repo
heroku repo:gc --app covid-co2-tracker
heroku repo:purge_cache --app covid-co2-tracker
heroku repo:reset --app covid-co2-tracker
```

### Domain Management
```bash
heroku domains --app covid-co2-tracker
heroku domains:add www.example.com --app covid-co2-tracker
heroku domains:clear --app covid-co2-tracker
heroku domains:remove www.example.com --app covid-co2-tracker
heroku domains:wait --app covid-co2-tracker
```

### Dyno Management
```bash
heroku ps --app covid-co2-tracker
heroku ps:restart --app covid-co2-tracker
heroku ps:restart web --app covid-co2-tracker
heroku ps:scale web=2 --app covid-co2-tracker
heroku ps:scale web=1:standard-2x --app covid-co2-tracker
heroku ps:stop web --app covid-co2-tracker
heroku ps:type --app covid-co2-tracker
```

### Feature Flags
```bash
heroku features --app covid-co2-tracker
heroku features:disable <feature> --app covid-co2-tracker
heroku features:enable <feature> --app covid-co2-tracker
heroku features:info <feature> --app covid-co2-tracker
```

### Log Management
```bash
heroku logs --app covid-co2-tracker
heroku logs --tail --app covid-co2-tracker
heroku logs --num 100 --app covid-co2-tracker
heroku logs --grep "ERROR" --app covid-co2-tracker
heroku logs --source app --app covid-co2-tracker
heroku logs --dyno web.1 --app covid-co2-tracker
heroku drains --app covid-co2-tracker
heroku drains:add syslog://logs.example.com --app covid-co2-tracker
```

### Maintenance Mode
```bash
heroku maintenance --app covid-co2-tracker
heroku maintenance:off --app covid-co2-tracker
heroku maintenance:on --app covid-co2-tracker
```

### One-off Commands
```bash
heroku run bash --app covid-co2-tracker
heroku run rails console --app covid-co2-tracker
heroku run rails db:migrate --app covid-co2-tracker
heroku run rails db:seed --app covid-co2-tracker
heroku run rails runner "User.count" --app covid-co2-tracker
heroku run:detached rails heavy_task --app covid-co2-tracker
```

### Release Management
```bash
heroku releases --app covid-co2-tracker
heroku releases:info v42 --app covid-co2-tracker
heroku releases:output v42 --app covid-co2-tracker
heroku releases:rollback --app covid-co2-tracker
heroku releases:rollback v40 --app covid-co2-tracker
```

---

## Appendix B: Error Code Reference

### H Codes (HTTP/Router Errors)

| Code | Description | Solution |
|------|-------------|----------|
| **H10** | App crashed | Check logs, run `heroku restart` |
| **H11** | Backlog too deep | Scale dynos or optimize response times |
| **H12** | Request timeout (30s) | Add streaming headers, optimize queries, send immediate response |
| **H13** | Connection closed without response | Check for crashes in app initialization |
| **H14** | No web dynos running | Run `heroku ps:scale web=1` |
| **H15** | Idle connection (55s) | Add heartbeat for streaming operations |
| **H16** | Redirect to herokuapp.com | Update DNS settings |
| **H17** | Poorly formatted HTTP response | Check response headers |
| **H18** | Server request interrupted | Usually client disconnect, handle gracefully |
| **H19** | Backend connection timeout | Database or external service issue |
| **H20** | App boot timeout | Check database connectivity, optimize boot time |
| **H21** | Backend connection refused | Check database URL and credentials |
| **H22** | Connection limit reached | Upgrade database or add PgBouncer |
| **H23** | Endpoint misconfigured | Check Procfile and PORT binding |
| **H24** | Forced close | Usually timeout, check long-running requests |
| **H25** | HTTP restriction | SSL certificate issue |
| **H26** | Request error | Bad client request |
| **H27** | Client request interrupted | Client closed connection |
| **H28** | Client connection idle | Normal for long polling |
| **H31** | Misdirected request | HTTP/2 issue, usually ignorable |
| **H80** | Maintenance mode | Run `heroku maintenance:off` |
| **H81** | Blank app | No code deployed |
| **H82** | Free dyno quota exhausted | Upgrade to paid dyno |
| **H83** | Payment issue | Update billing |
| **H99** | Platform error | Heroku issue, wait or contact support |

### R Codes (Runtime Errors)

| Code | Description | Solution |
|------|-------------|----------|
| **R10** | Boot timeout | Optimize boot time, check database connection |
| **R12** | Exit timeout | Add graceful shutdown handling |
| **R13** | Attach error | Dyno startup issue, restart |
| **R14** | Memory quota exceeded (>512MB) | Set `WEB_CONCURRENCY=1`, add GC tuning |
| **R15** | Memory quota vastly exceeded (>1GB) | Emergency restart, check for memory leaks |
| **R16** | Detached process | Process monitoring issue |
| **R17** | Checksum error | Deployment issue, redeploy |
| **R99** | Platform error | Heroku issue, contact support |

### L Codes (Logging Errors)

| Code | Description | Solution |
|------|-------------|----------|
| **L10** | Drain buffer overflow | Reduce log volume |
| **L11** | Tail buffer overflow | Reduce log output rate |
| **L12** | Local buffer overflow | Optimize logging |
| **L13** | Local delivery error | Check log drains |
| **L14** | Certificate validation error | Fix SSL certificates |
| **L15** | Tail delivery error | Heroku issue |

### Database-Specific Errors

| Error | Description | Solution |
|-------|-------------|----------|
| **PG::ConnectionBad** | Connection failed | Run `heroku pg:killall`, restart |
| **ActiveRecord::ConnectionTimeoutError** | Pool timeout | Check pool size, scale down dynos |
| **PG::TooManyConnections** | Connection limit hit | Add PgBouncer or upgrade database |
| **statement timeout** | Query too slow | Optimize query, add indexes |

---

## Appendix C: Configuration Files

### Gemfile (Production Monitoring)
```ruby
group :production do
  gem 'barnes'          # Runtime metrics
  gem 'rack-timeout'    # Request timeout handling
  gem 'strong_migrations' # Safe migrations
  gem 'zip_tricks'      # Streaming ZIP
  gem 'newrelic_rpm'    # APM (optional)
end
```

### Procfile (with PgBouncer)
```
web: bin/start-pgbouncer-stunnel bundle exec puma -C config/puma.rb
release: bundle exec rails db:migrate
```

### app.json (Heroku App Configuration)
```json
{
  "name": "COVID CO2 Tracker",
  "description": "Real-time CO2 monitoring application",
  "repository": "https://github.com/yourusername/covid-co2-tracker",
  "env": {
    "WEB_CONCURRENCY": {
      "description": "Number of Puma workers",
      "value": "1"
    },
    "RAILS_MAX_THREADS": {
      "description": "Number of threads per worker",
      "value": "3"
    },
    "RUBY_GC_HEAP_GROWTH_FACTOR": {
      "description": "GC heap growth factor",
      "value": "1.03"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "standard-1x"
    }
  },
  "addons": [
    "heroku-postgresql:essential-1",
    "papertrail:choklad"
  ],
  "buildpacks": [
    {
      "url": "https://github.com/gaffneyc/heroku-buildpack-jemalloc.git"
    },
    {
      "url": "heroku/ruby"
    }
  ]
}
```

### .buildpacks (Alternative to CLI)
```
https://github.com/gaffneyc/heroku-buildpack-jemalloc.git
https://github.com/heroku/heroku-buildpack-ruby.git
```

---

## Quick Health Check

One-liner system health check:
```bash
heroku ps --app covid-co2-tracker && heroku pg:info --app covid-co2-tracker && curl -I https://www.co2trackers.com/health
```

Check critical settings:
```bash
heroku config --app covid-co2-tracker | grep -E "WEB_CONCURRENCY|RAILS_MAX_THREADS|RUBY_GC"
```

Expected output:
```
WEB_CONCURRENCY: 1
RAILS_MAX_THREADS: 3
RUBY_GC_HEAP_GROWTH_FACTOR: 1.03
```

---

## Production Checklist

### Before Deployment
- [ ] WEB_CONCURRENCY=1 is set
- [ ] RAILS_MAX_THREADS=3 is set
- [ ] Ruby GC tuning variables configured
- [ ] Jemalloc buildpack added
- [ ] Puma config uses single worker
- [ ] Database pool matches RAILS_MAX_THREADS
- [ ] Streaming operations use batching
- [ ] Health endpoint implemented

### After Deployment
- [ ] Memory usage < 400MB under load
- [ ] No R14/R15 errors in logs
- [ ] Response times < 1 second P95
- [ ] Database connections < 15
- [ ] Export endpoints working
- [ ] Monitoring showing metrics

### Weekly Maintenance
- [ ] Review memory trends
- [ ] Check for slow queries
- [ ] Verify backup schedule
- [ ] Test health endpoint
- [ ] Review error logs
- [ ] Check token usage

### Monthly Maintenance
- [ ] Full database backup download
- [ ] Security token rotation
- [ ] Dependency updates
- [ ] Performance analysis
- [ ] Cost optimization review
- [ ] Capacity planning

---

*This guide consolidates all Heroku operational knowledge for the COVID CO2 Tracker. Use Ctrl+F to search for specific topics, error codes, or commands. Last updated: 2025*

## Archive Recommendation

After using this consolidated guide, consider archiving the original files:
```bash
# Create archive directory
mkdir -p copilot_notes/archived/heroku/

# Move original files (keep this guide in main directory)
mv copilot_notes/heroku-*.md copilot_notes/archived/heroku/
# Keep HEROKU-COMPLETE-GUIDE.md in copilot_notes/
```