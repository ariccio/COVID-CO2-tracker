# Refactoring Risk Patterns & Verification System
*Auto-loads on: extract method, reduce complexity, refactor, ABC metric, decompose, "too complex"*

## 🎯 Quick Mental Checklist
When refactoring, your brain should ask:
1. If this fails, does execution stop where it used to?
2. Am I evaluating the same thing multiple times now?
3. Can extracted methods see the variables they need?
4. Do errors still bubble up the same way?
5. Did I preserve every `&.` operator?

## 🔍 Pattern → Risk → Verification Triplets

### Early Return Extraction
```ruby
# BEFORE: return render(error) if invalid?
# AFTER:  return if check_invalid?
```
**RISK**: Parent continues when it shouldn't
**VERIFY**: Trace: "validation fails → helper returns true → parent returns → request stops"
**QUICK_FIX**: Helper must render AND return true; parent must check return value

### Safe Navigation Chains  
```ruby
# BEFORE: user&.profile&.settings&.timezone
# AFTER:  extract_user_timezone(user)
```
**RISK**: Missing `&.` in extraction causes NoMethodError
**VERIFY**: `git diff -U0 | grep -o '&\.' | wc -l` - count should match
**QUICK_FIX**: Copy-paste the chain exactly, then refactor

### Instance Variable Dependency
```ruby
# Uses @user, @current_tenant, @filters
```
**RISK**: NameError in extracted method
**VERIFY**: `ruby -c file.rb` catches this instantly
**QUICK_FIX**: Pass as parameters or ensure same scope

### Exception Flow Disruption
```ruby
# BEFORE: rescue StandardError => e; log(e); raise
# AFTER:  rescue StandardError => e; handle_error(e)
```
**RISK**: Exception swallowed or raised differently
**VERIFY**: "If this raises, who catches it?" for each path
**QUICK_FIX**: Preserve raise/return/render semantics exactly

### Query Multiplication (N+1)
```ruby
# Extracting: User.find(id).profile
```
**RISK**: Database hit every time vs once
**VERIFY**: Add `Rails.logger.debug("QUERY")` temporarily
**QUICK_FIX**: Cache in local variable before extracting

## 🤖 Fresh-Context Verification Protocol

### When to Launch Verification Subagent
**AUTOMATIC** (always do this):
- Refactoring controllers (request flow is critical)
- Touching authentication/authorization
- Changing exception handling
- 50+ lines changed or 5+ methods extracted

**SUGGESTED** (consider doing):
- Service objects with state
- Complex business logic
- Anything with `&.` chains

### Subagent Launch Template
```
Task: "Refactoring verification specialist"
Prompt: You are reviewing a refactoring with fresh eyes. The implementing agent may have blind spots.
Your job is to FIND PROBLEMS, not validate work.

Review this diff for:
1. Control flow changes (especially early returns)
2. Nil safety preservation (all &. operators)
3. Exception propagation changes
4. Variable accessibility
5. Query count changes

[INCLUDE: git diff of files]
[INCLUDE: original rubocop errors or requirements]

Report as:
✓ Safe: [definitely correct]
⚠️ Risk: [might break under conditions]
✗ Bug: [will break]
🤔 Unclear: [needs human review]
```

## 📊 Verification Confidence Scoring

Rate your refactoring confidence:
- **HIGH** (90%+): Simple extraction, no control flow changes
- **MEDIUM** (70-89%): Some control flow, but well-understood
- **LOW** (<70%): Complex flow, exceptions, or state changes
  
**If LOW confidence**: MUST launch verification subagent

## 🔗 Integration Points

This document is referenced by:
- `.rubocop.yml` - Comments on complexity cops
- `INDEX-SEMANTIC-CO2.md` - Loads for refactoring tasks
- `copilot-instructions.md` - Triggers on refactoring keywords

## 💡 Real Examples from This Codebase

### Success: device_controller.rb
- Extracted validation to `check_for_duplicate_user_device?`
- Correctly returns `true` to stop parent execution
- Pattern: Parent does `return if helper_method?`

### Success: base_service.rb  
- Extracted memory checking without changing fallback chain
- Preserved nil return to trigger next attempt
- Pattern: Sequential fallback preservation

### Trap Avoided: auth_controller.rb
- Nearly named method same as variable (`@decoded_token` vs `decoded_token`)
- Would have caused infinite recursion
- Pattern: Name extracted methods descriptively, not identically

## 🚀 Quick Verification Commands

```bash
# After refactoring, run these:
bundle exec rubocop [changed_files]        # Still clean?
git diff --stat                            # Reasonable size?
rails runner "load 'path/to/file.rb'"      # Syntax valid?
grep -n "return" [file] | wc -l           # Same number of returns?
```

## 📝 Notes for Other Repositories

To adapt this system:
1. Replace Rails-specific checks with your framework
2. Add your common patterns (promises? callbacks? decorators?)
3. Link from your linting config
4. Adjust confidence thresholds based on test coverage

Remember: This activates DURING refactoring, not before. It's a guardrail, not a gate.