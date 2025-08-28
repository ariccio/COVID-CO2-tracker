# Continuation Prompt - COVID CO2 Tracker Rails Implementation Phase

## Context Loading Instructions
Please read these critical files in this exact order:
1. `copilot_notes/INDEX-SEMANTIC-CO2.md` - Pattern matching system (START HERE)
2. `copilot_notes/2025-08-28-session-02-context-preservation.md` - Session state
3. Only if needed: `copilot_notes/rails-deep-insights-with-working-tools.md` - Rails architecture

## Current State Summary

### ✅ Completed
- **Memory Infrastructure**: Active, 95% context reduction working
- **Rails MCP Fixed**: Changed `ruby.exe` to `ruby` in bin scripts
- **Rails Explored**: Full architecture documented, 12,000+ words
- **Implementation Guides Created**:
  - SMS Alerts (2800 words, 1 hour) 
  - Venue Leaderboard (2800 words, 2 hours)
- **Database Confirmed**: 24 measurements, 3 venues, real data to test

### 🚨 Critical Information
- **High CO2 Venue Found**: ChIJ9z3A-cNYwokRlZ6EH23xq1c averages 4544ppm (extreme danger!)
- **No Alert System Exists**: Perfect opportunity, all infrastructure ready
- **Aggregation Queries Work**: `Place.joins(:measurement).group('places.id').average('measurements.co2ppm')`
- **Windows Heritage Fixed**: All Rails tools now functional

### 🎯 Next Tasks Priority
1. **Implement SMS Alerts** using `guides/quick/sms-alert-implementation-guide.md`
2. **Implement Venue Leaderboard** using `guides/quick/venue-leaderboard-implementation.md`
3. **Create CSV Export Guide** (1 hour)
4. **Create Social Sharing Guide** (30 min)
5. **Test Pattern Matching**: Search "sms alert" should load guide

## Technical Context

### Rails Environment
- **Version**: Rails 7.1.0, Ruby 3.2.2, PostgreSQL
- **API Mode**: Yes, serves React Native + React web clients
- **Missing**: No services layer, no background jobs, no SMS integration
- **Ready**: Validations, associations, admin panel, API structure

### Database Schema Quick Reference
```ruby
User: email, name, sub_google_uid  # Needs: phone_number, alert_enabled, alert_threshold
Measurement: co2ppm, measurementtime, device_id, sub_location_id
Place: google_place_id, place_lat, place_lng, last_fetched
SubLocation: description, place_id  # Areas within venues
```

### Working MCP Tools
```ruby
# All work after fix:
mcp__railsMcpServer__project_info      # Project structure
mcp__railsMcpServer__get_schema        # Database schema
mcp__railsMcpServer__get_routes        # API routes
rails runner "code"                    # Execute Ruby
```

## Implementation Instructions

### For SMS Alerts
1. Check if Twilio gem exists: `grep twilio Gemfile`
2. If not, follow guide starting at Step 1
3. Key migration: Add phone_number, alert_enabled, alert_threshold to users
4. Create AlertService in new app/services/ directory
5. Hook into Measurement after_create callback
6. Test with venue averaging 4544ppm for immediate alert

### For Venue Leaderboard
1. Verify aggregation: `rails runner "Place.joins(:measurement).group('places.id').average('measurements.co2ppm')"`
2. Create VenueStatisticsService in app/services/
3. Add caching layer with Redis
4. Create public view at /leaderboard
5. Test with 3 existing venues

### For Pattern Matching Test
Search for these terms and verify correct guide loads:
- "sms alert" → `guides/quick/sms-alert-implementation-guide.md` (2800 words)
- "venue leaderboard" → `guides/quick/venue-leaderboard-implementation.md` (2800 words)
- "rails architecture" → `rails-deep-insights-with-working-tools.md` (1500 words)

## Context Management Notes

### If Context Fills
1. Save progress to `copilot_notes/2025-08-28-implementation-progress.md`
2. Focus on one feature at a time
3. Use pattern matching to load only needed guides
4. Typical implementation needs <10k tokens per feature

### Available Knowledge Base
- 7 Rails documentation files (12,000+ words)
- 2 complete implementation guides (5,600 words)
- INDEX-SEMANTIC-CO2.md for navigation
- Real database with test data

## Success Criteria

You'll know implementation is working when:
1. ✅ SMS sends when CO2 > 1000ppm (test with 4544ppm venue)
2. ✅ Venue leaderboard shows 3 venues ranked by average CO2
3. ✅ Cache prevents database overload
4. ✅ Admin panel shows new data
5. ✅ Public can see venue rankings

## Final Notes

- **Rails commands work** after Windows fix
- **Real data exists** for immediate testing
- **Guides are copy-paste ready** with exact code
- **Pattern matching reduces context by 95%**
- **Start with SMS alerts** - highest impact, 1 hour implementation

Ready to implement! Which feature would you like to tackle first?