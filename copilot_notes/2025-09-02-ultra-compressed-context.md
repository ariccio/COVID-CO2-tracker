# Ultra-Compressed Context: Export System → Production

## One-Line Summary
Export system built, works locally, needs tests + gems + config before Heroku deployment.

## Critical Must-Dos
1. `heroku config:set WEB_CONCURRENCY=1` OR DIE (Rails 7.1 + 512MB = crash)
2. Add gems: barnes, rack-timeout, strong_migrations
3. Add user_name to ALLOWED_FIELDS (not email!)
4. Write tests (0 exist currently)
5. Deploy: code → migrate → create token

## What's Built
- Token auth export system
- 3 formats: CSV, JSONL, ZIP
- Streaming with 450MB safety limit
- Works perfectly locally

## What's Missing
- Tests (ZERO coverage)
- Production gems
- WEB_CONCURRENCY config
- API docs
- DB indexes

## Commands Ready
```bash
# After adding gems and tests:
git push heroku main
heroku run rails db:migrate
heroku run rails console
# Then: ExportToken.create!(description: "Science", expires_at: 100.years.from_now, permissions: {formats: ["csv","jsonl","multi_csv"], max_records: 1000000})
```

## Full Context Location
`/copilot_notes/2025-09-02-session-context-complete.md` has EVERYTHING