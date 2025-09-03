# [Issue Name] Gotcha Documentation Template
Generated: [Date]

## ⚠️ Quick Reference - THE CRITICAL BITS
**NEVER**: [What not to do - be extremely specific]
**ALWAYS**: [What to do instead - be extremely specific]
**FILES AFFECTED**: [List exact file paths]
**ERROR YOU'LL SEE**: [Exact error message that appears]

## 🔍 How to Recognize This Issue
```ruby
# BAD - This will break:
[exact code that causes the problem]

# GOOD - This works:
[exact code that works correctly]
```

## 📊 Evidence This Is Real
```bash
# Git commits showing the pattern:
git log --grep="[relevant search]" --oneline

# Example output:
fe2cb9f Fix Time.zone issue in boot files
af910c7 Revert previous fix (broke again)
c176411 Applied incorrect fix
```

## 🧠 Why This Happens - Technical Explanation

### The Setup
[Explain the technical context - what runs when]

### The Problem
[Explain why the obvious fix doesn't work]

### The Rails/Ruby Specifics
[Any framework-specific details that matter]

## 🛡️ How to Prevent This

### 1. Configuration
```yaml
# Add to .rubocop.yml or similar:
[specific configuration to prevent the issue]
```

### 2. Testing
```bash
# Command to verify it's working:
[exact test command]

# Expected output:
[what you should see if it's working]
```

### 3. Pre-commit Hook
```bash
# Add to .git/hooks/pre-commit:
[shell script to catch the issue before commit]
```

## 📝 AI Agent Instructions to Add

### For .github/copilot-instructions.md
```markdown
[Exact text to add to instructions]
```

### For CLAUDE.md
```markdown
[Exact text to add to Claude-specific instructions]
```

## 🔄 Recovery Steps If It Happens Again

1. **Immediate fix**:
   ```bash
   [exact commands to fix the issue]
   ```

2. **Verify the fix**:
   ```bash
   [exact commands to verify it's fixed]
   ```

3. **Prevent recurrence**:
   - Add this file to the INDEX
   - Update AI instructions
   - Add test coverage

## 📚 Related Documentation
- [Link to related files]
- [Link to framework documentation]
- [Link to similar issues]

## 🏷️ Tags for Discovery
#gotcha #[framework] #[specific-area] #documented-pattern #ai-common-mistake

---
**Status**: [Active/Resolved/Monitoring]
**First Occurrence**: [Date]
**Last Occurrence**: [Date]
**Times This Pattern Repeated**: [Number]