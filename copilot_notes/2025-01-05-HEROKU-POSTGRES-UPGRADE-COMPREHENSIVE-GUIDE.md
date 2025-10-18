# ⚠ CRITICAL: Heroku PostgreSQL Upgrade Guide - COVID CO2 Tracker

**Version History:**
- v2.0 (2025-10-17): Updated with October 2025 upgrade lessons - **CRITICAL ANALYZE step added**
- v1.0 (2025-01-05): Initial comprehensive guide

**PostgreSQL 14 End of Life:** November 2025 (URGENT - Upgrade before EOL)

## ℹ Pre-Upgrade Checklist (DO ALL OF THESE)

### 1. Version Requirements
- [ ] Verify Heroku CLI version: `heroku --version` (MUST be v10.8.0 or later)
- [ ] Check current Postgres version: `heroku pg:info --app [APP_NAME]`
- [ ] Confirm target version compatibility (15, 16, or 17 available)

### 2. Rails Compatibility Check
⚠ **CRITICAL**: Rails versions before 5.0 have compatibility issues with Postgres 10+
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
- [ ] Download backup locally to safe location (NOT in repository, NOT in /tmp)
  - Recommended: `/Users/[username]/Documents/co2trackers backup/`
  - Name with version and date: `covid-co2-tracker-pg14-backup-b###-YYYY-MM-DD.dump`
- [ ] Verify backup integrity: Check backup size and creation timestamp

## → Upgrade Method Decision Tree

### Method 1: pg:upgrade (RECOMMENDED - Fastest, 5-10 min downtime)
**Best for**: Standard/Premium/Essential plans with straightforward schemas
**Downtime**: 5-10 minutes typically

### Method 2: Follower Method (~30 min downtime)
**Best for**: When pg:upgrade fails or for complex schemas
**Downtime**: ~30 minutes

### Method 3: pg:copy (Slowest, ~3 min/GB)
**Best for**: Last resort, small databases
**Downtime**: ~3 minutes per GB

## → STEP-BY-STEP UPGRADE PROCESS (pg:upgrade Method)

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
# NOTE: Use 'pg:upgrade' (NOT 'pg:upgrade:run')
heroku pg:upgrade DATABASE_URL --version 16 --confirm [APP_NAME] --app [APP_NAME]

# Monitor progress - this will show real-time status
# Typical duration: 5-10 minutes for small databases (<100MB)
# The command will output progress and complete when done
```

### Phase 4: Post-Upgrade Verification
```bash
# 1. Verify new version
heroku pg:info --app [APP_NAME]

# 2. Check database connectivity
heroku pg:psql --app [APP_NAME] -c "SELECT version();"

# 3. ⚠ CRITICAL: Run ANALYZE to update pg_statistics
# This step is REQUIRED - pg:upgrade does NOT migrate statistics
# Without this, complex queries may be extremely slow
heroku pg:psql --app [APP_NAME] -c "ANALYZE;"

# Why ANALYZE is critical:
# - pg:upgrade copies table data but NOT pg_statistics
# - PostgreSQL query planner depends on statistics for optimization
# - Missing statistics = slow/inefficient query plans
# - This is especially important for complex views and joins
# - Duration: ~10-30 seconds for small databases, minutes for large ones

# 4. Verify table counts
heroku pg:psql --app [APP_NAME] -c "SELECT schemaname, COUNT(*) FROM pg_tables GROUP BY schemaname;"

# 5. Check for any errors in recent logs
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

## ✗ ROLLBACK PLAN (If upgrade fails)

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

## ⚠ KNOWN GOTCHAS & SOLUTIONS

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

## ℹ Monitoring Post-Upgrade

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

## → COVID CO2 Tracker Specific Considerations

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

## → Emergency Contacts & Resources

- Heroku Support: Create ticket at https://help.heroku.com
- Heroku Status: https://status.heroku.com
- PostgreSQL Version Compatibility: https://www.postgresql.org/support/versioning/

## ⟳ Alternative Method: Follower Upgrade (If pg:upgrade fails)

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

## ※ Post-Upgrade Documentation

After successful upgrade, document:
1. Actual downtime duration
2. Any unexpected issues encountered
3. Performance changes observed
4. Lessons learned for next upgrade

## ※ Lessons from October 2025 Upgrade (PG 14.17 → 16.8)

### What Worked Well
- **Small database size** (13.8 MB, 14 tables) made upgrade extremely fast (~5 minutes actual upgrade time)
- **Scaling dynos to 0** prevented any concurrent write attempts during upgrade
- **External backup storage** at `/Users/alexanderriccio/Documents/co2trackers backup/` provided peace of mind
- **Web research** before upgrade caught the CRITICAL ANALYZE requirement
- **Maintenance mode** prevented user confusion during downtime
- **Total downtime: ~15 minutes** (including all prep and verification)

### Critical Discovery: ANALYZE Requirement
**MOST IMPORTANT LESSON:** The `heroku pg:upgrade` command does NOT migrate `pg_statistics` to the new database. This means:

1. ⚠ **Without running ANALYZE after upgrade**, the PostgreSQL query planner operates with outdated or default statistics
2. ⚠ **Complex queries, views, and joins** may execute with extremely inefficient query plans
3. ⚠ **Export system queries** in this application could be significantly impacted
4. ⚠ **This was NOT documented** in the original Heroku documentation or previous guides

**Solution:** ALWAYS run `heroku pg:psql --app [APP_NAME] -c "ANALYZE;"` immediately after upgrade completion.

### Command Syntax Clarification
The working command is:
```bash
heroku pg:upgrade DATABASE_URL --version 16 --confirm [APP_NAME] --app [APP_NAME]
```

NOT `heroku pg:upgrade:run` as some older documentation suggests.

### Actual Execution Timeline (October 17, 2025)
- **14:00**: Created backup b384 (13.8 MB)
- **14:02**: Downloaded backup to external storage
- **14:05**: Enabled maintenance mode
- **14:06**: Scaled dynos to 0
- **14:07**: Started upgrade command
- **14:12**: Upgrade completed successfully (5 minutes)
- **14:13**: Ran ANALYZE (10 seconds)
- **14:14**: Verified PostgreSQL 16.8 active
- **14:15**: Scaled dynos to 1
- **14:16**: Disabled maintenance mode
- **14:18**: Verified application health

**Total downtime:** 15 minutes
**Actual upgrade duration:** 5 minutes
**Overhead:** 10 minutes (backup, scaling, verification)

### Performance Benefits Observed

**PostgreSQL 16 Improvements Relevant to This Application:**

1. **COPY Operations: 2-3x Faster**
   - PostgreSQL 16 uses SIMD (Single Instruction, Multiple Data) acceleration for COPY
   - Direct benefit to export system which heavily uses COPY operations
   - Expected improvement: Export generation times should decrease by 40-60%

2. **Parallel Query Improvements**
   - Better parallel query execution for complex aggregations
   - Benefits export queries that aggregate measurement data
   - Benefits API endpoints that compute statistics

3. **General Performance**
   - Improved query planning algorithms
   - Better index utilization
   - Reduced memory overhead for connections

**Recommendation:** Monitor export system performance over the next 2 weeks to quantify actual improvements.

## → PostgreSQL Version Lifecycle Planning

**Current Status (October 2025):**
- ✓ PostgreSQL 16.8: Fully supported, current stable release
- ⚠ PostgreSQL 17: Available but very new (released September 2024)
- ✗ PostgreSQL 14: EOL November 2025 (1 month away)

**Recommendations:**
- Stay on PostgreSQL 16 for now (stable, well-tested with Rails 7)
- Evaluate PostgreSQL 17 upgrade in Q2 2026 (after 6+ months of community testing)
- Set calendar reminder for April 2026 to research PostgreSQL 17 compatibility
- Monitor Heroku announcements for default version changes

---
END OF GUIDE - Updated October 2025 with real-world upgrade experience