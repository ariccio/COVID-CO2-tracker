# Rails Pattern Detection Protocol
## Identifying and Preventing Subtle Rails Anti-Patterns

**Tier**: 2 (Focused Guide)
**Word Count**: ~1000 words
**When to Load**: Tasks involving "refactor|linter|suspicious|pattern detection|initialization|framework|bootstrap|config"
**Purpose**: Prevents ping-pong debugging cycles by teaching AI to recognize when "obvious fixes" are actually dangerous

---

## Overview

This protocol emerged from painful lessons learned in COVID-CO2-tracker development. Rails (and frameworks generally) have **initialization order gotchas** where "correct" runtime code is **incorrect** during bootstrap. Linters and static analyzers **don't understand execution context**, leading to well-intentioned "fixes" that break the app.

**Key Insight**: If code looks "wrong" but works, **assume it's intentional until proven otherwise**. The burden of proof is on the fixer, not the original author.

---

## Suspicious Pattern Recognition

### Core Principle

**STOP and investigate when you see**:

1. **"Old style" code in configuration/initialization files**
   - It might be necessary for bootstrap
   - Example: Using `Time.now` instead of `Time.zone.now` in `config/boot.rb` (because `Time.zone` isn't available yet)

2. **Linter suggestions for files that run during startup**
   - Tools don't understand initialization order
   - Example: Rubocop suggesting `Rails.logger` in an initializer that runs before logging is configured

3. **Code that "should" use a framework feature but doesn't**
   - Ask WHY it doesn't
   - Example: Direct `ENV` access instead of `Rails.application.credentials` in early boot files

4. **Multiple approaches to the same problem in different files**
   - Understand the context differences
   - Example: Some files use `require_relative`, others use `require` - different load contexts

5. **Exclusions in linter configs without explanations**
   - Add the "why" before proceeding
   - Example: `.rubocop.yml` excludes `config/boot.rb` - document why

### Real-World Example from COVID-CO2-tracker

**The Time.zone Ping-Pong** (see `copilot_notes/time-zone-ping-pong-analysis.md`):

```ruby
# config/initializers/some_initializer.rb

# LOOKS WRONG (Rubocop complains):
Rails.application.config.time_zone = 'UTC'

# "FIXED" VERSION (breaks app):
Time.zone = 'UTC'  # ✗ Time.zone not available during initializer phase
```

**Why it looked wrong**: Rubocop prefers `Time.zone` over `Rails.application.config.time_zone`

**Why the "fix" broke**: Initializers run **before** `Time.zone` is fully configured

**Lesson**: Config files often set up the features that "better" patterns depend on

---

## Before "Fixing" Anything That Looks Wrong

### Mandatory Investigation Steps

**1. Check history**: `git log -p -S "[code-pattern]" --all`
   - Has this been changed and reverted?
   - Example: If `Time.now` was changed to `Time.zone.now` and reverted, there's probably a reason

**2. Look for comments** (even in git history)
   - Someone might have explained why
   - Example: `# Using Time.now here because Time.zone not available yet`

**3. Test current behavior**
   - Does it actually work as-is?
   - **Don't fix what isn't broken**
   - Run: `rails runner "puts 'Rails started successfully'"`

**4. Understand the context: WHEN does this code run?**
   - **Boot time** (config/boot.rb, config/application.rb)
   - **Initializer phase** (config/initializers/)
   - **Runtime** (models, controllers, services)

   Are all features available then?

**5. Document your reasoning**
   - If you change it, explain WHY for future sessions
   - Add comments in code and create a `copilot_notes/[issue]-gotcha.md` file

### Example Investigation

```bash
# 1. Check history for Time.zone changes
git log -p -S "Time.zone" --all | head -100

# 2. Look for related issues
ls copilot_notes/*time*zone*.md
ls copilot_notes/*ping*pong*.md

# 3. Test current behavior
rails runner "puts 'Rails loads successfully'"
rails runner "puts Time.zone.now"

# 4. Check when code runs
grep -r "Time.zone" config/
# ^ If in config/, be VERY careful

# 5. Document if changing
echo "Changed Time.now to Time.zone.now in models/place.rb because it's runtime code, not boot code. Verified with tests." > copilot_notes/2025-10-17-time-zone-fix-place-model.md
```

---

## Framework Initialization Awareness

### Critical Understanding for ANY Framework

**Lifecycle Phases** (Rails-specific, but pattern applies broadly):

1. **Gem loading** (`config/boot.rb`)
   - Rails gems not fully loaded yet
   - Only stdlib and bundler available
   - Use: Basic Ruby, `require_relative`, `ENV`

2. **Application configuration** (`config/application.rb`)
   - Rails classes loading
   - Many features still configuring
   - Use: `Rails.application.config.x`, direct `ENV`

3. **Initializer phase** (`config/initializers/`)
   - Framework mostly loaded, but still initializing
   - Some features not ready yet
   - Use: Framework config methods, avoid assuming everything works

4. **Runtime** (models, controllers, services)
   - Everything available
   - Use: All Rails features, `Time.zone`, `Rails.logger`, `Rails.cache`, etc.

### Red Flags Requiring Extra Caution

**File names that signal early lifecycle**:
- `boot`, `bootstrap`, `init`, `startup`, `config`, `setup`

**Early lifecycle hooks**:
- `before_configuration`
- `initializers` directory
- `pre_init`, `on_load`

**Rule of thumb**: The earlier in the lifecycle, the fewer features are available.

### Rails-Specific Gotchas

**Time.zone in config files**:
```ruby
# config/initializers/time_formats.rb

# WRONG (Time.zone not ready yet):
Time.zone = 'UTC'

# CORRECT (configures Time.zone for later use):
Rails.application.config.time_zone = 'UTC'
```

**Rails.logger in initializers**:
```ruby
# config/initializers/some_setup.rb

# WRONG (logger not ready):
Rails.logger.info("Setting up feature")

# CORRECT (use puts or logger might not exist yet):
puts "Setting up feature" if Rails.env.development?
```

**Database access in initializers**:
```ruby
# config/initializers/load_settings.rb

# WRONG (database not connected yet):
Setting.find_by(key: 'app_version')

# CORRECT (defer to runtime):
Rails.application.config.to_prepare do
  # This runs after database is connected
  AppVersion = Setting.find_by(key: 'app_version')&.value
end
```

---

## When Linters/Analyzers Suggest Changes

### The 5 Critical Questions

**ALWAYS ask**:

1. **Does this tool understand the execution context?**
   - Linters see syntax, not semantics
   - They don't know if code runs at boot or runtime

2. **Is this a compile-time vs runtime issue?**
   - Ruby doesn't compile, but has load-time vs run-time
   - Load-time errors are harder to debug

3. **Are there initialization order dependencies?**
   - Does this code set up something that later code depends on?
   - Changing order can break cascading dependencies

4. **Why was it written the "wrong" way originally?**
   - Assume the original author had a reason
   - They might have hit the gotcha you're about to hit

5. **Has this "fix" been attempted before?**
   - Check: `git log --grep="fix.*[pattern]"`
   - If it was reverted, you're about to make the same mistake

### Rubocop-Specific Guidance

**When Rubocop suggests a change in config/ or initializers/**:

```bash
# Check if file is excluded in .rubocop.yml
grep -A 5 "Exclude:" .rubocop.yml | grep -i "config"

# If excluded, there's usually a reason
# If not excluded, check git history before applying fix
```

**Common Rubocop false positives in Rails**:

| Cop | False Positive Context | Why It's Wrong |
|-----|------------------------|----------------|
| `Rails/TimeZone` | config/initializers/ | Time.zone not ready yet |
| `Rails/Output` | config/ early files | Rails.logger not ready yet |
| `Style/GlobalVars` | config/boot.rb | Sometimes necessary for boot |
| `Metrics/AbcComplexity` | Initialization code | Complex setup is sometimes unavoidable |

---

## Refactoring Safety Protocol

### When Fixing Complexity Issues

**Context**: Rubocop reports high ABC metrics, long methods, etc.

**Trigger pattern-matching awareness**:
- Check for `copilot_notes/REFACTOR_RISK_PATTERNS.md`
- If file doesn't exist, create it based on this protocol

**For substantial refactoring** (50+ lines OR 5+ new methods):
1. **Launch a verification subagent with fresh context**
2. **Critical for**: controllers, authentication, authorization, exception handling
3. **Subagent should review**: ONLY the diff + requirements (avoiding your implementation assumptions)

**Example**:
```markdown
# In subagent prompt:
"Review this diff for a refactoring of ExportsController#create. Original method was 87 lines.
Refactored into 5 module methods with explicit parameters. Verify:
- No silent failures introduced
- Errors still bubble up correctly
- No N+1 queries added
- Test coverage maintained
- Authorization checks preserved

Do NOT review the implementation details - review the diff against requirements."
```

---

## Cross-Session Learning Protocol

### Before Starting Work

**Check for previous attempts and learnings**:

```bash
# Look for analysis files
ls -la copilot_notes/*analysis*.md copilot_notes/*gotcha*.md

# Check recent reverts
git log --oneline -30 | grep -iE "revert|broke|fix"

# Search for pattern changes
git log -p --reverse -S "[suspicious-pattern]" | head -100
```

**Check for anti-patterns**:
- Look for `RAILS_ANTI_PATTERNS.md` for what NOT to do
- Review `copilot_notes/*ping-pong*.md` for issues that repeatedly occur
- Scan git history for repeated reverts of the same "fix"

### When Something Surprising Happens

**Create permanent knowledge**:

1. **Create**: `copilot_notes/[date]-[specific-issue]-gotcha.md`
   ```markdown
   # 2025-10-17: Time.zone in Initializers Gotcha

   ## What I Tried
   Changed `Rails.application.config.time_zone = 'UTC'` to `Time.zone = 'UTC'` in config/initializers/

   ## Why It Failed
   Time.zone not available during initializer phase. Got error: `NoMethodError: undefined method 'zone' for Time:Class`

   ## Root Cause
   Initializers run before Rails fully configures ActiveSupport::TimeZone

   ## Solution
   Use Rails.application.config.time_zone in config files, Time.zone everywhere else
   ```

2. **Document**: What you tried, why it failed, what the root cause was

3. **Update**: This instructions file or create a specialized protocol if it's a recurring pattern

---

## Verification Requirements

### For ANY Configuration or Initialization Changes

**Mandatory tests**:

1. **App starts**: `rails runner "puts 'Started successfully'"`
2. **Core features work**: Test at least one core feature (e.g., export endpoint)
3. **No new warnings**: Check logs for new errors/warnings
4. **Performance unchanged**: If startup time matters, measure it with `time rails runner "puts 'done'"`

### If You Cannot Test

**DO NOT make changes to**:
- Initialization or bootstrap code
- Configuration files
- Anything that affects application startup
- Core framework integration points

**Instead**: Create a branch, document the proposed change, and ask the user to test.

---

## Integration with Other Protocols

This protocol works with:
- **rails-specific-patterns.md**: Detailed Rails idioms (load after this file)
- **CLAUDE.md #rails-critical**: Quick pre-work checklist
- **copilot_notes/time-zone-ping-pong-analysis.md**: Specific gotcha example

**Decision tree**:
1. See suspicious pattern → Load this file
2. Need Rails idioms → Load rails-specific-patterns.md
3. Starting Rails task → Check CLAUDE.md #rails-critical
4. Investigating time zone issue → Load time-zone-ping-pong-analysis.md

---

## Summary

**Core Principle**: **Don't fix what isn't broken**. If code looks wrong but works, investigate before changing.

**Key Takeaways**:
- Linters don't understand execution context
- Config files run before features they configure
- Check git history before "fixing" patterns
- Document surprises for future sessions
- Verify changes with `rails runner` tests

**When to load this file**: Anytime you're tempted to "fix" code that looks wrong, or when refactoring complex Rails code.
