#!/bin/bash
#
# Session File Tracking for Claude Code
# Tracks files modified during a specific Claude session
#
# Usage:
#   track-session-files.sh init SESSION_ID     - Initialize a new session
#   track-session-files.sh add SESSION_ID FILE - Add a file to session
#   track-session-files.sh list SESSION_ID     - List files in session
#   track-session-files.sh clear SESSION_ID    - Clear session data
#   track-session-files.sh cleanup             - Remove old sessions (>24h)
#
# Session data stored in: /tmp/claude-sessions/session-{session_id}/

set -euo pipefail

# Constants
SESSION_BASE_DIR="/tmp/claude-sessions"
LOCK_TIMEOUT=5

# Ensure base directory exists
mkdir -p "$SESSION_BASE_DIR"

# Function to get session directory
get_session_dir() {
    local session_id="$1"
    echo "$SESSION_BASE_DIR/session-${session_id}"
}

# Function to acquire lock (for concurrent access protection)
acquire_lock() {
    local session_dir="$1"
    local lock_file="${session_dir}/.lock"
    local timeout=$LOCK_TIMEOUT
    
    while [ $timeout -gt 0 ]; do
        if mkdir "${lock_file}" 2>/dev/null; then
            trap "rm -rf '${lock_file}'" EXIT
            return 0
        fi
        sleep 0.1
        timeout=$((timeout - 1))
    done
    
    echo "ERROR: Failed to acquire lock for session" >&2
    return 1
}

# Function to release lock
release_lock() {
    local session_dir="$1"
    rm -rf "${session_dir}/.lock" 2>/dev/null || true
}

# Main logic
COMMAND="${1:-}"
SESSION_ID="${2:-}"

case "$COMMAND" in
    init)
        if [ -z "$SESSION_ID" ]; then
            echo "ERROR: Session ID required" >&2
            exit 1
        fi
        
        SESSION_DIR=$(get_session_dir "$SESSION_ID")
        mkdir -p "$SESSION_DIR"
        
        # Initialize session metadata
        cat > "${SESSION_DIR}/metadata.json" <<EOF
{
    "session_id": "$SESSION_ID",
    "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "pid": $$,
    "working_dir": "$(pwd)"
}
EOF
        
        # Initialize empty file list
        touch "${SESSION_DIR}/modified_files.txt"
        
        # Capture initial git status
        if [ -d .git ]; then
            git status --porcelain > "${SESSION_DIR}/git_status_initial.txt" || {
                echo "WARNING: Failed to capture initial git status" >&2
                true  # Don't fail session init over this
            }
        fi
        
        echo "Session initialized: $SESSION_ID"
        ;;
        
    add)
        FILE_PATH="${3:-}"
        if [ -z "$SESSION_ID" ] || [ -z "$FILE_PATH" ]; then
            echo "ERROR: Session ID and file path required" >&2
            exit 1
        fi
        
        SESSION_DIR=$(get_session_dir "$SESSION_ID")
        if [ ! -d "$SESSION_DIR" ]; then
            # Auto-initialize if needed
            "$0" init "$SESSION_ID" >/dev/null
        fi
        
        acquire_lock "$SESSION_DIR"
        
        # Add file if not already tracked (avoid duplicates)
        if [ ! -f "${SESSION_DIR}/modified_files.txt" ] || ! grep -q "^${FILE_PATH}$" "${SESSION_DIR}/modified_files.txt"; then
            echo "$FILE_PATH" >> "${SESSION_DIR}/modified_files.txt"
            
            # Store file's git status before modification
            if [ -d .git ] && [ ! -f "${SESSION_DIR}/git_status_${FILE_PATH//\//_}.txt" ]; then
                git status --porcelain "$FILE_PATH" > "${SESSION_DIR}/git_status_${FILE_PATH//\//_}.txt" || {
                    echo "WARNING: Failed to capture git status for $FILE_PATH" >&2
                    true  # Don't fail file tracking over this
                }
            fi
        fi
        
        release_lock "$SESSION_DIR"
        ;;
        
    list)
        if [ -z "$SESSION_ID" ]; then
            echo "ERROR: Session ID required" >&2
            exit 1
        fi
        
        SESSION_DIR=$(get_session_dir "$SESSION_ID")
        if [ -f "${SESSION_DIR}/modified_files.txt" ]; then
            cat "${SESSION_DIR}/modified_files.txt"
        fi
        ;;
        
    clear)
        if [ -z "$SESSION_ID" ]; then
            echo "ERROR: Session ID required" >&2
            exit 1
        fi
        
        SESSION_DIR=$(get_session_dir "$SESSION_ID")
        if [ -d "$SESSION_DIR" ]; then
            rm -rf "$SESSION_DIR"
            # echo "Session cleared: $SESSION_ID"
        fi
        ;;
        
    cleanup)
        # Remove sessions older than 24 hours
        if [ -d "$SESSION_BASE_DIR" ]; then
            find "$SESSION_BASE_DIR" -maxdepth 1 -type d -name "session-*" -mtime +1 -exec rm -rf {} \; || {
                echo "WARNING: Some old sessions could not be removed" >&2
                true  # Non-critical, don't fail
            }
        fi
        echo "Cleaned up old sessions"
        ;;
        
    *)
        echo "Usage: $0 {init|add|list|clear|cleanup} [SESSION_ID] [FILE_PATH]" >&2
        exit 1
        ;;
esac