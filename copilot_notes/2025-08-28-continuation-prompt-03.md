# Continuation Prompt for Session 04
*Copy and paste this entire prompt into Claude Code to continue seamlessly*

## Context
I'm working on the COVID CO2 Tracker Rails application. In the previous session (03), we successfully enhanced the knowledgebase using the `load_guide` tool from rails-mcp-server to incorporate official Rails documentation. The session focused entirely on documentation enhancement, creating comprehensive guides for implementation.

## Current State
**Rails Application**: Rails 7.1.0 API-only app on Heroku with PostgreSQL
**Memory Infrastructure**: Pattern-matching index reducing context by ~90%
**Rails MCP Server**: Working correctly after Windows fix, `load_guide` tool functional
**Documentation Phase**: Completed - 4 major enhancement documents created

## Key Documents Created in Session 03
1. **2025-08-28-rails-knowledgebase-enhancement-recommendations.md** - Rails 7.1 patterns, found existing TODO for normalizers
2. **2025-08-28-export-plan-rails-guide-enhancements.md** - Active Job, streaming, security
3. **2025-08-28-sms-alert-enhanced-with-rails-guides.md** - Solid Queue, security, phone verification
4. **2025-08-28-export-plan-additional-rails-enhancements.md** - Caching strategies, ETags, Solid Cache

## Critical Discoveries
- **Measurement model has TODO**: Already marked for Rails 7.1 normalizers
- **Venue with 4544ppm CO2**: Perfect for testing danger alerts
- **Heroku constraints**: 512MB RAM, 30-second timeout
- **Rails patterns ready**: Active Job, ActionController::Live, Rails.cache.fetch, Solid Queue

## Quick Wins Ready to Implement (30 min each)
1. Add Rails 7.1 normalizers to Measurement model (TODO exists)
2. Add `stale?` checks to export endpoints
3. Implement basic rate limiting
4. Enable SQL caching with `Measurement.cache`

## Pattern Matching Works
- Load `copilot_notes/INDEX-SEMANTIC-CO2.md` first
- "alert" → SMS implementation guides
- "export" → multi-format export plans with caching
- "rails-mcp" → server usage guide

## Next Tasks
Please help me:
1. **First**: Check INDEX-SEMANTIC-CO2.md to verify pattern matching
2. **Implement Quick Win**: Add Rails 7.1 normalizers to Measurement model
3. **Test Export Caching**: Add Rails.cache.fetch to exports
4. **Or**: Tell me which feature from the enhancement docs you'd like to implement

## Important Files
- `app/models/measurement.rb` - Has TODO for normalizers
- `copilot_notes/INDEX-SEMANTIC-CO2.md` - Pattern matcher
- `copilot_notes/2025-08-28-*.md` - Enhancement guides from session 03

## Tools Available
- Rails MCP server with working `load_guide`
- All standard Rails commands work (fixed in session 02)
- Pattern matching via INDEX for context management

## Code Patterns to Use
```ruby
# Normalizers (Rails 7.1)
normalizes :co2ppm, with: ->(co2) { co2.to_i.clamp(0, 80_000) }

# Export caching
Rails.cache.fetch("export/#{format}/#{digest}", expires_in: 1.hour) do
  generate_export(format, filters)
end

# Conditional GET
if stale?(last_modified: @export.updated_at, etag: @export.checksum)
  send_file @export.file_path
end

# Rate limiting
Rails.cache.increment("rate:#{user.id}", 1, expires_in: 1.hour)
```

The knowledgebase enhancements are complete. We're ready to implement the documented patterns. Which would you like to tackle first?