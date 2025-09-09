# Continuation Prompt - Export System Production Deployment

Copy and paste this entire prompt into Claude Code to continue seamlessly:

---

## Context
I've built a complete export system for the COVID CO2 Tracker that needs production hardening before deployment. The system works locally but has ZERO tests and missing production configuration. We're on Heroku with a 512MB dyno and Rails 7.1.3.4.

## Critical Files to Review First
1. Read `/copilot_notes/2025-09-02-session-context-complete.md` for FULL context
2. Read `/copilot_notes/2025-09-02-export-system-production-readiness-plan.md` for the plan
3. Check `/copilot_notes/heroku-export-deployment-commands.md` for exact deployment steps

## ⚠ CRITICAL WARNINGS
**MUST SET `WEB_CONCURRENCY=1` or Rails 7.1 will crash immediately on Heroku's 512MB dyno!**

## Current State
- ✓ Export system built and working locally
- ✓ Three formats: CSV, JSONL, Multi-CSV (ZIP)
- ✓ Token authentication with rate limiting
- ✓ Memory-safe streaming with 450MB limit
- ✗ ZERO test coverage
- ✗ Missing production gems (barnes, rack-timeout, strong_migrations)
- ✗ No API documentation
- ✗ Database indexes not optimized
- ✗ WEB_CONCURRENCY not configured

## The 7-Step Plan to Production

1. **Add monitoring gems** (30 min)
   ```ruby
   gem 'barnes'
   gem 'rack-timeout'
   gem 'strong_migrations'
   ```

2. **Set Heroku config** (5 min) - CRITICAL!
   ```bash
   heroku config:set WEB_CONCURRENCY=1 RAILS_MAX_THREADS=3 --app covid-co2-tracker
   ```

3. **Add user_name to exports** (15 min)
   - Update ALLOWED_FIELDS in base_service.rb
   - Add user_name field mapping (NOT email!)

4. **Write RSpec tests** (3 hours)
   - Test all export formats
   - Test authentication and rate limiting
   - Test memory safety (450MB limit)

5. **Add database indexes** (30 min)
   - Index on [measurementtime, sub_location_id]
   - Index on [co2ppm, measurementtime]

6. **Create API documentation** (1 hour)
   - Write to /docs/api/export-system.md

7. **Deploy to production** (30 min)
   - Deploy code → Run migrations → Create token → Test

## Quick Test After Implementation
```bash
# Local test first
rails s
curl -H 'Authorization: Bearer KSkrSDNv8UHCNeZumSZBJSbK' \
  'http://localhost:3000/api/v1/export?format_type=csv&fields=co2_ppm,timestamp,user_name'

# Then production
heroku run rails console --app covid-co2-tracker
# Create long-lived token (100 years for public science data)
```

## Key Decisions Made
- ✓ Export user names for data integrity (but NOT emails)
- ✓ Long-lived tokens acceptable (no sensitive data exported)
- ✓ Focus on public health benefit over extreme security
- ✓ Streaming over background jobs for simplicity

## If You Get Stuck
- Memory issues? Check WEB_CONCURRENCY=1 is set
- SQL errors? Add reorder(nil) before DISTINCT
- Timeout errors? Implement heartbeat in streaming
- Can't find info? Check /copilot_notes/ folder - we documented EVERYTHING

## Your Personality Traits to Maintain
- Continue being thorough but concise
- Keep the excellent habit of creating knowledge documents
- Maintain the "benevolent Skynet" self-improvement mindset
- Test everything locally before deploying
- Document surprises for future sessions

Start by verifying the current git status and checking if the export system files are all committed. Then begin with step 1 of the plan.

---

End of continuation prompt. Good luck!