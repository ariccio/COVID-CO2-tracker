# Heroku Operations Overflow - Advanced Rails Deployment

Extended Heroku operational knowledge beyond quick fixes in main docs. Load this for advanced Heroku operations, deployment issues, scaling, and less common troubleshooting.

## Table of Contents
1. [PostgreSQL Operations](#postgresql-operations)
2. [Dyno Types and Scaling](#dyno-types-and-scaling)
3. [Add-on Management](#add-on-management)
4. [Log Aggregation](#log-aggregation)
5. [Rollback Procedures](#rollback-procedures)
6. [Memory Profiling](#memory-profiling)
7. [Performance Optimization](#performance-optimization)
8. [SSL and Domains](#ssl-and-domains)

---

## PostgreSQL Operations

### Database Backups

**Manual backup**:
```bash
heroku pg:backups:capture --app covid-co2-tracker
heroku pg:backups:download --app covid-co2-tracker
```

**Scheduled backups** (should already be configured):
```bash
# Check schedule
heroku pg:backups:schedules --app covid-co2-tracker

# Schedule daily backups at 2am
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/New_York' --app covid-co2-tracker
```

**Restore from backup**:
```bash
# List backups
heroku pg:backups --app covid-co2-tracker

# Restore to staging (test first!)
heroku pg:backups:restore b001 DATABASE_URL --app covid-co2-tracker-staging --confirm covid-co2-tracker-staging

# Restore to production (CAREFUL!)
heroku pg:backups:restore b001 DATABASE_URL --app covid-co2-tracker --confirm covid-co2-tracker
```

### Database Maintenance Windows

**Check maintenance window**:
```bash
heroku pg:info --app covid-co2-tracker
# Look for "Maintenance" line
```

**Maintenance types**:
- **Required maintenance**: Heroku will perform automatically (can't opt out)
- **Optional maintenance**: Security updates, performance improvements (can schedule)

**Schedule maintenance**:
```bash
# During low-traffic window (e.g., Sunday 3am)
heroku pg:maintenance:schedule --window 'Sunday 03:00 America/New_York' --app covid-co2-tracker
```

**What happens during maintenance**:
- Brief downtime (usually <5 minutes)
- Database connections drop
- Rails will reconnect automatically
- Background jobs may retry

**Prepare for maintenance**:
1. Schedule during low-traffic window
2. Monitor error rates before/after
3. Have rollback plan ready
4. Alert users if extended maintenance expected

### VACUUM Operations

**Why VACUUM**:
- PostgreSQL doesn't immediately reclaim space from deleted rows
- Regular VACUUM prevents table bloat
- Improves query performance

**Check table bloat**:
```sql
-- Connect to database
heroku pg:psql --app covid-co2-tracker

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Manual VACUUM** (during maintenance window):
```sql
-- VACUUM specific table
VACUUM ANALYZE measurements;

-- VACUUM all tables (can take hours on large DB)
VACUUM ANALYZE;

-- VACUUM FULL (locks table, use rarely)
VACUUM FULL measurements;
```

### Database Upgrades

**Check current version**:
```bash
heroku pg:info --app covid-co2-tracker
# Look for "PG Version" line
```

**Upgrade process**:
1. **Staging first** (always test!)
2. **Backup production** before upgrade
3. **Read upgrade notes** for breaking changes
4. **Schedule during maintenance window**
5. **Monitor errors** after upgrade

```bash
# Upgrade to latest version
heroku pg:upgrade DATABASE_URL --version 14 --app covid-co2-tracker
```

---

## Dyno Types and Scaling

### Dyno Type Comparison

**This project's dyno types**:

| Type | Memory | CPU | Use Case | Cost |
|------|--------|-----|----------|------|
| eco | 512MB | Shared | Development, staging | $5/mo |
| basic | 512MB | Shared | Small production (<1k daily users) | $7/mo |
| standard-1x | 512MB | Dedicated | Production (1-10k daily users) | $25/mo |
| standard-2x | 1GB | Dedicated | High memory (exports, jobs) | $50/mo |
| performance-m | 2.5GB | Dedicated | Heavy processing | $250/mo |

**Current setup** (check with `heroku ps --app covid-co2-tracker`):
```
web: standard-1x (2 dynos)
worker: standard-2x (1 dyno)  # More memory for export jobs
```

### Scaling Strategies

**Horizontal scaling** (more dynos):
```bash
# Scale web dynos
heroku ps:scale web=3 --app covid-co2-tracker

# Scale worker dynos
heroku ps:scale worker=2 --app covid-co2-tracker
```

**Vertical scaling** (bigger dynos):
```bash
# Upgrade web dyno type
heroku ps:type web=standard-2x --app covid-co2-tracker

# Upgrade worker dyno type (recommended for exports)
heroku ps:type worker=performance-m --app covid-co2-tracker
```

**Autoscaling** (add-on required):
- Not currently configured
- Consider for high-traffic events
- Requires Heroku Autoscale add-on

**When to scale web**:
- Response time > 500ms
- Request queue backing up
- CPU > 80% sustained
- Daily active users > 5k

**When to scale worker**:
- Job queue backing up
- Export failures due to memory (R14)
- Processing time > expected
- Multiple export requests

### Cost Optimization

**Current monthly cost** (estimate):
```
Web (standard-1x × 2): $50/mo
Worker (standard-2x × 1): $50/mo
PostgreSQL (standard-0): $50/mo
Redis (premium-0): $15/mo
Total: ~$165/mo
```

**Optimization strategies**:
1. Use eco dynos for staging
2. Scale down workers during low-traffic hours
3. Use database connection pooling (PgBouncer)
4. Review and remove unused add-ons

---

## Add-on Management

### Redis Configuration

**Check Redis info**:
```bash
heroku redis:info --app covid-co2-tracker
```

**Redis for this project**:
- Sidekiq job queue
- Rails cache store
- Session store

**Connection URL**:
```ruby
# config/initializers/redis.rb
$redis = Redis.new(url: ENV['REDIS_URL'], driver: :hiredis)
```

**Monitor Redis**:
```bash
# Check memory usage
heroku redis:info --app covid-co2-tracker | grep used_memory

# Check connected clients
heroku redis:cli --app covid-co2-tracker
> CLIENT LIST
```

### Monitoring Add-ons

**Current monitoring** (check `heroku addons --app covid-co2-tracker`):
- Papertrail (log aggregation)
- NewRelic (APM, if installed)
- Heroku Metrics (basic)

**Recommended add-ons**:
- **Scout APM**: Performance monitoring
- **Rollbar**: Error tracking
- **Librato**: Custom metrics

---

## Log Aggregation

### Papertrail Usage

**View logs**:
```bash
# Tail logs
heroku logs --tail --app covid-co2-tracker

# Filter by dyno
heroku logs --ps web.1 --tail --app covid-co2-tracker

# Filter by source
heroku logs --source app --tail --app covid-co2-tracker
```

**Search in Papertrail**:
```
program:web error
program:worker ExportWorker
"Time.zone" initialization
```

**Create alerts**:
1. Go to Papertrail dashboard
2. Search for pattern (e.g., "ERROR" or "R14")
3. Click "Save Search"
4. Set up alert email/webhook

### Log Parsing for Debugging

**Common patterns**:

**Memory issues**:
```bash
heroku logs --ps worker --tail | grep R14
```

**Slow queries**:
```bash
heroku logs --source app | grep "ActiveRecord.*[0-9]{4}ms"
```

**Export failures**:
```bash
heroku logs --source app | grep "ExportWorker"
```

---

## Rollback Procedures

### Release Rollback

**List recent releases**:
```bash
heroku releases --app covid-co2-tracker
```

**Rollback code deploy**:
```bash
# Rollback to previous release
heroku rollback --app covid-co2-tracker

# Rollback to specific release
heroku rollback v123 --app covid-co2-tracker
```

**Rollback doesn't revert**:
- Database migrations (must rollback manually)
- Config vars (must set manually)
- Add-on changes

### Database Migration Rollback

**Check migration status**:
```bash
heroku run rails db:migrate:status --app covid-co2-tracker
```

**Rollback last migration**:
```bash
heroku run rails db:rollback --app covid-co2-tracker
```

**Rollback to specific version**:
```bash
heroku run rails db:migrate:down VERSION=20251017123456 --app covid-co2-tracker
```

**Zero-downtime rollback strategy**:
1. Deploy code that works with both old and new schema
2. Run migration
3. Deploy code that uses new schema
4. If issues: Deploy code that works with old schema, then rollback migration

### Config Var Rollback

**View config history**:
```bash
heroku releases:info v123 --app covid-co2-tracker
```

**Restore previous config**:
```bash
# Copy from release info
heroku config:set OLD_VAR=old_value --app covid-co2-tracker
```

---

## Memory Profiling

### Debugging R14 Errors

**R14 error**: Memory quota exceeded (512MB for standard-1x)

**Find memory-hungry code**:

```ruby
# Add to suspect code
def export_large_data
  memory_before = `ps -o rss= -p #{Process.pid}`.to_i / 1024
  Rails.logger.info("Memory before: #{memory_before}MB")

  # ... your code

  memory_after = `ps -o rss= -p #{Process.pid}`.to_i / 1024
  delta = memory_after - memory_before
  Rails.logger.info("Memory after: #{memory_after}MB (delta: +#{delta}MB)")
end
```

**Use memory_profiler gem**:

```ruby
# Gemfile
gem 'memory_profiler', group: :development

# Usage
require 'memory_profiler'

report = MemoryProfiler.report do
  # Suspect code here
  ExportService.process(export: export)
end

report.pretty_print
```

**Common memory issues in this project**:
- Loading all measurements into memory (use find_each)
- Not releasing CSV buffer (use streaming)
- Large JSON structures (use streaming or pagination)

**Solutions**:
1. Stream data (never load all at once)
2. Force GC periodically
3. Scale to standard-2x or performance-m dynos
4. Reduce batch sizes

### Heap Dump Analysis

**Generate heap dump** (Heroku with performance-m dyno):
```bash
heroku run:detached "ruby -e \"require 'objspace'; ObjectSpace.dump_all(output: File.open('heap.json','w'))\"" --app covid-co2-tracker

# Download heap dump
heroku ps:exec --app covid-co2-tracker
# Then scp heap.json locally
```

**Analyze with heapy gem**:
```bash
gem install heapy
heapy read heap.json
```

---

## Performance Optimization

### Database Connection Pooling

**PgBouncer add-on**:
```bash
heroku addons:create heroku-postgresql:standard-0 --as DATABASE_URL --app covid-co2-tracker
heroku addons:create pgbouncer:mini --app covid-co2-tracker
```

**Update database.yml**:
```yaml
production:
  url: <%= ENV['DATABASE_URL'] %>
  pool: <%= ENV['DB_POOL'] || ENV.fetch('RAILS_MAX_THREADS', 5) %>
  prepared_statements: false  # Required for PgBouncer
```

### CDN for Asset Delivery

**CloudFront configuration** (if not using Rails asset pipeline):
```ruby
# config/environments/production.rb
config.action_controller.asset_host = ENV['CDN_HOST']
```

### Request Queue Optimization

**Check request queue time**:
```bash
heroku logs --tail --app covid-co2-tracker | grep "service="
# Look for "wait=" metric
```

**If wait time > 100ms**:
- Scale web dynos horizontally
- Optimize slow endpoints
- Add caching

---

## SSL and Domains

### Custom Domain Setup

**Add domain**:
```bash
heroku domains:add www.co2trackers.com --app covid-co2-tracker
heroku domains:add co2trackers.com --app covid-co2-tracker
```

**Get DNS target**:
```bash
heroku domains --app covid-co2-tracker
# Note the "DNS Target" for each domain
```

**Configure DNS**:
```
# At your DNS provider (e.g., Cloudflare, Route53)
Type: CNAME
Name: www
Target: <DNS target from heroku domains>

Type: ALIAS (or ANAME)
Name: @
Target: <DNS target from heroku domains>
```

### SSL Certificate

**Automated Certificate Management (ACM)**:
- Heroku automatically provisions SSL certificates
- Requires DNS to be configured correctly
- Takes 15-60 minutes to provision

**Check certificate status**:
```bash
heroku certs:auto --app covid-co2-tracker
```

**If certificate fails**:
```bash
heroku certs:auto:refresh --app covid-co2-tracker
```

---

## Advanced Heroku CLI Commands

### Run Detached Commands

**For long-running tasks**:
```bash
# Run migration in background
heroku run:detached rails db:migrate --app covid-co2-tracker

# Check status
heroku ps --app covid-co2-tracker
```

### PostgreSQL psql Tricks

**Copy data between environments**:
```bash
# Backup production
heroku pg:backups:capture --app covid-co2-tracker

# Restore to staging
heroku pg:backups:restore <backup-id> DATABASE_URL --app covid-co2-tracker-staging
```

**Direct SQL queries**:
```bash
heroku pg:psql --app covid-co2-tracker

-- Count measurements by venue
SELECT venue_id, COUNT(*) FROM measurements GROUP BY venue_id ORDER BY COUNT(*) DESC LIMIT 10;

-- Check for N+1 in recent exports
SELECT user_id, COUNT(*) as export_count, MAX(created_at) as last_export
FROM exports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY export_count DESC;
```

### Console Access

**Rails console**:
```bash
heroku run rails console --app covid-co2-tracker

# Check export status
Export.where(status: 'processing').count

# Check rate limits
ExportToken.for_user(User.first).consumed.recent(1.hour).count

# Force process stuck export
ExportWorker.new.perform(123)
```

---

## Emergency Procedures

### Site Down Checklist

1. **Check dyno status**
   ```bash
   heroku ps --app covid-co2-tracker
   ```

2. **Check error rates**
   ```bash
   heroku logs --tail | grep ERROR
   ```

3. **Check database**
   ```bash
   heroku pg:info --app covid-co2-tracker
   ```

4. **Check recent deploys**
   ```bash
   heroku releases --app covid-co2-tracker
   ```

5. **Rollback if recent deploy**
   ```bash
   heroku rollback --app covid-co2-tracker
   ```

6. **Scale up if resource exhaustion**
   ```bash
   heroku ps:scale web=4 --app covid-co2-tracker
   ```

### Data Loss Prevention

**Immediate backup before risky operation**:
```bash
heroku pg:backups:capture --app covid-co2-tracker
heroku pg:backups:download --app covid-co2-tracker
```

**Test on staging first**:
```bash
# Copy production data to staging
heroku pg:backups:capture --app covid-co2-tracker
heroku pg:backups:restore $(heroku pg:backups:public-url --app covid-co2-tracker) DATABASE_URL --app covid-co2-tracker-staging --confirm covid-co2-tracker-staging

# Test operation on staging
heroku run rails db:migrate --app covid-co2-tracker-staging
```

---

✓ Following Heroku best practices and zero-downtime deployment patterns.
