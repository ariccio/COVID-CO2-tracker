# 🚨 CRITICAL: Heroku PostgreSQL Upgrade Guide - COVID CO2 Tracker
Generated: 2025-01-05 | Priority: HIGH - Must complete this month!

## 📋 Pre-Upgrade Checklist (DO ALL OF THESE)

### 1. Version Requirements
- [ ] Verify Heroku CLI version: `heroku --version` (MUST be v10.8.0 or later)
- [ ] Check current Postgres version: `heroku pg:info --app [APP_NAME]`
- [ ] Confirm target version compatibility (15, 16, or 17 available)

### 2. Rails Compatibility Check
⚠️ **CRITICAL**: Rails versions before 5.0 have compatibility issues with Postgres 10+
- [ ] Verify Rails version: `bundle show rails` (We're on 7.1.3.4 - SAFE ✓)

### 3. Database Analysis
- [ ] Check database size: `heroku pg:info --app [APP_NAME]`
- [ ] Check schema count: `heroku pg:psql --app [APP_NAME] -c "SELECT count(DISTINCT schema_name) FROM information_schema.schemata;"`
- [ ] Check object count: `heroku pg:psql --app [APP_NAME] -c "SELECT count(*) FROM pg_class WHERE relkind IN ('r','v','m','S','f','');"`

**WARNING FLAGS**:
- More than 1,000 schemas → Higher risk, test thoroughly
- More than 10,000 database objects → Higher risk, test thoroughly

### 4. Backup Strategy
- [ ] Create fresh backup: `heroku pg:backups:capture --app [APP_NAME]`
- [ ] Download backup locally: `heroku pg:backups:download --app [APP_NAME]`
- [ ] Verify backup integrity

## 🎯 Upgrade Method Decision Tree

### Method 1: pg:upgrade (RECOMMENDED - Fastest, 5-10 min downtime)
**Best for**: Standard/Premium/Essential plans with straightforward schemas
**Downtime**: 5-10 minutes typically

### Method 2: Follower Method (~30 min downtime)
**Best for**: When pg:upgrade fails or for complex schemas
**Downtime**: ~30 minutes

### Method 3: pg:copy (Slowest, ~3 min/GB)
**Best for**: Last resort, small databases
**Downtime**: ~3 minutes per GB

## 🚀 STEP-BY-STEP UPGRADE PROCESS (pg:upgrade Method)

### Phase 1: Preparation (30 minutes before maintenance)
```bash
# 1. Announce maintenance to users (if applicable)

# 2. Create final backup
heroku pg:backups:capture --app [APP_NAME]

# 3. Check current database color/name
heroku pg:info --app [APP_NAME]
# Note the database color (e.g., DATABASE_URL, HEROKU_POSTGRESQL_AMBER_URL)

# 4. Test upgrade feasibility (OPTIONAL but recommended)
heroku pg:upgrade:prepare [DATABASE_COLOR] --app [APP_NAME]
```

### Phase 2: Maintenance Mode (CRITICAL - Prevents data loss)
```bash
# 1. Enable maintenance mode
heroku maintenance:on --app [APP_NAME]

# 2. Scale down ALL dynos to prevent writes
heroku ps:scale web=0 worker=0 --app [APP_NAME]

# 3. Verify no active connections
heroku pg:ps --app [APP_NAME]

# 4. Kill any remaining connections if needed
heroku pg:killall --app [APP_NAME]
```

### Phase 3: Execute Upgrade
```bash
# Run the upgrade (specify version if needed)
heroku pg:upgrade:run [DATABASE_COLOR] --app [APP_NAME] --version 16

# Monitor progress - this will show real-time status
# Typical duration: 5-10 minutes
```

### Phase 4: Post-Upgrade Verification
```bash
# 1. Verify new version
heroku pg:info --app [APP_NAME]

# 2. Check database connectivity
heroku pg:psql --app [APP_NAME] -c "SELECT version();"

# 3. Verify table counts
heroku pg:psql --app [APP_NAME] -c "SELECT schemaname, COUNT(*) FROM pg_tables GROUP BY schemaname;"

# 4. Check for any errors in recent logs
heroku logs --tail --app [APP_NAME]
```

### Phase 5: Restore Service
```bash
# 1. Scale dynos back up
heroku ps:scale web=1 worker=1 --app [APP_NAME]

# 2. Disable maintenance mode
heroku maintenance:off --app [APP_NAME]

# 3. Monitor application logs
heroku logs --tail --app [APP_NAME]

# 4. Run application health checks
# - Check main endpoints
# - Verify data exports work
# - Test authentication
```

## 🔴 ROLLBACK PLAN (If upgrade fails)

### Immediate Rollback Steps:
```bash
# 1. If upgrade fails mid-process, pg:upgrade automatically rolls back

# 2. If issues found post-upgrade:
# Restore from backup
heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app [APP_NAME]

# 3. Verify restoration
heroku pg:info --app [APP_NAME]

# 4. Resume normal operations
heroku ps:scale web=1 worker=1 --app [APP_NAME]
heroku maintenance:off --app [APP_NAME]
```

## ⚠️ KNOWN GOTCHAS & SOLUTIONS

### 1. Connection Pool Issues
**Problem**: Connection pooler might not reconnect after upgrade
**Solution**: 
```bash
heroku ps:restart --app [APP_NAME]
```

### 2. Follower Database Disconnect
**Problem**: Followers need to be recreated after upgrade
**Solution**:
```bash
# Unfollow old database
heroku pg:unfollow [FOLLOWER_DATABASE] --app [APP_NAME]
# Create new follower
heroku addons:create heroku-postgresql:standard-0 --follow [PRIMARY_DATABASE_URL] --app [APP_NAME]
```

### 3. Heroku Connect Issues
**Problem**: Heroku Connect might disconnect
**Solution**: Reconnect through Heroku Connect dashboard

### 4. Additional Credentials Not Migrated
**Problem**: Extra database credentials don't transfer
**Solution**: Recreate credentials post-upgrade
```bash
heroku pg:credentials:create --app [APP_NAME]
```

## 📊 Monitoring Post-Upgrade

### First Hour:
- [ ] Check response times
- [ ] Monitor error rates
- [ ] Verify all background jobs running
- [ ] Check database performance metrics

### First 24 Hours:
- [ ] Review slow query logs
- [ ] Check for any deprecated function warnings
- [ ] Verify all scheduled tasks completed
- [ ] Monitor memory usage patterns

## 🎯 COVID CO2 Tracker Specific Considerations

### Our Database Profile:
- Rails 7.1.3.4 (Compatible ✓)
- API-only backend
- Export services that stream data
- Rate limiting via Rack Attack
- React frontend with bursty patterns

### Critical Functions to Test Post-Upgrade:
1. Export endpoints (CSV, JSON, XML)
2. Authentication (Google OAuth)
3. Measurement data queries
4. Rate limiting functionality
5. Streaming exports for large datasets

### Timing Recommendation:
- Schedule during lowest traffic (check analytics)
- Allocate 2-hour window (5-10 min actual, rest for verification)
- Have team member available for validation

## 📞 Emergency Contacts & Resources

- Heroku Support: Create ticket at https://help.heroku.com
- Heroku Status: https://status.heroku.com
- PostgreSQL Version Compatibility: https://www.postgresql.org/support/versioning/

## 🔄 Alternative Method: Follower Upgrade (If pg:upgrade fails)

```bash
# 1. Create follower with new version
heroku addons:create heroku-postgresql:standard-0 --follow DATABASE_URL --version 16 --app [APP_NAME]

# 2. Wait for follower to sync
heroku pg:wait --app [APP_NAME]

# 3. Check sync status
heroku pg:info --app [APP_NAME]

# 4. Maintenance mode
heroku maintenance:on --app [APP_NAME]
heroku ps:scale web=0 worker=0 --app [APP_NAME]

# 5. Promote follower
heroku pg:promote [FOLLOWER_DATABASE_COLOR] --app [APP_NAME]

# 6. Restore service
heroku ps:scale web=1 worker=1 --app [APP_NAME]
heroku maintenance:off --app [APP_NAME]
```

## 📝 Post-Upgrade Documentation

After successful upgrade, document:
1. Actual downtime duration
2. Any unexpected issues encountered
3. Performance changes observed
4. Lessons learned for next upgrade

---
END OF GUIDE - Save this for the actual upgrade!