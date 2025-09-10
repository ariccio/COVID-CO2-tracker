#!/bin/bash

# Session-End Rubocop Check Hook for Claude Code
# Runs a final Rubocop check when the Claude session ends
# Called by Claude Code Stop hook
#
# Documentation: Based on DeeDee-Prototype/docs/swift-edit-validation-hooks.md pattern

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# echo "═══════════════════════════════════════════════════════════════"
echo "Running Final Rubocop Check for Session...." >&2
# echo "═══════════════════════════════════════════════════════════════"

# Check if we have bundle and rubocop available
if ! command -v bundle >/dev/null 2>&1; then
    echo "⚠ Bundle not found, skipping Rubocop check" >&2
    exit 0
fi

# Extract session ID
if [ -p /dev/stdin ]; then
    INPUT=$(cat)
    SESSION_ID=$(echo "$INPUT" | "$(dirname "$0")/extract-session-id.sh")
else
    # Fallback: try to read from temp file
    if [ -f /tmp/claude-current-session-id ]; then
        SESSION_ID=$(cat /tmp/claude-current-session-id)
    else
        SESSION_ID=""
    fi
fi

# Get session-tracked files if we have a session ID
if [ -n "$SESSION_ID" ]; then
    SESSION_FILES=$("$(dirname "$0")/track-session-files.sh" list "$SESSION_ID" || {
        echo "WARNING: Failed to list files for session $SESSION_ID" >&2
        echo ""  # Return empty list
    })
    
    if [ -n "$SESSION_FILES" ]; then
        echo "Checking files modified in Claude session $SESSION_ID..." >&2
        
        # Filter for only files that still exist and are still modified
        ALL_MODIFIED=""
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                # Check if file is still modified according to git
                if [ -d .git ]; then
                    if git diff --quiet "$file" && git diff --cached --quiet "$file"; then
                        echo "  Skipping $file (no changes vs git)" >&2
                        continue
                    fi
                fi
                ALL_MODIFIED="${ALL_MODIFIED}${file}"$'\n'
            fi
        done <<< "$SESSION_FILES"
        
        if [ -z "$ALL_MODIFIED" ]; then
            echo "No modified files remain from this session" >&2
            # Clear session data
            "$(dirname "$0")/track-session-files.sh" clear "$SESSION_ID" || {
                echo "WARNING: Failed to clear session $SESSION_ID" >&2
            }
            exit 0
        fi
    else
        # No files tracked for this session, fallback to time-based
        echo "No files tracked in session, using time-based detection..." >&2
        HOURS="${RUBOCOP_CHECK_HOURS:-4}"
        MINUTES=$((HOURS * 60))
        ALL_MODIFIED=$(find . -type f \( -name "*.rb" -o -name "*.rake" -o -name "Gemfile*" -o -name "Rakefile*" \) -mmin -${MINUTES} || {
            echo "WARNING: Find command failed, no files to check" >&2
            echo ""
        })
    fi
else
    # No session ID available, fallback to time-based detection
    echo "No session ID available, using time-based detection..." >&2
    HOURS="${RUBOCOP_CHECK_HOURS:-4}"
    MINUTES=$((HOURS * 60))
    ALL_MODIFIED=$(find . -type f \( -name "*.rb" -o -name "*.rake" -o -name "Gemfile*" -o -name "Rakefile*" \) -mmin -${MINUTES} || {
        echo "WARNING: Find command failed, no files to check" >&2
        echo ""
    })
fi

if [ -z "$ALL_MODIFIED" ]; then
    echo "No Ruby files to check" >&2
    exit 0
fi

# Filter out vendor and node_modules directories
MODIFIED_FILES=""
while IFS= read -r file; do
    # Skip vendor and node_modules paths
    if [[ "$file" == *"/vendor/"* ]] || [[ "$file" == *"/node_modules/"* ]]; then
        continue
    fi
    MODIFIED_FILES="${MODIFIED_FILES}${file}"$'\n'
done <<< "$ALL_MODIFIED"

# Trim trailing newline and limit to 20 files
MODIFIED_FILES=$(echo -n "$MODIFIED_FILES" | head -20)

if [ -z "$MODIFIED_FILES" ]; then
    echo "No Ruby files modified in this session (excluding vendor/node_modules)" >&2
    exit 0
fi

# echo "Checking recently modified Ruby files..."
# echo ""

# Track overall status
TOTAL_OFFENSES=0
FILES_WITH_ISSUES=""

# Check each file
while IFS= read -r FILE; do
    if [[ -f "$FILE" ]]; then
        # Run Rubocop on the file
        OUTPUT=$(bundle exec rubocop --fail-level F --format simple "$FILE" 2>&1 || true)
        OFFENSE_COUNT=$(echo "$OUTPUT" | grep -E "^[CWE]:" | wc -l | tr -d '[:space:]')
        
        if [[ "$OFFENSE_COUNT" -gt 0 ]]; then
            echo "⚠ $FILE: $OFFENSE_COUNT offenses" >&2
            TOTAL_OFFENSES=$((TOTAL_OFFENSES + OFFENSE_COUNT))
            FILES_WITH_ISSUES="$FILES_WITH_ISSUES$FILE\n"
        else
            echo "✓ $FILE: clean" >&2
        fi
    fi
done <<< "$MODIFIED_FILES"

# echo ""
# echo "═══════════════════════════════════════════════════════════════"

if [[ "$TOTAL_OFFENSES" -gt 0 ]]; then
    # echo "Session Summary: $TOTAL_OFFENSES total offenses found"
    # echo ""
    echo "Files with issues:" >&2
    echo -e "$FILES_WITH_ISSUES" >&2
    # echo ""
    # echo "To see all issues, run:"
    echo "To see all issues, run: bundle exec rubocop --fail-level F" >&2
    # echo ""
    echo "To auto-fix safe issues, run:" >&2
    echo "  bundle exec rubocop -a" >&2
# else
#     echo "✓ Session Summary: All modified Ruby files are clean!"
fi

# Clear the session tracking if we have a session ID
if [ -n "$SESSION_ID" ]; then
    "$(dirname "$0")/track-session-files.sh" clear "$SESSION_ID" || {
        echo "WARNING: Failed to clear session $SESSION_ID" >&2
        # Non-critical - session will be cleaned up by cleanup cron
    }
fi

# Exit 0 for Stop hooks - we don't want to show errors to the user
# This is informational only
exit 0