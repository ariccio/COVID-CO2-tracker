# Heroku Production Monitoring Setup
*Complete monitoring and alerting configuration for COVID CO2 Tracker*

## CRITICAL: Essential Production Gems

**Deploy these gems immediately** for proper monitoring:

```ruby
# Gemfile additions for production monitoring
gem 'barnes'          # Heroku runtime metrics
gem 'rack-timeout'    # Request timeout handling  
gem 'strong_migrations' # Safe database migrations
gem 'newrelic_rpm'    # Application performance monitoring (optional)
```

**Install command**:
```bash
bundle add barnes rack-timeout strong_migrations
git add Gemfile Gemfile.lock
git commit -m "Add essential production monitoring gems"
git push heroku main
```

## Barnes Configuration (Runtime Metrics)

**Automatic setup** - Barnes automatically sends detailed metrics to Heroku logs:

```bash
# After deployment, you'll see enhanced log metrics:
heroku logs --tail --app covid-co2-tracker | grep "sample#"

# Expected output includes:
# sample#memory_total=185.23MB
# sample#memory_rss=183.06MB  
# sample#memory_cache=2.17MB
# sample#memory_swap=0.00MB
# sample#load_avg_1m=0.04
```

**Benefits**:
- Detailed memory breakdowns (RSS, cache, swap)
- Load average monitoring
- CPU utilization tracking
- No configuration required - just add the gem

## Rack::Timeout Configuration

**Prevent request timeouts** (essential for Heroku's 30-second limit):

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
    # Log slow requests
    duration = env[Rack::Timeout::ENV_INFO_KEY].ms
    if duration > 10000  # 10 seconds
      Rails.logger.warn "Slow request: #{env['REQUEST_URI']} took #{duration}ms"
    end
  end
end
```

**Environment variable override**:
```bash
# Allow longer timeouts for streaming operations
heroku config:set RACK_TIMEOUT_SERVICE_TIMEOUT=25 --app covid-co2-tracker
```

## Custom Performance Monitoring Middleware

**Deploy this middleware** for detailed application monitoring:

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
```

**Register the middleware**:
```ruby
# config/application.rb
config.middleware.use PerformanceMonitor
```

## Papertrail Log Aggregation Setup

**Add Papertrail addon** (enhanced log search and alerting):

```bash
# Add Papertrail for log aggregation and search
heroku addons:create papertrail:choklad --app covid-co2-tracker

# View Papertrail dashboard
heroku addons:open papertrail --app covid-co2-tracker
```

**Configure critical alerts in Papertrail dashboard**:

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

## Database Performance Monitoring

**Essential database monitoring commands**:

```bash
# Monitor slow queries (run weekly)
heroku pg:outliers --app covid-co2-tracker

# Check database health (run daily)
heroku pg:diagnose --app covid-co2-tracker

# Monitor connection usage (run during deployments)
heroku pg:ps --app covid-co2-tracker
```

**Database performance alerting script**:
```bash
#!/bin/bash
# Save as scripts/monitor_database.sh

APP=covid-co2-tracker

echo "📊 Database Health Check - $(date)"

# Check connection count
connections=$(heroku pg:ps --app $APP | grep -c "SELECT\|INSERT\|UPDATE\|DELETE")
echo "Active connections: $connections/20"

if [ "$connections" -gt 15 ]; then
  echo "⚠️ WARNING: High connection usage ($connections/20)"
fi

if [ "$connections" -gt 18 ]; then
  echo "🚨 CRITICAL: Connection limit approaching ($connections/20)"
  heroku pg:ps --app $APP
fi

# Check for slow queries
slow_queries=$(heroku pg:outliers --app $APP | grep -c "SELECT\|INSERT\|UPDATE\|DELETE")
if [ "$slow_queries" -gt 0 ]; then
  echo "⚠️ Found $slow_queries slow queries"
  heroku pg:outliers --app $APP
fi

echo "✅ Database check complete"
```

## Application Health Monitoring

**Health check endpoint** (if not already implemented):

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

**External health monitoring**:
```bash
# Set up external monitoring (UptimeRobot, Pingdom, etc.)
# Monitor: https://covid-co2-tracker.herokuapp.com/health
# Check frequency: Every 5 minutes
# Alert on: Non-200 status or >30 second response time
```

## Memory Trend Analysis

**Memory monitoring script** (run daily):

```bash
#!/bin/bash
# Save as scripts/memory_analysis.sh

APP=covid-co2-tracker
LOGFILE="memory_analysis_$(date +%Y%m%d).log"

echo "🧠 Memory Analysis - $(date)" | tee $LOGFILE

# Get last 24 hours of memory samples
heroku logs --num 5000 --app $APP | grep "sample#memory_total" | tail -100 | tee -a $LOGFILE

# Extract memory values and calculate statistics
memory_values=$(heroku logs --num 2000 --app $APP | grep "sample#memory_total" | sed 's/.*memory_total=\([0-9.]*\)MB.*/\1/' | head -50)

if [ -n "$memory_values" ]; then
  echo "" | tee -a $LOGFILE
  echo "📈 Memory Statistics:" | tee -a $LOGFILE
  
  # Calculate average, min, max
  echo "$memory_values" | awk '
    BEGIN { sum=0; count=0; min=999; max=0 }
    { 
      sum+=$1; count++; 
      if($1 < min) min=$1; 
      if($1 > max) max=$1 
    }
    END { 
      printf "Average: %.1fMB\n", sum/count
      printf "Minimum: %.1fMB\n", min
      printf "Maximum: %.1fMB\n", max
      if(max > 450) print "🚨 CRITICAL: Peak memory exceeded 450MB"
      else if(max > 400) print "⚠️ WARNING: Peak memory exceeded 400MB"
      else print "✅ Memory usage within safe limits"
    }
  ' | tee -a $LOGFILE
fi

echo "" | tee -a $LOGFILE
echo "💾 Storage location: $LOGFILE"
```

## Alert Thresholds Reference

### Memory Alerts
- **Normal**: <350MB (no action)
- **Elevated**: 350-400MB (monitor closely)
- **Warning**: 400-450MB (investigate, prepare to scale)
- **Critical**: 450-480MB (immediate intervention required)
- **Emergency**: >480MB (imminent R14/R15 error)

### Response Time Alerts  
- **Normal**: <500ms P95 (no action)
- **Elevated**: 500-1000ms P95 (monitor)
- **Warning**: 1000-5000ms P95 (investigate)
- **Critical**: 5000-20000ms P95 (performance issue)
- **Emergency**: >20000ms P95 (timeout risk)

### Database Connection Alerts
- **Normal**: <10 connections (no action)
- **Elevated**: 10-15 connections (monitor)
- **Warning**: 15-18 connections (investigate)  
- **Critical**: 18-20 connections (immediate action)
- **Emergency**: 20 connections (connection exhaustion)

### Error Rate Alerts
- **Normal**: <0.1% 5xx errors (no action)
- **Elevated**: 0.1-1% 5xx errors (monitor)
- **Warning**: 1-5% 5xx errors (investigate)
- **Critical**: >5% 5xx errors (system issue)
- **Emergency**: >10% 5xx errors (outage)

## Monitoring Dashboard Setup

**Key metrics to track daily**:

```bash
#!/bin/bash
# Save as scripts/daily_dashboard.sh

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

## Production Deployment Checklist

**Before deploying monitoring**:
- [ ] Barnes gem added and deployed
- [ ] Rack::Timeout configured with appropriate limits  
- [ ] PerformanceMonitor middleware registered
- [ ] Health check endpoint implemented
- [ ] Papertrail addon installed and configured
- [ ] Alert thresholds configured in Papertrail
- [ ] Monitoring scripts created and tested
- [ ] External health monitoring configured

**After deployment verification**:
- [ ] Enhanced metrics visible in logs (`sample#memory_total`)
- [ ] Performance logs showing request timing
- [ ] Health endpoint returning proper status
- [ ] Alerts triggering on test conditions
- [ ] Memory trend analysis working
- [ ] Database monitoring showing connection counts

**Ongoing maintenance**:
- [ ] Review memory trends weekly
- [ ] Check slow query report monthly
- [ ] Update alert thresholds based on usage patterns
- [ ] Archive performance logs monthly
- [ ] Test emergency procedures quarterly

This comprehensive monitoring setup ensures production visibility and proactive alerting for the COVID CO2 Tracker deployment while maintaining optimal performance within Heroku's constraints.