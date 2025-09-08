#!/bin/bash
#
# Initialize session tracking for Claude Code
# Called by SessionStart hook

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Read input and extract session ID
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | "$SCRIPT_DIR/extract-session-id.sh")

# Initialize session tracking
"$SCRIPT_DIR/track-session-files.sh" init "$SESSION_ID" >&2 || {
    echo "ERROR: Failed to initialize session tracking for $SESSION_ID" >&2
    exit 1
}

# Store session ID for other hooks to use
echo "$SESSION_ID" > /tmp/claude-current-session-id

echo "Session tracking initialized: $SESSION_ID" >&2