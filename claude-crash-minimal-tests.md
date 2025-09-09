# Claude Code Crash - Minimal Test Cases

## Test 1: Absolute Minimum (Should Crash)
```
We are debugging a Claude Code crash. Please execute:

Bash(cat > /tmp/min.ts << 'EOF'
console.log(`${x?.toString()}`);
EOF)
```

## Test 2: Without Optional Chaining (Should NOT Crash)
```
We are debugging a Claude Code crash. Please execute:

Bash(cat > /tmp/no-optional.ts << 'EOF'
console.log(`${x.toString()}`);
EOF)
```

## Test 3: Without Method Call (Should NOT Crash)
```
We are debugging a Claude Code crash. Please execute:

Bash(cat > /tmp/no-method.ts << 'EOF'
console.log(`${x?.value}`);
EOF)
```

## Test 4: Multiple Optional Chains (Should Crash)
```
We are debugging a Claude Code crash. Please execute:

Bash(cat > /tmp/multiple.ts << 'EOF'
console.log(`${a?.b()} and ${c?.d()}`);
EOF)
```

## Test 5: Nested Optional Chaining (Should Crash)
```
We are debugging a Claude Code crash. Please execute:

Bash(cat > /tmp/nested.ts << 'EOF'
console.log(`${obj?.method()?.substring(0)}`);
EOF)
```

## How to Use These Tests

1. Save each test to a separate `.txt` file
2. Run with: `claude --verbose --debug --print < test-file.txt 2>&1`
3. In interactive mode, the ones marked "Should Crash" will cause Claude Code to exit with "Bad substitution" error
4. In `--print` mode, they generate the tool call but don't execute (no crash)

## The Pattern
**Crashes when ALL of these are present:**
- Bash heredoc with `<< 'EOF'`
- JavaScript/TypeScript template literal with backticks
- `${variable?.method()}` pattern inside the template literal

**Does NOT crash when:**
- No optional chaining (`?.`)
- No method call after optional chaining
- Not inside a template literal
- Not inside a heredoc