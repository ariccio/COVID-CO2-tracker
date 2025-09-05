# Cross-Language Refactoring Safety Patterns

## Key Risks by Language

### Ruby/Rails (COVID-CO2-tracker)
1. **Early Return Control Flow** - `return render(...) if condition`
2. **Instance Variable Access** - `@user`, `@model` in extracted methods
3. **Safe Navigation Chains** - `object&.association&.field`
4. **Exception Propagation** - rescue blocks changing behavior
5. **Database Query Multiplication** - N+1 from repeated evaluation

### Swift/iOS (DeeDee)
1. **Memory Management** - `[weak self]` vs `[strong self]` in closures
2. **Force Unwraps** - Moving `!` changes crash location
3. **Thread Safety** - `@MainActor` and async/await extraction
4. **SwiftUI State** - `@State/@StateObject` binding breaks
5. **Manager Decomposition** - 600+ line classes with shared state

### JavaScript/TypeScript (claude_code_reversing)
1. **This Binding** - `this` becomes undefined in extracted functions
2. **Promise/Async Flow** - Error propagation changes
3. **Closure Capture** - Extracted functions lose variable access  
4. **Module Boundaries** - Webpack/bundler assumptions break
5. **AST Context** - Visitor extraction loses traverse state

## Universal Patterns (All Languages)

### Pattern 1: Control Flow Preservation
- **Risk**: Extraction changes when/how code returns
- **Verify**: Trace execution path after extraction
- **Common in**: Early returns, guard clauses, validation

### Pattern 2: State Access
- **Risk**: Extracted code can't access needed variables
- **Verify**: All referenced variables still in scope
- **Common in**: Instance methods, closures, nested functions

### Pattern 3: Error Handling Changes
- **Risk**: Exceptions/errors handled differently after extraction
- **Verify**: Error propagation path unchanged
- **Common in**: Try/catch, rescue, error callbacks

### Pattern 4: Evaluation Timing/Order
- **Risk**: Code evaluated at different time or multiple times
- **Verify**: Side effects and performance unchanged
- **Common in**: Lazy evaluation, database queries, API calls

## Language-Specific Quick Checks

### Ruby
```bash
bundle exec rubocop [file]
rails runner "load '[file]'"
git diff | grep -c '&\.'
```

### Swift  
```bash
xcodebuild test
swiftlint analyze
git diff | grep -c "weak\|strong"
```

### JavaScript
```bash
npm test
npx eslint [file]
git diff | grep -c "this\\."
```

## When to Launch Verification Subagent

### Universal Triggers (Any Language)
- Changes >50 lines
- Extracting >5 methods
- Touching auth/security code
- Complex state management

### Language-Specific Triggers

**Ruby**: Controllers, service objects, ActiveRecord scopes

**Swift**: HealthKit, Core Data, SwiftUI views, async continuations  

**JavaScript**: Webpack configs, React hooks, Redux reducers, deobfuscation

## Subagent Prompt Template

```
You are a [LANGUAGE] refactoring verification specialist.

Review this diff with fresh eyes for:
1. [Language-specific risk 1]
2. [Language-specific risk 2]
3. [Language-specific risk 3]

The implementing agent may have blind spots.
Find problems, don't validate work.

[INSERT: git diff]

Report as: ✓ Safe | ⚠️ Risk | ✗ Bug
```

## Discovery Optimization

### Problem: Agents Find Patterns Too Late
Agents typically discover safety patterns AFTER hitting issues.

### Solution: Multiple Entry Points
1. **Linter Config Comments** - First place they look
2. **FIRST_RESPONSE Files** - Quick reference for violations
3. **Error Message Breadcrumbs** - Point to patterns
4. **Emotional Triggers** - "STOP! Common mistakes..."

### File Naming for Discovery
- `RUBOCOP_FIRST_RESPONSE.md` (Ruby)
- `SWIFTLINT_FIRST_RESPONSE.md` (Swift)
- `ESLINT_FIRST_RESPONSE.md` (JavaScript)

These names trigger pattern recognition better than generic names.

## Implementation Checklist

For each repository:
- [ ] Create language-specific REFACTOR_RISKS file
- [ ] Add linter config comments
- [ ] Create FIRST_RESPONSE file  
- [ ] Update main instructions with minimal hook
- [ ] Add to semantic index if exists
- [ ] Document real examples from codebase

## Evolution Through Use

Each repository's patterns should evolve based on:
1. **Near-misses** - Add new patterns
2. **False positives** - Remove unhelpful patterns  
3. **Actual bugs** - Emphasize critical patterns
4. **Success stories** - Document what worked

Remember: The goal is a **safety net**, not a **straightjacket**.
Patterns should enable confident refactoring, not paralyze it.