#!/bin/bash
#
# Claude Code Hook - Emoji Usage Checker
# Non-blocking warnings for emoji usage during development
#
# This hook integrates with Claude Code to check for excessive emoji usage
# after file modifications. It provides warnings without blocking the workflow.
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SESSION_ID_FILE="/tmp/claude-current-session-id"
SESSION_FILES_DIR="/tmp/claude-session-files"

# Source tty-colors library for TTY-aware output
source "${SCRIPT_DIR}/lib/tty-colors.sh"

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}" >&2
}

# Skip if explicitly disabled
if [ "${SKIP_EMOJI_CHECK:-false}" = "true" ]; then
    exit 0
fi

# Skip if we're already in an emoji check (prevent recursion)
if [ "${EMOJI_CHECK_ACTIVE:-false}" = "true" ]; then
    exit 0
fi
export EMOJI_CHECK_ACTIVE=true

# Determine which files to check
FILES_TO_CHECK=""

# Try to get files from current Claude session
if [ -f "$SESSION_ID_FILE" ]; then
    SESSION_ID=$(cat "$SESSION_ID_FILE" 2>/dev/null || echo "")
    if [ -n "$SESSION_ID" ] && [ -f "$SESSION_FILES_DIR/$SESSION_ID.txt" ]; then
        # Get list of modified files from session tracking
        FILES_TO_CHECK=$(cat "$SESSION_FILES_DIR/$SESSION_ID.txt" 2>/dev/null | tr '\n' ' ' || echo "")
        
        if [ -n "$FILES_TO_CHECK" ]; then
            print_color "$GRAY" "※ Checking emoji usage in session files..."
        fi
    fi
fi

# Fallback: check recently modified files if no session files found
if [ -z "$FILES_TO_CHECK" ]; then
    # Get files modified in the last commit or currently modified
    FILES_TO_CHECK=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || echo "")
    
    if [ -n "$FILES_TO_CHECK" ]; then
        print_color "$GRAY" "※ Checking emoji usage in recently modified files..."
    fi
fi

# If we have files to check, run the emoji checker
if [ -n "$FILES_TO_CHECK" ]; then
    # Filter for relevant file types and check if files exist
    VALID_FILES=""
    for file in $FILES_TO_CHECK; do
        if [ -f "$file" ]; then
            case "$file" in
                *.rb|*.ts|*.js|*.sh|*.md|*.yml|*.yaml|*.json)
                    VALID_FILES="$VALID_FILES $file"
                    ;;
            esac
        fi
    done
    
    if [ -n "$VALID_FILES" ]; then
        # Run the emoji checker with warning-only mode and higher threshold for Claude sessions
        # Using a higher threshold (5) for development to be less intrusive
        npx ts-node "$SCRIPT_DIR/check-emoji-usage.ts" \
            --threshold 5 \
            --warning-only \
            --verbose \
            $VALID_FILES || true  # Don't fail on errors
    fi
fi

# Clean up
unset EMOJI_CHECK_ACTIVE

exit 0