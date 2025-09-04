# ⚡ QUICK POSTGRES UPGRADE CHECKLIST - COVID CO2 Tracker
For use during actual upgrade - print this out!

## 🔴 STOP! Before Starting:
- [ ] Heroku CLI v10.8.0+? Run: `heroku --version`
- [ ] Fresh backup created? Run: `heroku pg:backups:capture --app [APP]`
- [ ] Users notified of maintenance?
- [ ] Team member available for validation?

## 🟡 PRE-FLIGHT (5 minutes)
```bash
# Get database info
heroku pg:info --app [APP_NAME]
# Note DATABASE COLOR: ________________

# Check upgrade feasibility
heroku pg:upgrade:prepare [DATABASE_COLOR] --app [APP_NAME]
# Result: ________________
```

## 🟢 UPGRADE EXECUTION (10-15 minutes)

### 1️⃣ LOCKDOWN (2 min)
```bash
heroku maintenance:on --app [APP_NAME]
heroku ps:scale web=0 worker=0 --app [APP_NAME]  
heroku pg:killall --app [APP_NAME]
```

### 2️⃣ UPGRADE (5-10 min)
```bash
heroku pg:upgrade:run [DATABASE_COLOR] --app [APP_NAME] --version 16
```
Start time: __________ End time: __________

### 3️⃣ VERIFY (2 min)
```bash
heroku pg:info --app [APP_NAME]
heroku pg:psql --app [APP_NAME] -c "SELECT version();"
```
New version confirmed? [ ] YES [ ] NO

### 4️⃣ RESTORE SERVICE (1 min)
```bash
heroku ps:scale web=1 worker=1 --app [APP_NAME]
heroku maintenance:off --app [APP_NAME]
```

## ✅ POST-UPGRADE VALIDATION (10 minutes)

### Application Checks:
- [ ] Homepage loads
- [ ] Can login with Google OAuth
- [ ] Export CSV works: `/api/v1/export?format_type=csv`
- [ ] Export JSON works: `/api/v1/export?format_type=json`
- [ ] No errors in logs: `heroku logs --tail --app [APP_NAME]`

### Database Checks:
- [ ] Measurement count correct: `SELECT COUNT(*) FROM measurements;`
- [ ] Recent data present: `SELECT MAX(created_at) FROM measurements;`
- [ ] No connection errors in logs

### Performance Checks:
- [ ] Response times normal
- [ ] No timeout errors
- [ ] Background jobs running

## 🔴 EMERGENCY ROLLBACK
If ANY issues:
```bash
# Get backup ID
heroku pg:backups --app [APP_NAME]

# Restore
heroku pg:backups:restore [BACKUP_ID] DATABASE_URL --app [APP_NAME]

# Resume
heroku ps:scale web=1 worker=1 --app [APP_NAME]
heroku maintenance:off --app [APP_NAME]
```

## 📱 Key Contacts
- Problem detected by: ________________
- Rollback decision by: ________________
- Time of decision: ________________

## 📝 Notes Section
_Use for any unexpected issues or observations:_

---

---

---

ACTUAL DOWNTIME: ________ minutes
ISSUES ENCOUNTERED: [ ] None [ ] Minor [ ] Major
ROLLBACK REQUIRED: [ ] No [ ] Yes

Completed by: ________________ Date/Time: ________________