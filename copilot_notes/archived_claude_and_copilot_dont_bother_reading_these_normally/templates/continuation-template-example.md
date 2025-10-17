# 🚀 Continuation Prompt Template - Rails 7 Upgrade Example
*This demonstrates the continuation pattern for complex multi-session tasks*

## Context Preservation Point
**Created**: 2025-08-25 16:45 PST
**Task**: Upgrading COVID CO2 Tracker from Rails 6.x to Rails 7.x
**Session**: Reached 85% context capacity after completing 3 of 7 upgrade steps
**Tokens Used**: ~170,000 of 200,000

## Copy This EXACT Prompt to Continue:
---
I need to continue the Rails 7 upgrade for COVID CO2 Tracker that reached context limits. The previous session completed steps 1-3 and preserved full context.

**CRITICAL CONTEXT FILES TO READ FIRST**:
1. `copilot_notes/2025-08-25-rails7-upgrade-context-preservation.md` - Contains all decisions, conflicts resolved, and code changes
2. `copilot_notes/2025-08-25-rails7-upgrade-current-state.md` - Current migration status
3. `TECHNICAL-UPGRADE-GUIDE.md#rails-7-upgrade` - Original upgrade plan

**YOUR IMMEDIATE TASK**:
Continue from Step 4: Update ActiveAdmin compatibility

**COMPLETED SO FAR**:
✅ 1. Updated Gemfile to Rails 7.0.0
✅ 2. Ran rails app:update (kept our custom configs)
✅ 3. Fixed button_to breaking changes (17 files updated)
- All forms now use `form: { data: { turbo_confirm: }}` pattern
- Tests updated and passing

**REMAINING STEPS**:
⏳ 4. Update ActiveAdmin for Rails 7 compatibility
⏳ 5. Fix Zeitwerk autoloading issues
⏳ 6. Update ActiveRecord encryption config
⏳ 7. Run full test suite and fix failures

**SPECIFIC BLOCKERS DISCOVERED**:
- ActiveAdmin 2.9 has issue with Rails 7 importmap (needs 2.13+)
- Some model files have naming mismatches for Zeitwerk
- config/application.rb needs encryption keys added

**BRANCH**: `feature/rails-7-upgrade`
**LAST COMMIT**: `a7c9d3f2 - Fix button_to deprecations`

**PROVEN SOLUTIONS FROM SESSION**:
```ruby
# This pattern worked for all button_to fixes:
# Before: 
button_to "Delete", path, method: :delete

# After:
button_to "Delete", path, method: :delete, 
  form: { data: { turbo_confirm: "Are you sure?" } }
```

**TEST COMMAND**: `bundle exec rspec --fail-fast`
**CURRENT STATUS**: 127 examples, 3 failures (all ActiveAdmin related)

Please start by running `git status` to see current state, then continue with Step 4.
---

## 🧠 Context for AI Continuing This Task

### Why This Matters
Rails 7 brings significant performance improvements and security updates critical for a public health app. The upgrade blocks several dependency updates that patch CVEs.

### Key Decisions Already Made
1. **Keeping Rails 6 behavior for now**: Set `config.load_defaults 6.1` to minimize breaking changes
2. **Not using import maps yet**: Keeping Webpacker until separate migration
3. **Database changes deferred**: PostgreSQL 15 upgrade will be separate task

### Gotchas Discovered
1. **ActiveAdmin incompatibility**: Must upgrade to 2.13+ (not just 2.9)
2. **Spring conflicts**: Had to `spring stop` multiple times
3. **Turbo default behaviors**: Disabled Turbo for now with `data-turbo="false"`

### Testing Strategy
1. Run targeted specs after each change: `rspec spec/models` etc
2. Check admin panel manually after ActiveAdmin updates
3. Verify API endpoints with: `curl localhost:3000/api/v1/measurements`
4. Mobile app testing can wait until after Rails upgrade

### Files Modified So Far
```bash
# Track with: git diff --name-only main..feature/rails-7-upgrade
Gemfile
Gemfile.lock
config/application.rb
config/environments/development.rb
config/environments/test.rb
config/environments/production.rb
app/views/admin/measurements/_form.html.erb
app/views/admin/places/_form.html.erb
# ... 15 more view files with button_to
```

### Next Session Setup Commands
```bash
# Quick environment verification
bundle install
rails db:migrate:status
spring stop
bundle exec rspec --fail-fast
```

### Success Criteria for Continuation
- [ ] All tests passing (including ActiveAdmin)
- [ ] Admin panel loads without errors
- [ ] API endpoints responding normally
- [ ] No deprecation warnings in logs
- [ ] Mobile app can still connect

### Emergency Rollback Plan
```bash
git checkout main
git branch -D feature/rails-7-upgrade
# Start over with more careful approach
```

---

## 📚 Pattern Explanation

This continuation template demonstrates:
1. **State Preservation**: Exact status of partially completed task
2. **Context Loading**: Specific files to read first
3. **Clear Next Steps**: Exactly where to resume
4. **Discovered Knowledge**: Solutions and gotchas found
5. **Recovery Commands**: How to verify and continue
6. **Success Criteria**: How to know when done

## 🎯 Creating Your Own Continuation Prompts

When approaching context limits:
1. **Save State** (10 minutes before limit):
   - Current task progress (numbered steps)
   - Decisions made and reasoning
   - Code changes and their purposes
   - Discovered issues and solutions

2. **Create Guide Files**:
   ```bash
   # Context preservation file
   copilot_notes/[date]-[task]-context-preservation.md
   
   # Current state file  
   copilot_notes/[date]-[task]-current-state.md
   
   # Continuation prompt
   copilot_notes/[date]-[task]-continuation.md
   ```

3. **Include in Prompt**:
   - Exact task description
   - Files to read first (with purpose)
   - Completed work (checkbox list)
   - Remaining work (checkbox list)
   - Specific blockers found
   - Branch and commit info
   - Test commands
   - Success criteria

4. **Make It Copy-Pasteable**:
   - Self-contained prompt
   - No references to "previous conversation"
   - Include all necessary context
   - Clear starting action

## 🔄 Usage Pattern

1. **Approaching Limit** (80% context):
   - AI creates continuation files
   - AI generates continuation prompt
   - AI completes what's possible

2. **New Session**:
   - User copies continuation prompt
   - Pastes as first message
   - AI reads context files
   - AI continues seamlessly

3. **Multiple Continuations**:
   - Number each continuation
   - Chain them together
   - Maintain momentum

---
*This template based on DeeDee-Prototype continuation patterns, adapted for COVID CO2 Tracker*