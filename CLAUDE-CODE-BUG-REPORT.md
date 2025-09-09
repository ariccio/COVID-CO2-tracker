# Claude Code Critical Bug Report: Template Literal Crash

## Executive Summary
Claude Code crashes with "Bad substitution" error when processing JavaScript/TypeScript template literals containing optional chaining within bash heredocs.

## Severity: CRITICAL
- Causes immediate crash of Claude Code
- Data loss potential (unsaved work)
- No workaround within Claude Code itself
- Affects legitimate TypeScript/JavaScript code patterns

## Environment
- **Claude Code Version**: @anthropic-ai/claude-code (npm global install)
- **Node Version**: v20.19.4
- **Platform**: macOS (darwin)
- **Installation Path**: `/Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/`
- **Date Discovered**: 2025-09-09

## Reproduction Rate: 100%

## Minimal Reproducible Example

### The Crash Command
```bash
cat > /tmp/debug-detect.ts << 'EOF'
const text = "This has an emoji in text 📝";

console.log("Text length:", text.length);
console.log("Checking each character:");

let index = 0;
for (const char of text) {
  const codePoint = char.codePointAt(0);
  console.log(`Index ${index}: '${char}' codepoint: ${codePoint?.toString(16) || 'undefined'}`);
  index++;
}
EOF

npx ts-node /tmp/debug-detect.ts
```

### To Reproduce via CLI
Save this to a file and run: `claude --print < file.txt`
```
Please execute this exact Bash command using the Bash tool:
cat > /tmp/debug.ts << 'EOF'
const codePoint = 65;
console.log(`Code: ${codePoint?.toString(16)}`);
EOF
```

## Error Output
```
Error: Bad substitution: codePoint?.toString
    at D (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:80:79195)
    at file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:80:79854
    at Array.map (<anonymous>)
    at VX9 (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:80:78933)
    at Object.A (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:80:80018)
    at nv6 (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:1741:31727)
    at ov6 (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:1741:35696)
    at file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:1741:36245
    at Array.every (<anonymous>)
    at $2B (file:///Users/alexanderriccio/.nvm/versions/node/v20.19.4/lib/node_modules/@anthropic-ai/claude-code/cli.js:1741:36183)

Node.js v20.19.4
Exit status: 1
```

## Root Cause Analysis

### The Problem Pattern
The crash occurs when ALL of these conditions are met:
1. Bash heredoc syntax (`<< 'EOF'`)
2. JavaScript/TypeScript template literal (backticks)
3. Optional chaining (`?.`) inside the template literal
4. Method call after optional chaining (e.g., `toString()`)

### Specific Trigger
The pattern `${variable?.method()}` inside a template literal within a heredoc

### Why It Crashes
Claude Code's parser appears to misinterpret JavaScript template literal syntax as bash variable substitution when it encounters the `?.` operator inside `${}`. The error "Bad substitution" is typically a bash error, suggesting the parser is applying bash parsing rules to JavaScript code.

## Impact Analysis

### Affected Use Cases
- TypeScript/JavaScript development with modern syntax
- Node.js script creation
- React/Vue/Angular component generation
- Any code using optional chaining in template literals

### Business Impact
- Developer productivity loss
- Inability to use Claude Code for modern JavaScript patterns
- Forced to use older syntax patterns as workaround

## Successful Workarounds

### Workaround 1: Avoid Optional Chaining in Template Literals
```javascript
// Instead of: `${value?.toString()}`
const result = value?.toString();
console.log(`Value: ${result}`);
```

### Workaround 2: Use Traditional Null Checks
```javascript
// Instead of: `${value?.toString()}`
console.log(`Value: ${value ? value.toString() : 'undefined'}`);
```

### Workaround 3: Use String Concatenation
```javascript
// Instead of: `${value?.toString()}`
console.log("Value: " + (value?.toString() || "undefined"));
```

## Test Cases for Verification

### Should Work (No Crash)
```bash
# Test 1: Template literal without optional chaining
cat > /tmp/test1.ts << 'EOF'
const value = 42;
console.log(`Value: ${value.toString()}`);
EOF

# Test 2: Optional chaining outside template literal
cat > /tmp/test2.ts << 'EOF'
const value = 42;
const str = value?.toString();
console.log(`Value: ${str}`);
EOF

# Test 3: No template literal
cat > /tmp/test3.ts << 'EOF'
const value = 42;
console.log("Value: " + value?.toString());
EOF
```

### Currently Crashes
```bash
# The problematic pattern
cat > /tmp/crash.ts << 'EOF'
const value = 42;
console.log(`Value: ${value?.toString()}`);
EOF
```

## Debugging Information Collected

### Debug Flags Used
- `--verbose`: Provided detailed execution flow
- `--debug`: Showed internal operations
- `--output-format stream-json`: Captured streaming output
- `--include-partial-messages`: Showed incremental processing

### Key Debug Output Before Crash
```json
{"type":"assistant","message":{"id":"msg_01KsikAvZf51aFvm1ErGmSkx","content":[{"type":"tool_use","id":"toolu_019Ccnv8RaY9cQbZGN6qgfiN","name":"Bash","input":{"command":"cat > /tmp/debug-detect.ts << 'EOF'[...]${codePoint?.toString(16)[...]"}}]}}
```

The tool call was successfully generated but crashed during execution.

## Recommended Fix

### Short-term
1. Add input validation to detect this pattern before processing
2. Escape or quote the problematic syntax before bash interpretation
3. Add error recovery to prevent full crash

### Long-term
1. Properly separate bash parsing from embedded language content
2. Recognize quoted heredocs (`<< 'EOF'`) should not have variable substitution
3. Add language-aware parsing for common file extensions (.js, .ts, etc.)

## Additional Notes

1. The issue is consistent across multiple invocation methods (interactive and CLI)
2. The quoted heredoc delimiter ('EOF') should prevent variable substitution but doesn't
3. This affects a common modern JavaScript pattern (optional chaining)
4. The minified code in cli.js makes debugging difficult

## Contact Information
Reported by: Alexander Riccio
GitHub Issue: [To be filed]
Discovery Date: 2025-09-09

## Attachments
- `claude-code-crash-debug.md` - Initial debugging session
- `claude-crash-trigger-prompt.txt` - Minimal prompt to reproduce
- `claude-crash-output.log` - Full debug output (if needed)