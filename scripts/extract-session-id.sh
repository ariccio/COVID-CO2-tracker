#!/bin/bash
#
# Extract session_id from Claude Code hook JSON input
# Falls back to deterministic alternatives if not found

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Try to extract session_id from JSON
# Claude provides this in the hook input
if command -v jq >/dev/null 2>&1; then
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' || {
        echo "WARNING: jq failed to parse JSON input" >&2
        echo ""
    })
else
    echo "WARNING: jq not found, cannot extract session_id from JSON" >&2
    SESSION_ID=""
fi

# Fallback strategies if session_id not found
if [ -z "$SESSION_ID" ]; then
    # Try to get from environment (if Claude sets it)
    if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
        SESSION_ID="$CLAUDE_SESSION_ID"
    else
        # Generate deterministic ID from available info
        # Use combination of PID, TTY, and timestamp
        if command -v md5sum >/dev/null 2>&1; then
            TTY_ID=$(tty 2>/dev/null | md5sum | cut -c1-8 || echo "notty")
        elif command -v md5 >/dev/null 2>&1; then
            TTY_ID=$(tty 2>/dev/null | md5 | cut -c1-8 || echo "notty")
        else
            # Fallback without hash - just use a simple identifier
            TTY_ID=$(tty 2>/dev/null | tr '/' '_' | cut -c1-8 || echo "notty")
        fi
        TIMESTAMP=$(date +%s)
        SESSION_ID="${TTY_ID}-${PPID}-${TIMESTAMP}"
    fi
fi

# Sanitize session ID (remove problematic characters)
SESSION_ID=$(echo "$SESSION_ID" | tr -cd '[:alnum:]-_')

echo "$SESSION_ID"