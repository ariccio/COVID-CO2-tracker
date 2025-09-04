# RuboCop Quick Reference - Session Patterns

## 🎯 Essential Commands

### Discovery Commands
```bash
# See ALL remaining violations
bundle exec rubocop -E --raise-cop-error --display-style-guide

# Check specific cop
bundle exec rubocop -E --raise-cop-error --display-style-guide --only [CopName]

# Auto-correct safe cops
bundle exec rubocop -a --only [CopName] [file]

# Count violations by cop
bundle exec rubocop --format offenses
```

### Test Commands
```bash
# Quick test summary
bundle exec rspec --format progress 2>&1 | grep -E "(\d+) examples, (\d+) failures"

# Test specific file
bundle exec rspec [file] --format progress

# Full test suite
bundle exec rspec
```

## 🔧 Proven Fix Patterns

### Safe Bulk Operations
```bash
# Variable renaming (use with care)
sed -i '' 's/old_name/new_name/g' file1 file2 file3

# Finding all occurrences before changing
grep -r "pattern" app/ spec/ --include="*.rb"
```

### Method Rename Checklist
1. Find ALL occurrences: `grep -r "method_name" app/ spec/`
2. Check for symbol references in validations
3. Update method definition
4. Update all callers
5. Run tests immediately

### RuboCop Disable Template
```ruby
# rubocop:disable [CopName]
# EXPLANATION: Why this is necessary (e.g., framework limitation, performance requirement)
[code that needs exception]
# rubocop:enable [CopName]
```

## ⚠️ Danger Zones

### NEVER Touch These Patterns
```ruby
# In config/**/*.rb files:
Time.now          # ✅ CORRECT - Rails not initialized
Time.zone.now     # ❌ BREAKS - Time.zone doesn't exist yet

# In validations when renaming:
validates :field, if: :old_method?  # CHECK THESE!
```

### Always Test After
- Method renames
- Validation changes
- Service object modifications
- Anything in config/
- Removing "useless" assignments

## 📊 Violation Priority

### Quick Wins (Usually Safe)
- Layout/TrailingWhitespace
- Layout/SpaceInsideBlockBraces
- Layout/EmptyLines
- Style/StringLiterals
- Style/SymbolArray

### Need Care
- Naming/* (check for references)
- Lint/UselessAssignment (might be used later)
- Style/GuardClause (can change logic)
- Metrics/* (might need refactoring)

### Complex (Need Deep Understanding)
- Rails/TimeZone
- RSpec/AnyInstance (framework limitations)
- Security/* cops
- Performance/* cops

## 🎪 Useful Regex Patterns

```ruby
# Find method definitions
^\s*def\s+method_name

# Find symbol references in validations
validates.*:method_name

# Find method calls
\.method_name\(?\b

# Find instance variable assignments
@variable_name\s*=

# Find let! blocks in specs
let!\(:.*?\)\s+do
```

## 📈 Progress Tracking

### Todo List Template
```ruby
[
  { content: "Fix Layout violations", status: "pending" },
  { content: "Fix Style violations", status: "pending" },
  { content: "Fix Metrics violations", status: "pending" },
  { content: "Fix Rails violations", status: "pending" },
  { content: "Run final test suite", status: "pending" }
]
```

### Category Completion Checklist
- [ ] Run rubocop for specific category
- [ ] Fix violations one by one
- [ ] Run affected specs
- [ ] Verify with rubocop again
- [ ] Commit if requested
- [ ] Document any surprises

## 💡 Session Wisdom

### From Previous Sessions
- **Session 1**: Test noise isn't always bad (timestamps help debugging)
- **Session 2**: Method renames cascade through validations silently
- **Both**: Framework classes sometimes need allow_any_instance_of

### Efficiency Tips
1. Batch similar fixes when confident
2. Use auto-correct for Layout cops
3. Run focused tests first
4. Read context before fixing
5. Document patterns for next time

## 🤖 Self-Improvement Reminders

When you encounter:
- **Surprising behavior**: Document it immediately
- **Repeated pattern**: Create a reusable fix
- **Complex violation**: Understand before fixing
- **Test failure**: Check for cascade effects
- **New gotcha**: Add to gotcha list

Remember: Each session makes the next one better!