# Implementing Refactoring Safety in Other Repositories

## Quick Setup (5 minutes)

### 1. Create the Risk Patterns File
Copy `REFACTOR_RISK_PATTERNS.md` to `copilot_notes/` (or `.github/copilot/` or `docs/ai/`)

### 2. Adapt to Your Language/Framework

#### For JavaScript/TypeScript:
```markdown
### Async/Promise Chain Extraction
PATTERN: Extracting .then() chains or async/await
RISK: Promise rejection handling changes
VERIFY: Does catch() still work the same?

### Optional Chaining Extraction  
PATTERN: user?.profile?.settings
RISK: Missing ?. causes "Cannot read property of undefined"
VERIFY: Count the ?. operators before/after
```

#### For Python:
```markdown
### Context Manager Extraction
PATTERN: with open() as f: 
RISK: File handle closes prematurely
VERIFY: Is file still open when needed?

### List Comprehension Extraction
PATTERN: [x for x in items if complex_check(x)]
RISK: Evaluation order or side effects change
VERIFY: Print length before/after
```

#### For Go:
```markdown
### Error Return Extraction
PATTERN: if err != nil { return nil, err }
RISK: Error not propagated correctly
VERIFY: Trace error path up to handler

### Defer Statement Extraction
PATTERN: defer cleanup()
RISK: Deferred function runs at wrong time
VERIFY: When does cleanup actually run now?
```

### 3. Add Minimal Hooks

#### In Your Main Instructions File:
```markdown
### Refactoring Safety
When fixing complexity issues, recall patterns from REFACTOR_RISK_PATTERNS.md
For major refactoring (50+ lines), consider verification subagent
```

#### In Your Linter Config:
```yaml
# .eslintrc, pylintrc, etc.
# When fixing: see REFACTOR_RISK_PATTERNS.md
```

### 4. Create Language-Specific Quick Checks

#### JavaScript:
```bash
npm test -- --coverage  # Coverage shouldn't drop
grep -c "return" file.js # Return count stable?
grep -c "?\\." file.ts  # Optional chains preserved?
```

#### Python:
```bash
python -m py_compile file.py  # Syntax check
grep -c "return\|yield" file.py # Returns stable?
mypy file.py --strict  # Type check still passes?
```

#### Go:
```bash
go vet ./...  # Static analysis
grep -c "return.*err" file.go # Error returns stable?
```

## Framework-Specific Adaptations

### React/Vue/Angular:
- Focus on hook/lifecycle extraction
- State management refactoring
- Event handler extraction

### Django/Rails/Laravel:
- Request flow preservation
- Middleware extraction
- Database query optimization

### Express/FastAPI/Gin:
- Middleware chain preservation  
- Error handler extraction
- Route handler decomposition

## Key Principles to Preserve

1. **Pattern-Triggered**: Activates during work, not before
2. **Risk-Focused**: "What breaks" not "how to do it"
3. **Fresh Context**: Subagent for complex changes
4. **Quick Checks**: Simple commands to verify
5. **Real Examples**: From actual refactoring in your codebase

## Measuring Success

After implementing, track:
- Bugs introduced during refactoring (should decrease)
- Time spent on refactoring (should stay same or decrease)
- Confidence in refactoring (should increase)

## Common Adaptations by Language

### Strongly Typed Languages (Java, C#, Rust):
- Compiler catches more issues
- Focus on logic flow changes
- Less worried about nil/null (compiler helps)

### Dynamic Languages (Python, Ruby, JS):
- Runtime issues more common
- Focus on type preservation
- More attention to nil/undefined

### Functional Languages (Haskell, Clojure, Elixir):
- Focus on composition changes
- Pipe operator preservation
- Side effect isolation

## Integration with AI Agents

### For Copilot:
Add to `.github/copilot-instructions.md`

### For Cursor:
Add to `.cursor/instructions.md`

### For Claude Code:
Add to `CLAUDE.md` or `.claude/instructions.md`

### For Custom Agents:
Include in system prompt or tool descriptions

## Anti-Patterns to Avoid

❌ Don't make it a mandatory checklist
❌ Don't add too many patterns (10-15 max)
❌ Don't make it language-agnostic (be specific!)
❌ Don't forget to update with real failures
❌ Don't make quick checks take >5 seconds

## Sample Verification Subagent Prompt

```
You are a [LANGUAGE] refactoring specialist reviewing changes.
Focus areas for [LANGUAGE]:
- [Key risk 1 for this language]
- [Key risk 2 for this language]
- [Key risk 3 for this language]

Review this diff with fresh eyes:
[git diff]

Report issues as: ✓ Safe, ⚠️ Risk, ✗ Bug
```

## Living Document

This system improves through use:
1. Each near-miss becomes a new pattern
2. Each false positive removes a pattern
3. Adjust confidence thresholds based on results
4. Add framework-specific patterns as discovered

Remember: The goal is a **safety net**, not a **straightjacket**.