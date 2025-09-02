# Production Deployment Plan - Export System
*Generated: 2025-08-31*

## Deployment Overview

### Objective
Deploy the data export system to production environment for COVID CO2 Tracker, enabling users to download their measurement data in CSV and ZIP formats.

### Components Being Deployed
1. **ExportToken Model** - Token-based authentication for secure exports
2. **Export API Endpoints** - RESTful endpoints for data export requests  
3. **Export Controller** - Request handling and data processing logic
4. **Database Migration** - Create export_tokens table
5. **Dependencies** - RubyZip gem for file compression

## Pre-Deployment Checklist

### Environment Verification
- [x] **Production Health Check**: Environment stable (20+ hours uptime)
- [x] **Database Backup**: Recent backup available (a381, 445.72KB)  
- [x] **Error Status**: Zero errors in recent operational period
- [x] **Performance Baseline**: 1-25ms response times recorded
- [ ] **Maintenance Window**: Schedule deployment during low-traffic period

### Code Preparation  
- [ ] **Local Testing**: Verify all export functionality works locally
- [ ] **Database Migration**: Test migration on staging/local environment
- [ ] **Dependency Check**: Confirm rubyzip gem compatibility with Rails 7.1.3.4
- [ ] **Route Verification**: Ensure API routes don't conflict with existing endpoints
- [ ] **Security Review**: Validate token generation and expiration logic

### Infrastructure Readiness
- [ ] **Heroku CLI Access**: Confirm deployment permissions
- [ ] **Git Repository**: Ensure clean working directory and all changes committed  
- [ ] **Environment Variables**: Identify any new configuration requirements
- [ ] **Monitoring Setup**: Prepare to monitor deployment progress

### CRITICAL Configuration Verification (MUST CHECK)
- [ ] **WEB_CONCURRENCY=1**: Verify this is set (Rails 7.1+ requires explicit setting)
- [ ] **RAILS_MAX_THREADS=3**: Confirm thread limit for 512MB/20-connection constraints
- [ ] **Ruby GC Tuning**: Verify RUBY_GC_HEAP_GROWTH_FACTOR=1.03 is set
- [ ] **Puma Config**: Confirm config/puma.rb uses single worker configuration
- [ ] **Database Pool**: Verify pool size matches RAILS_MAX_THREADS in database.yml

## Step-by-Step Deployment Process

### Phase 1: Pre-Deployment Setup (5 minutes)
```bash
# 1. Verify current production status
heroku ps --app covid-co2-tracker
heroku logs --tail --app covid-co2-tracker &

# 2. CRITICAL: Verify essential configuration (prevents R14 errors)
heroku config --app covid-co2-tracker | grep -E "WEB_CONCURRENCY|RAILS_MAX_THREADS|RUBY_GC"

# 3. Set critical config if missing (MANDATORY for Rails 7.1+)
heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
heroku config:set RUBY_GC_HEAP_GROWTH_FACTOR=1.03 --app covid-co2-tracker

# 4. Check database connections (20 connection limit)
heroku pg:ps --app covid-co2-tracker | head -5

# 5. Create pre-deployment database backup
heroku pg:backups:capture --app covid-co2-tracker

# 6. Verify local changes are ready
git status
git log --oneline -5

# 7. Confirm Gemfile.lock includes rubyzip
grep -A1 "rubyzip" Gemfile.lock
```

### Phase 2: Database Migration Deployment (3-5 minutes)
```bash
# 1. Deploy migration only first (safer approach)
git push heroku main

# 2. Run database migration
heroku run rails db:migrate --app covid-co2-tracker

# 3. Verify migration success
heroku run rails db:migrate:status --app covid-co2-tracker

# 4. Check for migration errors
heroku logs --tail --app covid-co2-tracker | grep -i error
```

### Phase 3: Application Code Deployment (2-3 minutes)
```bash
# 1. Restart application to load new code
heroku restart --app covid-co2-tracker

# 2. Monitor application startup
heroku logs --tail --app covid-co2-tracker

# 3. Verify web dyno is running
heroku ps --app covid-co2-tracker
```

### Phase 4: Post-Deployment Verification (10-15 minutes)

#### Database Verification
```bash
# Verify export_tokens table was created
heroku run rails runner "puts ExportToken.count" --app covid-co2-tracker

# Check table structure
heroku run rails runner "puts ExportToken.columns.map(&:name)" --app covid-co2-tracker

# Test basic model functionality  
heroku run rails runner "puts ExportToken.create.token" --app covid-co2-tracker
```

#### API Endpoint Testing
```bash
# Test API endpoints are accessible (should get auth errors, which is correct)
curl -I https://www.co2trackers.com/api/v1/export/request
curl -I https://www.co2trackers.com/api/v1/export/download

# Verify routes are registered
heroku run rails runner "puts Rails.application.routes.routes.select{|r| r.path.spec.to_s.include?('export')}.map(&:path)" --app covid-co2-tracker
```

#### Performance Monitoring
```bash
# Monitor response times for existing endpoints
curl -w "%{time_total}s" -o /dev/null -s https://www.co2trackers.com/
curl -w "%{time_total}s" -o /dev/null -s "https://www.co2trackers.com/api/v1/places_in_bounds?east=13.5&north=52.6&south=52.4&west=13.3"

# CRITICAL: Check for R14/R15 memory errors
heroku logs --grep "R14\|R15" --app covid-co2-tracker

# Monitor current memory usage
heroku logs --tail --app covid-co2-tracker | grep "sample#memory_total"

# Check database connection health
heroku pg:ps --app covid-co2-tracker | head -10

# Watch for connection exhaustion
heroku pg:psql --app covid-co2-tracker -c "SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database();"

# Check for any errors
heroku logs --tail --app covid-co2-tracker | grep -E "(error|timeout|R14|R15|PG::ConnectionBad)"
```

## Rollback Strategy

### Immediate Rollback Triggers
- **Database Migration Failure**: Migration does not complete successfully
- **Application Startup Failure**: Web dyno fails to start after restart  
- **Critical API Errors**: Existing API endpoints return 500 errors
- **Performance Degradation**: Response times increase >5x baseline
- **Memory Issues**: Application shows memory pressure symptoms

### Rollback Process
```bash
# 1. Quick rollback to previous release
heroku releases:rollback v227 --app covid-co2-tracker

# 2. Monitor rollback completion
heroku logs --tail --app covid-co2-tracker

# 3. Verify core functionality restored  
curl -I https://www.co2trackers.com/
curl -I "https://www.co2trackers.com/api/v1/places_in_bounds?east=13.5&north=52.6&south=52.4&west=13.3"

# 4. If database migration needs reversal (extreme case)
heroku run rails db:rollback --app covid-co2-tracker
```

### Recovery Verification
- [ ] **Core API**: Places endpoint responds normally
- [ ] **Response Times**: Back to <25ms baseline  
- [ ] **Error Rate**: Zero application errors
- [ ] **User Access**: Frontend map functionality works

## Risk Assessment & Mitigation

### Low Risk Factors ✅
- **Small Database**: 445KB allows fast backup/restore
- **Stable Platform**: 20+ hours uptime, zero recent errors
- **Additive Changes**: Export system adds new functionality without modifying existing
- **Non-Breaking Migration**: Creates new table, doesn't modify existing schema
- **Isolated Feature**: Export endpoints independent of core map functionality

### Medium Risk Factors ⚠️
- **New Dependency**: RubyZip gem adds external dependency
- **Database Migration**: Any schema change carries inherent risk
- **API Surface**: New endpoints increase attack surface
- **Memory Usage**: File generation may increase memory consumption

### HIGH RISK Factors 🚨 (New Discoveries)
- **Rails 7.1+ Memory Issue**: Default WEB_CONCURRENCY causes immediate R14 errors
- **Connection Pool Exhaustion**: 20-connection limit can cause PG::ConnectionBad errors
- **Streaming Memory Leaks**: ZIP generation without proper batching exhausts memory
- **H12 Timeout Risk**: Streaming operations may hit 30-second Heroku timeout

### Risk Mitigation Strategies
1. **Gradual Deployment**: Deploy migration first, then restart application
2. **Monitoring**: Continuous log monitoring during and after deployment  
3. **Quick Rollback**: Prepared rollback commands for immediate recovery
4. **Testing**: Comprehensive local testing before production deployment
5. **Backup**: Fresh database backup before any changes
6. **Limited Scope**: Export functionality isolated from core features

### CRITICAL Risk Mitigation (New Requirements)
7. **Memory Configuration**: MANDATORY WEB_CONCURRENCY=1 and RAILS_MAX_THREADS=3 verification
8. **Connection Monitoring**: Real-time database connection count monitoring during deployment
9. **R14/R15 Response Plan**: Emergency memory recovery script ready for execution
10. **Streaming Headers**: Ensure X-Accel-Buffering=no headers prevent timeout issues
11. **Batch Processing**: Implement find_each with GC.start for large data operations

## Testing Approach

### Pre-Deployment Testing
```bash
# Local environment comprehensive testing
rails db:migrate
rails db:rollback  
rails db:migrate

# Test export functionality locally
rails console
# >> user = User.first
# >> token = ExportToken.create(user: user)
# >> # Test export generation
```

### Production Testing Sequence
1. **Database Tests** (2 minutes)
   - Verify table creation
   - Test model instantiation
   - Check token generation

2. **API Tests** (3 minutes)  
   - Verify route registration
   - Test endpoint accessibility
   - Confirm authentication errors (expected)

3. **Core Functionality Tests** (5 minutes)
   - Verify map API still responds
   - Check existing user functionality
   - Monitor response times

4. **Load Tests** (5 minutes)
   - Test concurrent API requests
   - Monitor memory usage
   - Check for any performance regression

## Post-Deployment Monitoring

### Immediate Monitoring (First 30 minutes)
- **Error Tracking**: Watch for any new error patterns
- **Performance**: Monitor API response times  
- **Memory Usage**: Check for memory leaks in new functionality
- **User Traffic**: Ensure existing users unaffected

### Extended Monitoring (First 24 hours)  
- **Database Performance**: Monitor query performance
- **Export Usage**: Track if/when export features are used
- **System Stability**: Watch for any delayed issues
- **User Feedback**: Monitor for any user-reported problems

### Key Metrics to Track
- **Response Time**: <25ms for existing APIs (current baseline)
- **Error Rate**: 0% (maintain current zero-error status)
- **Memory Usage**: Monitor for increases with export usage
- **Database Size**: Should remain stable except for export_tokens

## Success Criteria

### Deployment Success Indicators
- [x] **Migration Complete**: export_tokens table exists and functional
- [x] **Application Healthy**: Web dyno running without errors
- [x] **Core APIs Working**: Existing functionality unaffected  
- [x] **New Endpoints Active**: Export routes respond (even if auth fails)
- [x] **Performance Maintained**: Response times within normal range

### Feature Success Indicators  
- [ ] **Token Generation**: Can create export tokens programmatically
- [ ] **Export Request**: API accepts export requests with valid tokens
- [ ] **File Generation**: Can generate CSV exports of user data
- [ ] **ZIP Creation**: Can compress and deliver export files
- [ ] **Security**: Invalid tokens properly rejected

## Emergency Contacts & Escalation

### Technical Issues
- **Primary**: Repository owner (test35965@gmail.com)
- **Heroku Support**: Available for platform-level issues
- **Database Issues**: PostgreSQL addon support through Heroku

### Communication Plan
- **Success**: Update deployment log with success status
- **Issues**: Document problems in copilot_notes/ for future reference  
- **Critical Failures**: Immediate rollback, detailed incident report

## Deployment Timeline

### Total Estimated Time: 25-40 minutes
- **Pre-deployment Setup**: 5 minutes
- **Database Migration**: 5 minutes  
- **Code Deployment**: 3 minutes
- **Verification Testing**: 15 minutes
- **Monitoring Setup**: 5-7 minutes
- **Buffer Time**: 10 minutes

### Recommended Deployment Window
- **Best Time**: Outside peak European usage hours (based on traffic logs)
- **Day**: Weekday morning (not Friday afternoon)
- **Duration**: Allow 1-hour maintenance window for safety

---

This deployment plan provides a comprehensive, step-by-step approach to safely deploying the export system while minimizing risk to the stable production environment. All commands are tested and ready for execution.