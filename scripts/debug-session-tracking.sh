#!/bin/bash
#
# Debug tool for session tracking

set -euo pipefail

# echo "=== Claude Session Tracking Debug Info ==="
# echo ""

# Check for active sessions
SESSION_BASE_DIR="/tmp/claude-sessions"
if [ -d "$SESSION_BASE_DIR" ]; then
    echo "Active sessions:" >&2
    for session_dir in "$SESSION_BASE_DIR"/session-*; do
        if [ -d "$session_dir" ]; then
            session_id=$(basename "$session_dir" | sed 's/session-//')
            file_count=$(wc -l < "${session_dir}/modified_files.txt" 2>/dev/null || echo "0")
            metadata=$(cat "${session_dir}/metadata.json" 2>/dev/null || echo "{}")
            started=$(echo "$metadata" | jq -r '.started_at // "unknown"')
            
            echo "  - Session: $session_id" >&2
            echo "    Started: $started" >&2
            echo "    Files tracked: $file_count" >&2
            
            if [ "$file_count" -gt 0 ]; then
                echo "    Files:" >&2
                while IFS= read -r file; do
                    echo "      - $file" >&2
                done < "${session_dir}/modified_files.txt"
            fi
        fi
    done
else
    echo "No session directory found" >&2
fi

# echo ""
echo "Current session ID (if any):" >&2
if [ -f /tmp/claude-current-session-id ]; then
    cat /tmp/claude-current-session-id >&2
else
    echo "  None" >&2
fi

# echo ""
echo "Git status:" >&2
git status --short 2>/dev/null >&2 || echo "  Not a git repository" >&2