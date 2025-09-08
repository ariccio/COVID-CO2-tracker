#!/bin/bash

# Pre-Edit Rubocop Baseline Capture Hook for Claude Code
# Captures Rubocop offense count before edits for comparison
# Called by Claude Code PreToolUse hook before Edit/MultiEdit/Write operations
#
# Documentation: Based on DeeDee-Prototype/docs/swift-edit-validation-hooks.md pattern

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Read JSON input from Claude Code
INPUT=$(cat)

# Extract file path from JSON
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Extract session ID from input
SESSION_ID=$(echo "$INPUT" | "$(dirname "$0")/extract-session-id.sh")

# Track this file in the session (for session-end reporting)
"$(dirname "$0")/track-session-files.sh" add "$SESSION_ID" "$FILE_PATH" || {
    echo "WARNING: Failed to track file in session $SESSION_ID" >&2
    # Non-critical - don't fail the hook over session tracking
}

# Only process Ruby files
if [[ "$FILE_PATH" != *.rb ]] && [[ "$FILE_PATH" != *.rake ]] && [[ "$FILE_PATH" != *Gemfile* ]] && [[ "$FILE_PATH" != *Rakefile* ]]; then
    # Non-Ruby file, no baseline needed - exit silently
    exit 0
fi

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    # New file, baseline is zero - exit silently
    exit 0
fi

# Run Rubocop and count offenses
# Rubocop returns non-zero on offenses, so always capture output
# Use --fail-level F to only fail on fatal errors, not style issues
OFFENSES=$(bundle exec rubocop --fail-level F --format simple "$FILE_PATH" 2>&1 || true)

# Count offenses with explicit stage-by-stage error handling
if [ -n "$OFFENSES" ]; then
    # Stage 1: Extract lines that indicate offenses (C: Convention, W: Warning, E: Error)
    OFFENSE_LINES=$(echo "$OFFENSES" | grep -E "^[CWE]:" 2>&1) || {
        exit_code=$?
        if [ $exit_code -eq 1 ]; then
            # No matches is legitimate - no offenses found in the output
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
else
    OFFENSE_COUNT="0"
fi

# Validate numeric value
if ! [[ "$OFFENSE_COUNT" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid offense count: '$OFFENSE_COUNT'" >&2
    exit 1
fi

# Store baseline in temp file (using MD5 hash of path for uniqueness)
# Platform-specific MD5 command handling
if command -v md5sum >/dev/null 2>&1; then
    # Linux has md5sum
    HASH=$(echo -n "$FILE_PATH" | md5sum | cut -d' ' -f1)
else
    # macOS has md5
    HASH=$(echo -n "$FILE_PATH" | md5)
fi
BASELINE_FILE="/tmp/rubocop-baseline-$HASH.txt"
echo "$OFFENSE_COUNT" > "$BASELINE_FILE"

# Also store timestamp for debugging
echo "$(date '+%Y-%m-%d %H:%M:%S'): $FILE_PATH: $OFFENSE_COUNT offenses" >> /tmp/rubocop-baselines.log

# Success - exit 0, stdout not shown to Claude
# Log to stdout for debugging
echo "Baseline captured: $OFFENSE_COUNT offenses in $(basename "$FILE_PATH")"

exit 0