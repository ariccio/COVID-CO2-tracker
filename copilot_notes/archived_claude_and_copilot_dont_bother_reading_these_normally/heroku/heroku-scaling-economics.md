# Heroku Scaling Economics Guide
*Cost analysis and upgrade decision matrix for COVID CO2 Tracker*

## Current Baseline: $34/month
- **Dyno**: Standard-1X (512MB) - $25/month
- **Database**: Essential-1 (10GB, 20 connections) - $9/month
- **Capabilities**: ~50 concurrent users, 100k records/day

## Phase 1: Optimization First (No Additional Cost)
Before scaling, maximize current resources:

```bash
# Memory optimizations
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker
heroku buildpacks:add --index 1 https://github.com/gaffneyc/heroku-buildpack-jemalloc.git

# Connection pooling (if not using PgBouncer)
heroku buildpacks:add --index 1 heroku/pgbouncer
```

**When to stay in Phase 1**:
- Memory usage < 400MB consistently
- Response times < 1 second
- No R14 errors
- Database connections < 15

## Phase 2: Minimal Scaling ($70/month)
- **Dynos**: 2x Standard-1X - $50/month
- **Database**: Essential-2 (10GB, 40 connections) - $20/month
- **Capabilities**: ~200 concurrent users, 500k records/day

**Upgrade triggers**:
- Consistent R14 errors despite optimization
- Response times > 2 seconds under normal load
- Need for background workers
- Database connections exhausted (>18 used)

**Commands to scale**:
```bash
# Scale dynos
heroku ps:scale web=2 --app covid-co2-tracker

# Upgrade database (requires downtime)
heroku addons:upgrade heroku-postgresql:essential-2 --app covid-co2-tracker
```

## Phase 3: Growth Scaling ($145/month)
- **Dynos**: 3x Standard-1X - $75/month
- **Database**: Standard-0 (64GB, 120 connections) - $50/month
- **Redis**: Mini (25MB) - $3/month
- **Papertrail**: Choklad (2 days retention) - $7/month
- **New Relic**: Wayne (Lite) - $10/month
- **Capabilities**: ~500 concurrent users, 2M records/day

**Upgrade triggers**:
- Consistent traffic > 100 requests/minute
- Database size approaching 8GB
- Need for caching layer
- Multiple export consumers

**Commands to scale**:
```bash
# Add Redis for caching
heroku addons:create heroku-redis:mini --app covid-co2-tracker

# Add monitoring
heroku addons:create papertrail:choklad --app covid-co2-tracker
heroku addons:create newrelic:wayne --app covid-co2-tracker

# Upgrade database
heroku addons:upgrade heroku-postgresql:standard-0 --app covid-co2-tracker
```

## Phase 4: Performance Tier ($535/month)
- **Dyno**: Performance-M (2.5GB RAM) - $250/month
- **Database**: Standard-2 (256GB, 400 connections) - $200/month
- **Redis**: Premium-0 (100MB) - $60/month
- **Monitoring Suite**: - $25/month
- **Capabilities**: ~2000 concurrent users, 10M records/day

**Upgrade triggers**:
- Need for multiple Puma workers
- Complex background job processing
- Real-time streaming to 100+ clients
- Database size > 50GB

## Cost-Saving Strategies

### 1. Scheduled Scaling
```bash
# Scale up during peak (9am-5pm)
heroku ps:scale web=2 --app covid-co2-tracker

# Scale down during off-hours
heroku ps:scale web=1 --app covid-co2-tracker

# Automate with Heroku Scheduler ($0)
```

### 2. Database Optimization Before Upgrade
```bash
# Check actual usage
heroku pg:info --app covid-co2-tracker

# Vacuum and analyze
heroku pg:psql --app covid-co2-tracker -c "VACUUM ANALYZE;"

# Check bloat
heroku pg:bloat --app covid-co2-tracker
```

### 3. Free Monitoring Alternatives
- Use Barnes gem (free, included in dynos)
- Heroku metrics dashboard (free)
- Custom health endpoints (free)
- GitHub Actions for uptime monitoring (free)

## Decision Matrix

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

## ROI Analysis

### Monitoring Investment
- **Papertrail ($7/month)**: Worth it at Phase 3 for debugging
- **New Relic ($10-75/month)**: Worth it at Phase 3 for performance insights
- **PagerDuty ($19/month)**: Only for mission-critical uptime

### Database Investment
- **Essential-2 (+$11/month)**: 2x connections, good value
- **Standard-0 (+$41/month)**: 6x connections, follower support, worth at scale
- **Standard-2 (+$191/month)**: Only for large datasets or read replicas

### Dyno Investment
- **Additional Standard-1X (+$25/month)**: Linear scaling, predictable
- **Performance-M (+$225/month)**: 5x memory but 10x cost, evaluate carefully
- **Autoscaling ($25/month HireFire)**: Worth it at Phase 3+

## Scaling Commands Checklist

```bash
# Before scaling, always:
heroku pg:backups:capture --app covid-co2-tracker
heroku releases --app covid-co2-tracker

# Monitor during scaling:
heroku logs --tail --app covid-co2-tracker | grep -E "R14|R15|Error"

# After scaling:
heroku ps --app covid-co2-tracker
heroku pg:info --app covid-co2-tracker
curl -I https://covid-co2-tracker.herokuapp.com/health
```

## Export System Specific Considerations

- Streaming exports use ~50MB per concurrent stream
- ZIP generation can spike memory by 100MB
- Each export client needs 1-2 database connections
- Cache export results to reduce database load

**Export scaling formula**:
- Max concurrent exports = (Available Memory - 300MB) / 50MB
- On Standard-1X: ~4 concurrent exports safely
- On Performance-M: ~40 concurrent exports safely