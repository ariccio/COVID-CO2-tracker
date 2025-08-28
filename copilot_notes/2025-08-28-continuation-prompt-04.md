# Continuation Prompt for Session 05
*Copy and paste this entire prompt into Claude Code to continue seamlessly*

## Critical Information
**⚠️ RAILS SERVER IS RUNNING - PID 16869**
Kill it first with: `kill 16869`

## Context
I'm implementing the multi-format export system for the COVID CO2 Tracker. We've successfully implemented CSV and JSONL exports with Rails caching and authentication. Currently fixing the multi-file CSV export that creates a ZIP file with normalized data.

## Current Issue to Fix
The multi-file CSV export fails because we're referencing non-existent model fields:
1. `Place` model has NO `name` field - only has: id, google_place_id, place_lat, place_lng, last_fetched
2. `SubLocation` model has NO `location_within_place` field - only has: id, description, place_id

Fix needed in `/app/services/export/multi_csv_service.rb`:
- Line 170: Remove `sanitize_for_export(sub_location.location_within_place)` 
- Line 270: Same issue in `write_sub_locations_to_stream`

## Working Components
- **ExportToken**: Authentication working, token: `KSkrSDNv8UHCNeZumSZBJSbK`
- **CSV Export**: ✅ Working with field selection
- **JSONL Export**: ✅ Working with filters (found 4544ppm CO2 venue!)
- **Rails Caching**: ✅ Smart TTLs, conditional GET support
- **Rate Limiting**: ✅ Via Rails.cache

## Quick Test Commands
```bash
# Check if server still running
ps aux | grep 16869

# Test CSV export
curl -H 'Authorization: Bearer KSkrSDNv8UHCNeZumSZBJSbK' \
  'http://localhost:3000/api/v1/export?format_type=csv&fields=co2_ppm,timestamp'

# Test multi-CSV (after fix)
curl -H 'Authorization: Bearer KSkrSDNv8UHCNeZumSZBJSbK' \
  'http://localhost:3000/api/v1/export?format_type=multi_csv' -o test.zip
unzip -l test.zip
```

## Files to Review
- `/app/services/export/multi_csv_service.rb` - Needs field fixes
- `/app/controllers/api/v1/exports_controller.rb` - Controller with streaming
- `/app/services/export/csv_service.rb` - Working CSV implementation
- `/tmp/rails_server.log` - Server logs if needed

## Next Steps
1. Fix the SubLocation field references in MultiCsvService
2. Test the ZIP export works
3. Add RSpec tests for all export services
4. Deploy to production

## Rails Patterns We're Using
```ruby
# Streaming with ActionController::Live
response.stream.write(data)

# Smart caching
Rails.cache.fetch(cache_key, expires_in: dynamic_ttl) do
  generate_export
end

# Conditional GET
if stale?(last_modified: last_update, etag: checksum)
  send_file
end

# Fix SQL DISTINCT issues
.reorder(nil).distinct.pluck(:id)
```

The export system implements all patterns from the Rails enhancement guides created in session 03. We're very close to completion - just need to fix the model field references!