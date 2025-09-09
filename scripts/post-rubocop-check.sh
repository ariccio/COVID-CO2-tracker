#!/bin/bash

# Post-Edit Rubocop Validation Hook for Claude Code
# Validates Rubocop compliance and checks for regression
# Called by Claude Code PostToolUse hook after Edit/MultiEdit/Write operations
#
# Documentation: Based on DeeDee-Prototype/docs/swift-edit-validation-hooks.md pattern
# CRITICAL: Uses POSIX character classes for BSD/GNU sed compatibility
# See: DeeDee-Prototype/copilot_notes/shell-script-error-handling-pattern.md#bsd-sed-vs-gnu-sed-differences

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Read JSON input from Claude Code
INPUT=$(cat)

# Debug logging (can be enabled if needed)
# echo "DEBUG: Received input: $INPUT" >> /tmp/rubocop-hook-debug.log

# Extract tool information from JSON
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Only process Ruby files
if [[ "$FILE_PATH" != *.rb ]] && [[ "$FILE_PATH" != *.rake ]] && [[ "$FILE_PATH" != *Gemfile* ]] && [[ "$FILE_PATH" != *Rakefile* ]]; then
    # Non-Ruby file, just pass through silently
    exit 0
fi

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    echo "Warning: File not found: '$FILE_PATH'" >&2
    # Exit 1 to show warning but don't block
    exit 1
fi

# Extract session ID from input
SESSION_ID=$(echo "$INPUT" | "$(dirname "$0")/extract-session-id.sh")

# Track this file in the session (for session-end reporting)
"$(dirname "$0")/track-session-files.sh" add "$SESSION_ID" "$FILE_PATH" || {
    echo "WARNING: Failed to track file in session $SESSION_ID" >&2
    # Non-critical - don't fail the hook over session tracking
}

# Get baseline from temp file if it exists
# Platform-specific MD5 command handling
if command -v md5sum >/dev/null 2>&1; then
    # Linux has md5sum
    HASH=$(echo -n "$FILE_PATH" | md5sum | cut -d' ' -f1)
else
    # macOS has md5
    HASH=$(echo -n "$FILE_PATH" | md5)
fi
BASELINE_FILE="/tmp/rubocop-baseline-$HASH.txt"
BASELINE_COUNT=0
if [[ -f "$BASELINE_FILE" ]]; then
    BASELINE_COUNT=$(cat "$BASELINE_FILE" | tr -d '[:space:]' || {
        echo "WARNING: Failed to read baseline from $BASELINE_FILE" >&2
        echo "0"
    })
    # Validate numeric value
    if ! [[ "$BASELINE_COUNT" =~ ^[0-9]+$ ]]; then
        echo "Warning: Invalid baseline count: '$BASELINE_COUNT', treating as 0" >&2
        BASELINE_COUNT=0
    fi
fi

# Optional: Strip trailing whitespace automatically
# CRITICAL: BSD sed (macOS) vs GNU sed (Linux) compatibility!
# Uses POSIX character class [[:blank:]] for spaces and tabs
# DO NOT use [ \t] on macOS - it treats '\t' as literal characters!
if [[ "${AUTO_FIX_WHITESPACE:-0}" == "1" ]]; then
    # Safe trailing whitespace removal using POSIX character classes
    sed -i '' 's/[[:blank:]]*$//' "$FILE_PATH"
fi

# Run Rubocop and capture results
OFFENSES=$(bundle exec rubocop --fail-level F --format simple "$FILE_PATH" 2>&1 || true)

# Count offenses with explicit stage-by-stage error handling
if [ -n "$OFFENSES" ]; then
    # Stage 1: Extract offense lines
    OFFENSE_LINES=$(echo "$OFFENSES" | grep -E "^[CWE]:" 2>&1) || {
        exit_code=$?
        if [ $exit_code -eq 1 ]; then
            # No matches is legitimate - no offenses found
            OFFENSE_COUNT="0"
        else
            echo "ERROR: Failed to parse Rubocop output (exit code $exit_code)" >&2
            echo "Rubocop output was: ${OFFENSES:0:200}..." >&2
            exit 1
        fi
    }
    
    # Stage 2: Count the offense lines if we found any
    if [ -n "$OFFENSE_LINES" ]; then
        OFFENSE_COUNT=$(echo "$OFFENSE_LINES" | wc -l | tr -d '[:space:]')
    else
        OFFENSE_COUNT="0"
    fi
    
    # Count specific types of issues (already protected with || echo "0")
    TRAILING_COUNT=$(echo "$OFFENSES" | grep -c "Layout/TrailingWhitespace" || echo "0")
    SYNTAX_COUNT=$(echo "$OFFENSES" | grep -c "Lint/Syntax" || echo "0")
else
    OFFENSE_COUNT="0"
    TRAILING_COUNT="0"
    SYNTAX_COUNT="0"
fi

# Ensure clean numbers (these should already be clean, but being defensive)
OFFENSE_COUNT=$(echo "$OFFENSE_COUNT" | tr -d '[:space:]')
TRAILING_COUNT=$(echo "$TRAILING_COUNT" | tr -d '[:space:]')
SYNTAX_COUNT=$(echo "$SYNTAX_COUNT" | tr -d '[:space:]')

# Validate numeric values
if ! [[ "$OFFENSE_COUNT" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid offense count: '$OFFENSE_COUNT'" >&2
    exit 1
fi
if ! [[ "$TRAILING_COUNT" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid trailing count: '$TRAILING_COUNT'" >&2
    exit 1
fi
if ! [[ "$SYNTAX_COUNT" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid syntax count: '$SYNTAX_COUNT'" >&2
    exit 1
fi

# Determine response based on results
# Use arithmetic comparison which properly triggers set -e on error
if (( SYNTAX_COUNT > 0 )); then
    # Syntax errors are critical - block execution
    echo "✗ Syntax errors detected in $FILE_PATH! Fix before continuing." >&2
    echo "Run: bundle exec rubocop --fail-level F '$FILE_PATH' to see errors" >&2
    exit 2
elif (( TRAILING_COUNT > 0 )); then
    # Trailing whitespace detected - provide helpful message
    echo "✗ Claude added trailing whitespace when editing $FILE_PATH" >&2
    echo "" >&2
    echo "Dear Claude, this is an automated message from the Rubocop validation hook." >&2
    echo "Trailing whitespace was detected. Please review the repository instructions" >&2
    echo "(check copilot-instructions.md or copilot_notes/) to understand our code standards." >&2
    # echo "" >&2
    echo "To fix: bundle exec rubocop -a '$FILE_PATH'" >&2
    echo "Or set AUTO_FIX_WHITESPACE=1 environment variable to auto-fix" >&2

    # Only show BSD sed warning on macOS
    if [[ "$(uname -s)" == "Darwin" ]]; then
        echo "" >&2
        echo "⚠ macOS detected: The BSD version of sed has different behavior than GNU sed." >&2
        echo "  Specifically, it treats '\\t' in bracket expressions as literal characters '\\\\' and 't'," >&2
        echo "  which can corrupt files by removing trailing 't' characters." >&2
        echo "  Use POSIX character classes like [[:blank:]] instead of [ \\\\t] for safety." >&2
        echo "" >&2
    fi
    # Exit 1 shows warning but doesn't block
    exit 1
elif (( BASELINE_COUNT > 0 && OFFENSE_COUNT > BASELINE_COUNT )); then
    # Offenses increased from baseline - warn but don't block
    INCREASE=$((OFFENSE_COUNT - BASELINE_COUNT))
    echo "⚠ Rubocop offenses increased by $INCREASE in $FILE_PATH (was: $BASELINE_COUNT, now: $OFFENSE_COUNT)" >&2
    # echo "" >&2
    echo "Dear Claude, this is an automated message from the Rubocop validation hook." >&2
    echo "New style violations were introduced. Please review the repository instructions" >&2
    echo "(check copilot-instructions.md or copilot_notes/) for our coding standards." >&2
    # echo "" >&2
    echo "To see offenses: bundle exec rubocop --fail-level F '$FILE_PATH'" >&2
    # Exit 1 shows error but doesn't block
    exit 1
else
    # Success case - exit 0, stdout is not shown to Claude
    if (( OFFENSE_COUNT == 0 )); then
        echo "✓ Ruby file is clean: '$FILE_PATH' (zero offenses)"
    else
        echo "✓ Ruby file unchanged: '$FILE_PATH' ($OFFENSE_COUNT existing offenses unchanged)"
    fi
fi

# Clean up baseline file
rm -f "$BASELINE_FILE"

exit 0