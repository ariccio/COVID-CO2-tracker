# 🚨 Rubocop Violation Quick Reference

## You Got: "ABC Complexity too high"
**STOP!** Before extracting methods, know these break often:
1. Early returns (`return render(...) if condition`)
2. Instance variables (`@user`, `@model`) 
3. Safe navigation (`&.`) chains
4. Exception flow

**Quick Fix Path:**
```bash
# 1. See what you're dealing with
bundle exec rubocop --display-style-guide -E [file]

# 2. Read the method carefully
# 3. Check: copilot_notes/REFACTOR_RISK_PATTERNS.md
# 4. Apply pattern from: rubocop-complexity-reduction-pattern.md
# 5. If >50 lines changed: Launch verification subagent
```

## You Got: "Method too long"
Similar to ABC but simpler - just extract logical chunks.
Still check REFACTOR_RISK_PATTERNS.md!

## You Got: "Class too long"
Consider extracting to service objects or modules.
See rails-architecture-deep-dive.md for patterns.

## Remember
After ANY refactoring:
- `git diff --stat` (sanity check size)
- `bundle exec rubocop [file]` (verify fixed)
- `rails runner "load '[file]'"` (syntax check)
- Consider verification subagent for big changes