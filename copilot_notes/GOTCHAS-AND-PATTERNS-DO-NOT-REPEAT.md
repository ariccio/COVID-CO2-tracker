# Critical Gotchas and Patterns - DO NOT REPEAT THESE MISTAKES

## 🚨 MOST CRITICAL - Time.zone Usage

### The Pattern That Keeps Breaking
**NEVER change `Time.now` to `Time.zone.now` in:**
- `config/boot.rb`
- `config/application.rb`
- `config/environment.rb`
- `config/environments/*.rb`

### Why This Breaks
```ruby
# Execution order during Rails startup:
1. config/boot.rb          # Rails NOT loaded, Time.zone does NOT exist
2. config/application.rb    # Rails NOT loaded, Time.zone does NOT exist  
3. Rails framework loads    # NOW Time.zone becomes available
4. config/environments/*.rb # Time.zone MAY be available (depends on section)
```

### The Error You'll See
```
NoMethodError: undefined method `zone' for Time:Class
```

### Evidence of Repeated Failures
```bash
# Git history shows this ping-pong pattern:
Sep 2, 22:51: Time.now → Time.zone.now (commit c176411 - BROKE APP)
Sep 3, 00:41: Time.zone.now → Time.now (commit fe2cb9f - FIXED APP)
Sep 3, 00:56: Time.now → Time.zone.now (commit af910c7 - BROKE APP AGAIN)
```

### The Correct Code
```ruby
# In config/boot.rb, config/application.rb, etc:
BOOTUP_START = Time.now  # CORRECT - Time.zone not available yet

# In regular application code (models, controllers, etc):
created_at = Time.zone.now  # CORRECT - Rails is fully loaded
```

## 📋 Rubocop Configuration - Exclusions Exist for Good Reasons

### Current Exclusions (DO NOT OVERRIDE)
From `.rubocop.yml` lines 54-59:
```yaml
Rails/TimeZone:
  Exclude:
    - 'config/boot.rb'
    - 'config/application.rb'
    - 'config/environments/*.rb'
  # These files run before Rails is initialized, so Time.zone is not available
```

### Why AI Sessions Keep Getting This Wrong
1. See `Time.now` and think "Rails best practice says use Time.zone.now"
2. Don't understand these files run BEFORE Rails initializes
3. Trust Rubocop auto-correct without understanding context
4. Previous session's failure not remembered by next session

## 🔍 General Patterns to Watch For

### Pattern 1: Framework Features in Initialization
**Issue**: Using framework-specific features before framework loads
**Examples**:
- `Rails.logger` before Rails initializes
- `Rails.env` in early boot files
- `ActiveSupport` methods before it's loaded

**How to Check**: 
```bash
rails runner "puts 'If this works, your changes are probably OK'"
```

### Pattern 2: Linter "Fixes" That Break Things
**Issue**: Automated tools don't understand runtime context
**Red Flags**:
- Suggestions for files in `config/` directory
- "Modernizing" code in bootstrap/initialization files
- Auto-corrections that change fundamental behavior

**Before Accepting ANY Linter Suggestion**:
1. Check if file runs during initialization
2. Verify the suggested feature is available at that point
3. Test that application still starts

### Pattern 3: Different Approaches in Different Files
**Issue**: Same problem solved differently based on context
**Example**: 
- `Time.now` in config files (correct - before Rails loads)
- `Time.zone.now` in app code (correct - after Rails loads)
- `DateTime.now` in scripts (correct - standalone execution)

**This is NOT inconsistency - it's context-appropriate code!**

## 🧪 Testing Protocol for Configuration Changes

### Mandatory Tests After ANY config/ Changes
```bash
# 1. Application starts without errors
rails runner "puts 'Rails started successfully'"

# 2. Console loads
rails console -e development <<EOF
puts "Console loaded"
exit
EOF

# 3. Server starts (if possible in environment)
timeout 5 rails server || echo "Server started OK"

# 4. No new deprecation warnings
rails runner "puts ActiveSupport::Deprecation.warn('test')" 2>&1 | grep -v "test"
```

### If ANY Test Fails
1. **IMMEDIATELY revert your changes**
2. Document what you tried in copilot_notes/
3. Research why it failed before trying again

## 📝 How to Document When You Find New Gotchas

### Template for New Gotcha Documentation
```markdown
# [Pattern Name] - Gotcha Discovered [Date]

## The Mistake
What change was attempted that seemed correct but broke things.

## The Error
Exact error message or behavior observed.

## The Reason
Technical explanation of WHY this happens.

## The Solution
What to do instead (or what to leave alone).

## How to Verify
Command or test to ensure it's working correctly.

## Prevention
What to add to instructions to prevent recurrence.
```

## 🎯 Quick Decision Tree

```
Found code that looks "wrong"?
├── Is it in config/ or initialization file?
│   ├── YES → STOP! Check if framework features are available there
│   └── NO → Continue evaluation
├── Does git history show it's been changed before?
│   ├── YES → Read why it was reverted
│   └── NO → Continue evaluation  
├── Is there a linter exclusion for it?
│   ├── YES → Read the comment explaining why
│   └── NO → Continue evaluation
├── Can you test the change locally?
│   ├── NO → DO NOT MAKE THE CHANGE
│   └── YES → Test thoroughly including startup
└── Document your decision either way
```

## 🚦 Status Indicators in Code Comments

When you add comments explaining gotchas, use these prefixes:
- `# CRITICAL:` - Will break application if changed
- `# WARNING:` - Will cause errors but not total failure
- `# NOTE:` - Important context but won't break if ignored
- `# TODO:` - Can be improved when [specific condition]

Example:
```ruby
# CRITICAL: Must use Time.now here - Time.zone not available during boot
# WARNING: Changing to Time.zone.now will cause NoMethodError on startup
# NOTE: This runs before Rails framework initializes
# TODO: Could use Time.zone.now after Rails 8.0 changes initialization order
```

## 📚 References
- Full analysis: `copilot_notes/time-zone-ping-pong-analysis.md`
- Session patterns: `copilot_notes/ai-session-pattern-analysis.md`
- Universal learnings: `copilot_notes/UNIVERSAL-INSTRUCTION-IMPROVEMENTS-PROMPT.md`

---
**Remember**: Every gotcha documented here represents hours of debugging that future sessions won't have to repeat. Keep this file updated!