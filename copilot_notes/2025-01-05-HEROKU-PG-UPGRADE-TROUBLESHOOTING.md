# 🔧 PostgreSQL Upgrade Troubleshooting Guide

## 🚨 Common Upgrade Failures & Solutions

### ERROR: "Upgrade preparation failed"
**Symptoms**: pg:upgrade:prepare fails with error
**Possible Causes**:
1. Incompatible extensions
2. Too many schemas (>1000)
3. Too many database objects (>10000)

**Solutions**:
```bash
# Check for problematic extensions
heroku pg:psql --app [APP] -c "SELECT * FROM pg_extension;"

# Check schema count
heroku pg:psql --app [APP] -c "SELECT COUNT(DISTINCT schema_name) FROM information_schema.schemata;"

# If too complex, use follower method instead
```

### ERROR: "Connection refused" after upgrade
**Symptoms**: App can't connect to database
**Solutions**:
```bash
# 1. Restart all dynos
heroku ps:restart --app [APP_NAME]

# 2. Check DATABASE_URL hasn't changed
heroku config:get DATABASE_URL --app [APP_NAME]

# 3. Force connection pool reset in Rails console
heroku run rails c --app [APP_NAME]
> ActiveRecord::Base.connection_pool.disconnect!
```

### ERROR: "FATAL: remaining connection slots are reserved"
**Symptoms**: Too many connections error
**Solutions**:
```bash
# 1. Kill all connections
heroku pg:killall --app [APP_NAME]

# 2. Check connection limit
heroku pg:info --app [APP_NAME]

# 3. Reduce connection pool if needed
heroku config:set DATABASE_POOL=5 --app [APP_NAME]
```

### ERROR: "pg_dump: error: query failed"
**Symptoms**: Backup/restore operations fail
**Possible Issues**:
- Corrupted indexes
- Invalid constraints
- Orphaned objects

**Solutions**:
```bash
# Run VACUUM and ANALYZE
heroku pg:psql --app [APP_NAME]
> VACUUM ANALYZE;

# Check for corruption
> SELECT schemaname, tablename 
  FROM pg_tables 
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY schemaname, tablename;

# Reindex if needed
> REINDEX DATABASE [database_name];
```

## 🔍 Diagnostic Commands

### Check Database Health
```bash
# Overall health
heroku pg:diagnose --app [APP_NAME]

# Bloat check
heroku pg:bloat --app [APP_NAME]

# Index usage
heroku pg:index-usage --app [APP_NAME]

# Slow queries
heroku pg:outliers --app [APP_NAME]
```

### Rails-Specific Issues

#### ActiveRecord::StatementInvalid errors
```ruby
# In Rails console
heroku run rails c --app [APP_NAME]

# Check connection
> ActiveRecord::Base.connection.active?

# Reset connection
> ActiveRecord::Base.connection.reconnect!

# Verify schema
> ActiveRecord::Base.connection.tables
```

#### Migration Issues Post-Upgrade
```bash
# Check migration status
heroku run rake db:migrate:status --app [APP_NAME]

# Re-run migrations if needed
heroku run rake db:migrate --app [APP_NAME]

# Check schema version
heroku pg:psql --app [APP_NAME] -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

## 🎯 COVID CO2 Tracker Specific Issues

### Export Service Failures
**Symptom**: CSV/JSON exports timeout or fail
**Check**:
```bash
# Test export query performance
heroku pg:psql --app [APP_NAME]
> EXPLAIN ANALYZE 
  SELECT * FROM measurements 
  WHERE created_at >= NOW() - INTERVAL '7 days'
  LIMIT 1000;

# Check for missing indexes
> \d measurements
```

### Rate Limiting Issues (Rack Attack)
**Symptom**: Legitimate requests being blocked
**Fix**:
```bash
# Clear Redis cache if using Redis
heroku redis:cli --app [APP_NAME]
> FLUSHDB

# Or restart to clear memory cache
heroku ps:restart --app [APP_NAME]
```

### React Frontend Connection Issues
**Symptom**: Frontend can't reach API
**Debug**:
```bash
# Check CORS configuration
heroku run rails c --app [APP_NAME]
> Rails.application.config.allowed_cors_origins

# Verify API endpoints
curl https://[APP_NAME].herokuapp.com/api/v1/measurements
```

## 📊 Performance Degradation Post-Upgrade

### Symptoms:
- Slower query performance
- Increased response times
- Higher memory usage

### Solutions:

#### 1. Update Statistics
```sql
-- Run in pg:psql
ANALYZE;
VACUUM ANALYZE;
```

#### 2. Rebuild Indexes
```sql
-- Rebuild all indexes
REINDEX DATABASE [database_name];

-- Or specific table
REINDEX TABLE measurements;
```

#### 3. Update Query Planner Settings
```bash
# Check current settings
heroku pg:settings --app [APP_NAME]

# Adjust if needed
heroku pg:settings:set work_mem=10MB --app [APP_NAME]
```

## 🔄 Rollback Scenarios

### When to Rollback:
1. ❌ Application won't start
2. ❌ Data corruption detected
3. ❌ Performance degraded >50%
4. ❌ Critical features broken
5. ❌ Unresolvable connection issues

### Clean Rollback Process:
```bash
# 1. Get latest backup ID
heroku pg:backups --app [APP_NAME]
# Note BACKUP_ID: ________

# 2. Inform team
echo "ROLLBACK INITIATED at $(date)"

# 3. Execute rollback
heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app [APP_NAME] --confirm [APP_NAME]

# 4. Verify
heroku pg:info --app [APP_NAME]
heroku run rails c --app [APP_NAME] -c "puts Measurement.count"

# 5. Resume service
heroku ps:restart --app [APP_NAME]
heroku maintenance:off --app [APP_NAME]
```

## 📝 Post-Incident Review

If rollback was needed, document:
1. Exact error messages
2. Time of failure
3. Attempted fixes
4. Decision point for rollback
5. Lessons learned

### Report Template:
```
INCIDENT: PostgreSQL Upgrade Failure
DATE: [DATE]
DURATION: [START] - [END]

WHAT HAPPENED:
- Attempted upgrade from PG[OLD] to PG[NEW]
- Failed at step: [STEP]
- Error: [ERROR MESSAGE]

IMPACT:
- Downtime: [MINUTES]
- Data loss: None/[DESCRIBE]
- User impact: [DESCRIPTION]

ROOT CAUSE:
[ANALYSIS]

REMEDIATION:
[STEPS TAKEN]

PREVENTION:
[FUTURE IMPROVEMENTS]
```

## 🆘 Getting Help

### Heroku Support
```bash
# Open support ticket
heroku help --app [APP_NAME]
```

### Useful Resources:
- PostgreSQL logs: `heroku logs --app [APP_NAME] --ps postgres`
- Database metrics: `heroku pg:info --app [APP_NAME]`
- Connection info: `heroku pg:credentials:url --app [APP_NAME]`

### Emergency SQL Queries:
```sql
-- Check for blocking queries
SELECT pid, usename, query, state, wait_event_type, wait_event 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;

-- Kill specific query
SELECT pg_terminate_backend([PID]);

-- Check table locks
SELECT relation::regclass, mode, granted 
FROM pg_locks 
WHERE relation IS NOT NULL;
```

---
Keep this guide handy during upgrade!