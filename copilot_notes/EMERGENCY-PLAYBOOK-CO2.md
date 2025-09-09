# ⚠ EMERGENCY PLAYBOOK - COVID CO2 TRACKER
*Last Updated: 2025-09-02 | KEEP THIS OPEN DURING EMERGENCIES*

## ■ QUICK DIAGNOSIS - START HERE

### What's Happening? (Match Your Symptoms)
- **Site completely down** → Go to [Section 1: App Not Responding](#1-app-not-responding-h10h12-errors)
- **Database errors everywhere** → Go to [Section 2: Database Locked](#2-database-lockedconnection-exhausted)
- **Site slow/crashing randomly** → Go to [Section 3: Memory Exhaustion](#3-memory-exhaustion-r14r15-errors)
- **Can't deploy new code** → Go to [Section 4: Deploy Failures](#4-deploy-failures)
- **Suspicious activity/breach** → Go to [Section 5: Security Breach](#5-security-breach-indicators)
- **Users reporting data loss** → Go to [Section 6: Data Recovery](#6-data-recovery-emergency)
- **Export system failing** → Go to [Section 7: Export System Down](#7-export-system-failures)

---

## 1. APP NOT RESPONDING (H10/H12 Errors)

### SYMPTOMS YOU'LL SEE:
```
Error R10 (Boot timeout) -> Web process failed to bind to $PORT
Error H10 (App crashed) -> desc="App crashed"
Error H12 (Request timeout) -> Request took longer than 30 seconds
503 Service Unavailable
Application Error page showing to users
```

### ▶ IMMEDIATE ACTIONS (DO THESE FIRST):
```bash
# 1. Restart the app (fixes 80% of issues)
heroku restart --app covid-co2-tracker

# 2. Check if it's back
heroku ps --app covid-co2-tracker

# 3. Watch the logs
heroku logs --tail --app covid-co2-tracker | grep -E "ERROR|FATAL|crashed"
```

### DIAGNOSIS COMMANDS:
```bash
# Check recent deploys (might have broken something)
heroku releases --app covid-co2-tracker

# Check dyno status
heroku ps --app covid-co2-tracker

# Check for memory issues
heroku logs --app covid-co2-tracker --num 100 | grep "Memory quota"

# Check database connections
heroku pg:info --app covid-co2-tracker
```

### FIX STEPS:
1. **If recent deploy broke it:**
   ```bash
   # Rollback immediately
   heroku rollback --app covid-co2-tracker
   ```

2. **If app won't start:**
   ```bash
   # Scale down then up
   heroku ps:scale web=0 --app covid-co2-tracker
   sleep 10
   heroku ps:scale web=1 --app covid-co2-tracker
   ```

3. **If still broken:**
   ```bash
   # Check for missing environment variables
   heroku config --app covid-co2-tracker | grep -E "DATABASE_URL|RAILS_MASTER_KEY"
   
   # Ensure Rails master key exists
   heroku config:get RAILS_MASTER_KEY --app covid-co2-tracker
   ```

### PREVENTION:
- Always run `rails test` before deploying
- Deploy during low-traffic hours
- Keep a local backup of working commit hash
- Monitor memory usage regularly

---

## 2. DATABASE LOCKED/CONNECTION EXHAUSTED

### SYMPTOMS YOU'LL SEE:
```
PG::ConnectionBad: FATAL: too many connections
ActiveRecord::ConnectionTimeoutError
database is locked (SQLite3::BusyException)
FATAL: remaining connection slots are reserved
ActiveRecord::StatementInvalid: PG::TRFatal
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. Kill all connections
heroku pg:killall --app covid-co2-tracker

# 2. Restart the database
heroku pg:restart --app covid-co2-tracker

# 3. Restart the app
heroku restart --app covid-co2-tracker
```

### DIAGNOSIS COMMANDS:
```bash
# See current connections
heroku pg:ps --app covid-co2-tracker

# Check connection limit
heroku pg:info --app covid-co2-tracker | grep "Conn"

# Find stuck queries
heroku pg:ps --app covid-co2-tracker | grep -E "idle|waiting"

# Check for locks
heroku pg:locks --app covid-co2-tracker
```

### FIX STEPS:
1. **Too many connections:**
   ```bash
   # Set connection pool size (in Rails console)
   heroku run rails console --app covid-co2-tracker
   # Then run:
   ActiveRecord::Base.connection_pool.disconnect!
   ```

2. **Stuck migrations:**
   ```bash
   # Force unlock
   heroku run rails db:migrate:status --app covid-co2-tracker
   heroku run rails db:rollback --app covid-co2-tracker
   ```

3. **Emergency connection reduction:**
   ```bash
   # Reduce pool size temporarily
   heroku config:set DATABASE_POOL=5 --app covid-co2-tracker
   heroku restart --app covid-co2-tracker
   ```

### PREVENTION:
- Set `DATABASE_POOL=25` (Heroku standard plan limit)
- Add connection pooling (pgbouncer)
- Close connections in background jobs
- Add timeout to long queries

---

## 3. MEMORY EXHAUSTION (R14/R15 Errors)

### SYMPTOMS YOU'LL SEE:
```
Error R14 (Memory quota exceeded)
Error R15 (Memory quota vastly exceeded)
Process running mem=512M(100.1%)
Swap used: 1024M of 512M
Worker terminated due to memory usage
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. Restart immediately (clears memory)
heroku restart --app covid-co2-tracker

# 2. Scale down workers if any
heroku ps:scale worker=0 --app covid-co2-tracker

# 3. Check memory metrics
heroku logs --app covid-co2-tracker --num 50 | grep "source=web.1 dyno=heroku"
```

### DIAGNOSIS COMMANDS:
```bash
# Current memory usage
heroku ps --app covid-co2-tracker

# Find memory leaks in logs
heroku logs --app covid-co2-tracker --num 200 | grep -E "mem=|Memory"

# Check for large queries
heroku logs --app covid-co2-tracker --num 100 | grep "SELECT" | grep -E "readings|measurements"
```

### FIX STEPS:
1. **Quick fix - Upgrade dyno temporarily:**
   ```bash
   # Upgrade to 1GB memory
   heroku ps:resize web=standard-2x --app covid-co2-tracker
   ```

2. **Clear cache:**
   ```bash
   heroku run rails runner "Rails.cache.clear" --app covid-co2-tracker
   ```

3. **Reduce puma workers:**
   ```bash
   # Edit config/puma.rb to reduce workers
   heroku config:set WEB_CONCURRENCY=1 --app covid-co2-tracker
   heroku restart --app covid-co2-tracker
   ```

### PREVENTION:
- Use pagination for large datasets
- Add `.limit(1000)` to queries
- Stream CSV exports instead of loading all data
- Monitor with `heroku addons:create scout`

---

## 4. DEPLOY FAILURES

### SYMPTOMS YOU'LL SEE:
```
! [rejected] main -> main (non-fast-forward)
Build failed -- check your build output
Precompiling assets failed
The Ruby version you are trying to install does not exist
Push rejected, failed to compile Ruby app
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. Check deploy status
heroku releases --app covid-co2-tracker

# 2. View build log
heroku logs --app covid-co2-tracker --num 200 | grep "Build"

# 3. If emergency, bypass and force deploy
git push heroku main --force
```

### DIAGNOSIS COMMANDS:
```bash
# Check buildpack
heroku buildpacks --app covid-co2-tracker

# Check Ruby version
heroku run ruby -v --app covid-co2-tracker

# Check for missing gems
heroku run bundle check --app covid-co2-tracker
```

### FIX STEPS:
1. **Asset precompilation failure:**
   ```bash
   # Clear build cache
   heroku plugins:install heroku-builds
   heroku builds:cache:purge --app covid-co2-tracker
   
   # Retry deploy
   git push heroku main
   ```

2. **Database migration failure:**
   ```bash
   # Skip migrations in deploy
   heroku config:set SKIP_MIGRATIONS=true --app covid-co2-tracker
   git push heroku main
   
   # Run migrations manually
   heroku run rails db:migrate --app covid-co2-tracker
   heroku config:unset SKIP_MIGRATIONS --app covid-co2-tracker
   ```

3. **Gem conflicts:**
   ```bash
   # Update lockfile
   rm Gemfile.lock
   bundle install
   git add Gemfile.lock
   git commit -m "Rebuild Gemfile.lock"
   git push heroku main
   ```

### PREVENTION:
- Test deploys on staging first
- Keep Ruby/Rails versions current
- Run `bundle exec rails assets:precompile` locally
- Commit Gemfile.lock after bundle updates

---

## 5. SECURITY BREACH INDICATORS

### SYMPTOMS YOU'LL SEE:
```
Unusual spike in database queries
Unknown IPs in logs
New admin users you didn't create
Mass data exports you didn't initiate
Modified environment variables
Suspicious entries in rails console history
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. LOCK DOWN IMMEDIATELY
heroku maintenance:on --app covid-co2-tracker

# 2. Rotate credentials
heroku config:set RAILS_MASTER_KEY=$(openssl rand -hex 32) --app covid-co2-tracker

# 3. Revoke all database credentials
heroku pg:credentials:rotate --app covid-co2-tracker
```

### DIAGNOSIS COMMANDS:
```bash
# Check recent admin actions
heroku run rails console --app covid-co2-tracker
# User.where(admin: true).where("created_at > ?", 7.days.ago)
# User.where(admin: true).pluck(:email, :created_at)

# Check for suspicious IPs
heroku logs --app covid-co2-tracker --num 1000 | grep -E "Started|Completed" | awk '{print $3}' | sort | uniq -c | sort -rn

# Check recent config changes
heroku releases:info --app covid-co2-tracker
```

### FIX STEPS:
1. **Secure the database:**
   ```bash
   # Backup immediately
   heroku pg:backups:capture --app covid-co2-tracker
   
   # Download backup locally
   heroku pg:backups:download --app covid-co2-tracker
   
   # Reset all user passwords
   heroku run rails console --app covid-co2-tracker
   # User.update_all(password_digest: nil)
   ```

2. **Audit and clean:**
   ```bash
   # Remove suspicious users
   heroku run rails console --app covid-co2-tracker
   # User.where("email NOT IN (?)", ["known@email.com"]).where(admin: true).destroy_all
   
   # Check for backdoors in code
   git log --oneline -20
   git diff HEAD~5
   ```

3. **Restore service:**
   ```bash
   # After securing
   heroku maintenance:off --app covid-co2-tracker
   
   # Force all users to re-login
   heroku run rails runner "User.update_all(updated_at: Time.current)" --app covid-co2-tracker
   ```

### PREVENTION:
- Enable 2FA on Heroku account
- Audit admin users weekly
- Use strong `RAILS_MASTER_KEY`
- Monitor for unusual activity patterns
- Regular security updates (`bundle audit`)

---

## 6. DATA RECOVERY EMERGENCY

### SYMPTOMS YOU'LL SEE:
```
Users reporting missing readings
Empty dashboard where data should be
"Record not found" errors
Database rollback messages
Accidentally dropped tables/columns
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. STOP all writes
heroku maintenance:on --app covid-co2-tracker

# 2. Capture current state
heroku pg:backups:capture --app covid-co2-tracker

# 3. Check available backups
heroku pg:backups --app covid-co2-tracker
```

### DIAGNOSIS COMMANDS:
```bash
# See what's missing
heroku run rails console --app covid-co2-tracker
# Measurement.count
# Measurement.where("created_at > ?", 1.day.ago).count
# User.count

# Check recent migrations
heroku run rails db:migrate:status --app covid-co2-tracker

# Find deletion time
heroku logs --app covid-co2-tracker --num 1000 | grep -E "DELETE|TRUNCATE|DROP"
```

### FIX STEPS:
1. **Restore from backup:**
   ```bash
   # List backups with timestamps
   heroku pg:backups --app covid-co2-tracker
   
   # Restore specific backup (e.g., b001)
   heroku pg:backups:restore b001 DATABASE_URL --app covid-co2-tracker
   ```

2. **Restore specific tables:**
   ```bash
   # Download backup
   heroku pg:backups:download --app covid-co2-tracker
   
   # Restore locally and export table
   pg_restore latest.dump -t measurements > measurements.sql
   
   # Import just that table
   heroku pg:psql --app covid-co2-tracker < measurements.sql
   ```

3. **Point-in-time recovery (if enabled):**
   ```bash
   # Fork database to specific time
   heroku addons:create heroku-postgresql:standard-0 --fork covid-co2-tracker::DATABASE_URL --as RECOVERED_DB --app covid-co2-tracker
   
   # Swap databases
   heroku pg:promote RECOVERED_DB --app covid-co2-tracker
   ```

### PREVENTION:
- Daily automated backups: `heroku pg:backups:schedule --at "02:00 America/New_York" --app covid-co2-tracker`
- Before risky operations: `heroku pg:backups:capture --app covid-co2-tracker`
- Test migrations on staging first
- Keep logical backups (CSV exports)

---

## 7. EXPORT SYSTEM FAILURES

### SYMPTOMS YOU'LL SEE:
```
Export downloads timing out (H12)
CSV files corrupted/incomplete
"Rack::Timeout::RequestTimeoutException"
Memory spikes during exports
Export queue backing up
```

### ▶ IMMEDIATE ACTIONS:
```bash
# 1. Check export queue size
heroku run rails console --app covid-co2-tracker
# Measurement.where(device_id: 1).count  # Check data size

# 2. Clear stuck exports
heroku restart --app covid-co2-tracker

# 3. Temporarily disable exports
heroku config:set EXPORTS_ENABLED=false --app covid-co2-tracker
```

### DIAGNOSIS COMMANDS:
```bash
# Find timeout errors
heroku logs --app covid-co2-tracker --num 200 | grep -E "Timeout|export|csv"

# Check memory during exports
heroku logs --app covid-co2-tracker --num 100 | grep "path=/export" -A 5 | grep mem=

# Database load
heroku pg:ps --app covid-co2-tracker
```

### FIX STEPS:
1. **Quick fix - Increase timeout:**
   ```bash
   # Increase to 60 seconds
   heroku config:set RACK_TIMEOUT_SERVICE_TIMEOUT=60 --app covid-co2-tracker
   heroku restart --app covid-co2-tracker
   ```

2. **Reduce export size:**
   ```bash
   # Add limits in Rails console
   heroku run rails console --app covid-co2-tracker
   # Edit app/services/export_service.rb to add .limit(10000)
   ```

3. **Use background job:**
   ```bash
   # Move to async processing
   heroku addons:create redis --app covid-co2-tracker
   heroku ps:scale worker=1 --app covid-co2-tracker
   ```

### PREVENTION:
- Implement pagination for large exports
- Use streaming responses
- Add progress indicators
- Set max export limits
- Cache common exports

---

## ⚡ CRITICAL COMMANDS REFERENCE

### Memory Emergency Kit
```bash
# THE PANIC BUTTON - Fixes most issues
heroku restart --app covid-co2-tracker

# Nuclear option - full restart
heroku ps:scale web=0 --app covid-co2-tracker && sleep 5 && heroku ps:scale web=1 --app covid-co2-tracker

# Memory upgrade (costs more)
heroku ps:resize web=standard-2x --app covid-co2-tracker

# Clear everything
heroku run rails runner "Rails.cache.clear" --app covid-co2-tracker
```

### Database Emergency Kit
```bash
# Kill connections
heroku pg:killall --app covid-co2-tracker

# Full restart
heroku pg:restart --app covid-co2-tracker

# Emergency backup
heroku pg:backups:capture --app covid-co2-tracker

# Connection info
heroku pg:info --app covid-co2-tracker
```

### Deploy Emergency Kit
```bash
# Rollback last deploy
heroku rollback --app covid-co2-tracker

# Force deploy
git push heroku main --force

# Skip migrations
heroku config:set SKIP_MIGRATIONS=true --app covid-co2-tracker

# Clear build cache
heroku builds:cache:purge --app covid-co2-tracker
```

### Diagnostic Kit
```bash
# Everything at once
heroku logs --tail --app covid-co2-tracker | grep -E "ERROR|FATAL|Error R|Error H"

# System status
heroku ps --app covid-co2-tracker

# Recent changes
heroku releases --app covid-co2-tracker

# Configuration
heroku config --app covid-co2-tracker
```

---

## ℹ CONTACT INFORMATION & ESCALATION

### Internal Contacts
1. **Primary Developer**: Alexander Riccio
   - GitHub: @DebugPrivilege
   - Has Heroku admin access
   - Knows database structure

2. **Database Issues**: 
   - Check Heroku Postgres dashboard first
   - Heroku support if database is down

3. **Security Issues**:
   - IMMEDIATELY: Take app offline
   - Document everything
   - Contact Alexander

### External Support

#### Heroku Support
- **Dashboard**: https://dashboard.heroku.com
- **Status Page**: https://status.heroku.com
- **Support Ticket**: https://help.heroku.com
- **Critical Issues**: Create "Urgent" ticket
- **Response Time**: 1-4 hours for critical

#### Service Dependencies
- **GitHub**: Check https://githubstatus.com
- **DNS**: Cloudflare or your provider
- **Rails Security**: https://groups.google.com/g/rubyonrails-security

### Escalation Path
1. **Level 1** (0-15 min): Try this playbook
2. **Level 2** (15-30 min): Contact Alexander
3. **Level 3** (30+ min): Open Heroku support ticket
4. **Level 4** (1hr+): Consider maintenance mode until resolved

### When to Call for Help
- Data loss or corruption
- Security breach suspected
- Site down > 30 minutes
- Can't diagnose after this playbook
- Multiple systems failing

---

## ◆ QUICK DECISION TREE

```
Is the site completely down?
├─ YES → Section 1 (App Not Responding)
└─ NO → Is it slow/partially working?
    ├─ YES → Section 3 (Memory Issues)
    └─ NO → Are there database errors?
        ├─ YES → Section 2 (Database Issues)
        └─ NO → Check other sections

Been trying for 30+ minutes?
├─ YES → Call for help
└─ NO → Try rollback to last known good

Is it 3am and you're panicking?
├─ YES → heroku restart --app covid-co2-tracker (seriously, try this first)
└─ NO → Follow the playbook methodically
```

---

## ※ POST-INCIDENT CHECKLIST

After resolving any emergency:

1. [ ] Document what happened in `/copilot_notes/incidents/`
2. [ ] Note the fix that worked
3. [ ] Update this playbook if needed
4. [ ] Check for data loss/corruption
5. [ ] Notify users if there was downtime
6. [ ] Schedule post-mortem if serious
7. [ ] Implement prevention measures
8. [ ] Test backups still work
9. [ ] Update monitoring alerts
10. [ ] Thank yourself - you fixed it!

---

## ▪ COMMON ERROR CODES REFERENCE

| Code | Meaning | Quick Fix |
|------|---------|-----------|
| H10 | App crashed | `heroku restart` |
| H12 | Request timeout | Check DB queries |
| H20 | App boot timeout | Check startup code |
| R10 | Boot timeout | Reduce boot time |
| R14 | Memory quota exceeded | Restart or resize |
| R15 | Memory vastly exceeded | Immediate restart |
| L10 | Drain buffer overflow | Check log drains |
| L11 | Tail buffer overflow | Reduce logging |

---

## ★ FINAL TIPS

1. **Don't Panic**: Most issues are fixable
2. **Restart First**: Seriously, it fixes 80% of problems
3. **Document Everything**: Future you will thank you
4. **Test on Staging**: If you have one
5. **Backup Before Big Changes**: Always
6. **Ask for Help**: Better than breaking more things
7. **Sleep**: Sometimes the best fix is fresh eyes

---

*Remember: Every senior developer has been where you are right now. You've got this!*

**Last Resort**: If absolutely nothing works and site is critical:
```bash
# Create a new app with last known good code
heroku create covid-co2-tracker-emergency
git push heroku main
# Point DNS to new app temporarily
```

---
*END OF EMERGENCY PLAYBOOK - KEEP THIS BOOKMARKED*