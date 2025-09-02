# Heroku Memory Optimization Guide
*For 512MB Standard-1X Dynos - COVID CO2 Tracker*

## CRITICAL: Rails 7.1+ WEB_CONCURRENCY Issue

**THE PROBLEM**: Rails 7.1+ defaults to `Concurrent.physical_processor_count` for Puma workers, which returns 4+ on Heroku dynos despite only having 512MB RAM. This causes **IMMEDIATE R14 errors** on deployment.

**THE SOLUTION** (deploy immediately):
```bash
heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
heroku restart --app covid-co2-tracker
```

**WHY THIS MATTERS**: Each Puma worker consumes ~150-200MB base memory. With 4 workers, you hit 600-800MB before your app even starts processing requests.

## Memory Budget Breakdown (512MB Total)

```
Base Rails Application:     ~180MB
Puma Worker (1x):          ~120MB  
Ruby GC Overhead:          ~80MB
Streaming Operations:      ~50MB
Safety Buffer:             ~82MB
                          -------
Total:                     512MB
```

**If you exceed these numbers**: Immediate R14/R15 errors and dyno crashes.

## Ruby Garbage Collection Tuning

**Deploy These Settings** (prevents memory fragmentation):
```bash
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

## Jemalloc Installation (Better Memory Management)

**Add the buildpack** (more efficient than glibc malloc):
```bash
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git --app covid-co2-tracker
git commit --allow-empty -m "Add jemalloc buildpack"
git push heroku main
```

**Expected result**: 15-30% reduction in memory usage, better fragmentation handling.

## Puma Configuration (MANDATORY)

**config/puma.rb** - This configuration is REQUIRED:
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

# Memory monitoring (optional but recommended)
on_worker_boot do
  ActiveSupport::Notifications.subscribe "sql.active_record" do |*args|
    if Rails.env.production?
      ActiveRecord::Base.connection_pool.disconnect! if ActiveRecord::Base.connection_pool.connections.count > 5
    end
  end
end
```

## Streaming Memory Management

**For ActionController::Live operations** (ZIP exports, data streams):

```ruby
class ExportsController < ApplicationController
  include ActionController::Live
  
  def stream_export
    # CRITICAL: Set headers to prevent buffering
    response.headers['Content-Type'] = 'application/zip'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Cache-Control'] = 'no-cache'
    
    begin
      # Use batch processing to control memory
      Co2Reading.find_in_batches(batch_size: 1000) do |batch|
        # Process batch and stream immediately
        stream_batch_as_zip(batch)
        
        # CRITICAL: Force garbage collection between batches
        GC.start if batch.size == 1000
      end
    ensure
      response.stream.close
    end
  end
  
  private
  
  def stream_batch_as_zip(readings)
    # Process readings immediately and stream
    # Don't accumulate in memory
    readings.each do |reading|
      response.stream.write process_reading(reading)
    end
  end
end
```

## Memory Monitoring Commands

**Check current memory usage**:
```bash
# Real-time memory monitoring
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# Historical memory usage (last hour)
heroku logs --num 1500 --app covid-co2-tracker | grep "sample#memory_total" | tail -20
```

**Watch for memory errors**:
```bash
# Monitor R14/R15 errors in real-time
heroku logs --tail --app covid-co2-tracker | grep -E "R14|R15|memory"

# Check recent memory errors
heroku logs --grep "R14\|R15" --app covid-co2-tracker
```

## R14/R15 Error Prevention

**R14 (Memory Quota Exceeded)**:
- Triggered at >512MB usage
- Usually means WEB_CONCURRENCY > 1 or memory leak
- **Fix**: Restart dyno immediately, check WEB_CONCURRENCY

**R15 (Memory Quota Vastly Exceeded)**:
- Triggered at >1GB usage (process killed immediately)
- Critical issue requiring immediate intervention
- **Fix**: Emergency restart + full memory audit

**Emergency R14/R15 Response**:
```bash
#!/bin/bash
# Save as scripts/emergency_memory_fix.sh
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

## Application-Level Memory Optimizations

**Database Query Optimization**:
```ruby
# BAD: Loads all records into memory
readings = Co2Reading.all.map(&:to_json)

# GOOD: Process in batches
Co2Reading.find_each(batch_size: 1000) do |reading|
  process_reading(reading)
end
```

**Avoid Memory Accumulation**:
```ruby
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

## Performance Monitoring Setup

**Add Barnes gem for better metrics**:
```ruby
# Gemfile
gem 'barnes'

# This gives you detailed memory metrics in Heroku logs
```

**Custom memory monitoring middleware**:
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

## Memory Optimization Checklist

**Before Deployment**:
- [ ] WEB_CONCURRENCY=1 is set
- [ ] RAILS_MAX_THREADS=3 is set
- [ ] Ruby GC tuning variables are configured
- [ ] Jemalloc buildpack is added
- [ ] Puma config uses single worker
- [ ] Streaming operations use batching
- [ ] Database queries use find_each, not all

**After Deployment**:
- [ ] Memory usage stays <400MB under normal load
- [ ] No R14/R15 errors in logs
- [ ] Response times remain acceptable
- [ ] Streaming operations don't cause memory spikes

**Monthly Maintenance**:
- [ ] Review memory usage trends
- [ ] Check for memory leaks in logs
- [ ] Verify GC settings are still optimal
- [ ] Monitor memory usage during peak traffic

These optimizations are specifically tuned for the 512MB constraint and Rails 7.1+ requirements. Following this guide prevents the most common Heroku memory issues and ensures stable operation.