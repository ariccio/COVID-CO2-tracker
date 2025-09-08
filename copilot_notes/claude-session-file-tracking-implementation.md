# Claude Code Session-Based File Tracking Implementation Guide

## Overview
This guide provides a complete implementation for tracking files modified during a Claude Code session, designed for validation hooks (like Rubocop, ESLint, SwiftLint, etc.). The system properly handles multiple concurrent Claude sessions and integrates with git for accurate change detection.

## Problem Statement
- Time-based file detection (e.g., "files modified in last 4 hours") catches unrelated changes
- Multiple Claude sessions can interfere with each other
- No way to distinguish between Claude's changes and external modifications
- Need accurate session-scoped tracking for validation hooks

## Solution Architecture

### Core Components
1. **Session Tracking System** - Tracks files modified by specific Claude session
2. **Hook Integration** - Captures session_id from Claude's hook JSON
3. **Git Integration** - Compares against git to ensure accuracy
4. **Multi-Session Isolation** - Each session gets isolated storage
5. **Automatic Cleanup** - Removes stale session data

## Implementation Instructions

### Step 1: Create the Core Session Tracking Script

Create `scripts/track-session-files.sh`:

```bash
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
# Session data stored in: /tmp/claude-session-{session_id}/

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
            git status --porcelain > "${SESSION_DIR}/git_status_initial.txt" 2>/dev/null || true
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
        if ! grep -q "^${FILE_PATH}$" "${SESSION_DIR}/modified_files.txt" 2>/dev/null; then
            echo "$FILE_PATH" >> "${SESSION_DIR}/modified_files.txt"
            
            # Store file's git status before modification
            if [ -d .git ] && [ ! -f "${SESSION_DIR}/git_status_${FILE_PATH//\//_}.txt" ]; then
                git status --porcelain "$FILE_PATH" > "${SESSION_DIR}/git_status_${FILE_PATH//\//_}.txt" 2>/dev/null || true
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
            echo "Session cleared: $SESSION_ID"
        fi
        ;;
        
    cleanup)
        # Remove sessions older than 24 hours
        find "$SESSION_BASE_DIR" -maxdepth 1 -type d -name "session-*" -mtime +1 -exec rm -rf {} \; 2>/dev/null || true
        echo "Cleaned up old sessions"
        ;;
        
    *)
        echo "Usage: $0 {init|add|list|clear|cleanup} [SESSION_ID] [FILE_PATH]" >&2
        exit 1
        ;;
esac
```

### Step 2: Extract Session ID from Hook Input

Create `scripts/extract-session-id.sh`:

```bash
#!/bin/bash
#
# Extract session_id from Claude Code hook JSON input
# Falls back to deterministic alternatives if not found

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Try to extract session_id from JSON
# Claude provides this in the hook input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null || true)

# Fallback strategies if session_id not found
if [ -z "$SESSION_ID" ]; then
    # Try to get from environment (if Claude sets it)
    if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
        SESSION_ID="$CLAUDE_SESSION_ID"
    else
        # Generate deterministic ID from available info
        # Use combination of PID, TTY, and timestamp
        TTY_ID=$(tty 2>/dev/null | md5sum | cut -c1-8 || echo "notty")
        TIMESTAMP=$(date +%s)
        SESSION_ID="${TTY_ID}-${PPID}-${TIMESTAMP}"
    fi
fi

# Sanitize session ID (remove problematic characters)
SESSION_ID=$(echo "$SESSION_ID" | tr -cd '[:alnum:]-_')

echo "$SESSION_ID"
```

### Step 3: Create Session Initialization Hook

Create `scripts/init-session-tracking.sh`:

```bash
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
"$SCRIPT_DIR/track-session-files.sh" init "$SESSION_ID" >/dev/null 2>&1

# Store session ID for other hooks to use
echo "$SESSION_ID" > /tmp/claude-current-session-id

echo "Session tracking initialized: $SESSION_ID" >&2
```

### Step 4: Update Post-Edit Hook for Your Validator

For Rubocop example, update `scripts/post-rubocop-check.sh`:

Add after file path extraction:
```bash
# Extract session ID from input
SESSION_ID=$(echo "$INPUT" | "$(dirname "$0")/extract-session-id.sh")

# Track this file in the session
"$(dirname "$0")/track-session-files.sh" add "$SESSION_ID" "$FILE_PATH" 2>/dev/null || true
```

### Step 5: Update Session-End Validation Hook

For Rubocop example, update `scripts/rubocop-session-check.sh`:

Replace time-based detection with:
```bash
# Extract session ID
if [ -p /dev/stdin ]; then
    INPUT=$(cat)
    SESSION_ID=$(echo "$INPUT" | "$(dirname "$0")/extract-session-id.sh")
else
    # Fallback: try to read from temp file
    if [ -f /tmp/claude-current-session-id ]; then
        SESSION_ID=$(cat /tmp/claude-current-session-id)
    else
        echo "Warning: No session ID available, falling back to time-based detection" >&2
        # ... existing time-based code ...
    fi
fi

# Get session-tracked files
SESSION_FILES=$("$(dirname "$0")/track-session-files.sh" list "$SESSION_ID" 2>/dev/null || true)

if [ -n "$SESSION_FILES" ]; then
    echo "Checking files modified in Claude session $SESSION_ID..."
    
    # Filter for only files that still exist and are still modified
    MODIFIED_FILES=""
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Check if file is still modified according to git
            if [ -d .git ]; then
                if git diff --quiet "$file" 2>/dev/null; then
                    echo "  Skipping $file (no changes vs git)" >&2
                    continue
                fi
            fi
            MODIFIED_FILES="${MODIFIED_FILES}${file}"$'\n'
        fi
    done <<< "$SESSION_FILES"
    
    if [ -z "$MODIFIED_FILES" ]; then
        echo "No modified files remain from this session"
        # Clear session data
        "$(dirname "$0")/track-session-files.sh" clear "$SESSION_ID" 2>/dev/null || true
        exit 0
    fi
else
    echo "No session tracking found, using time-based detection..."
    # ... fallback code ...
fi

# ... rest of validation logic ...

# At the end, clear session data
"$(dirname "$0")/track-session-files.sh" clear "$SESSION_ID" 2>/dev/null || true
```

### Step 6: Configure Claude Code Hooks

Add to `.claude/settings.local.json`:

```json
{
    "hooks": {
        "SessionStart": [{
            "type": "command",
            "command": "scripts/init-session-tracking.sh"
        }],
        "PostToolUse": [{
            "tools": ["Edit", "MultiEdit", "Write"],
            "type": "command",
            "command": "scripts/post-rubocop-check.sh"
        }],
        "Stop": [{
            "type": "command",
            "command": "scripts/rubocop-session-check.sh"
        }]
    }
}
```

### Step 7: Create Diagnostic Tool

Create `scripts/debug-session-tracking.sh`:

```bash
#!/bin/bash
#
# Debug tool for session tracking

set -euo pipefail

echo "=== Claude Session Tracking Debug Info ==="
echo ""

# Check for active sessions
SESSION_BASE_DIR="/tmp/claude-sessions"
if [ -d "$SESSION_BASE_DIR" ]; then
    echo "Active sessions:"
    for session_dir in "$SESSION_BASE_DIR"/session-*; do
        if [ -d "$session_dir" ]; then
            session_id=$(basename "$session_dir" | sed 's/session-//')
            file_count=$(wc -l < "${session_dir}/modified_files.txt" 2>/dev/null || echo "0")
            metadata=$(cat "${session_dir}/metadata.json" 2>/dev/null || echo "{}")
            started=$(echo "$metadata" | jq -r '.started_at // "unknown"')
            
            echo "  - Session: $session_id"
            echo "    Started: $started"
            echo "    Files tracked: $file_count"
            
            if [ "$file_count" -gt 0 ]; then
                echo "    Files:"
                while IFS= read -r file; do
                    echo "      - $file"
                done < "${session_dir}/modified_files.txt"
            fi
        fi
    done
else
    echo "No session directory found"
fi

echo ""
echo "Current session ID (if any):"
if [ -f /tmp/claude-current-session-id ]; then
    cat /tmp/claude-current-session-id
else
    echo "  None"
fi

echo ""
echo "Git status:"
git status --short 2>/dev/null || echo "  Not a git repository"
```

### Step 8: Add Cleanup Cron Job (Optional)

Add to your setup script or README:

```bash
# Add cron job to cleanup old sessions daily
(crontab -l 2>/dev/null; echo "0 3 * * * $(pwd)/scripts/track-session-files.sh cleanup") | crontab -
```

## Testing the Implementation

1. **Test session initialization:**
   ```bash
   echo '{"session_id": "test-123"}' | ./scripts/init-session-tracking.sh
   ```

2. **Test file tracking:**
   ```bash
   ./scripts/track-session-files.sh add test-123 app/models/user.rb
   ./scripts/track-session-files.sh list test-123
   ```

3. **Test with actual Claude hook:**
   ```bash
   echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.rb"}, "session_id": "test-456"}' | ./scripts/post-rubocop-check.sh
   ```

4. **Debug current state:**
   ```bash
   ./scripts/debug-session-tracking.sh
   ```

## Adapting for Other Languages/Validators

### For ESLint (JavaScript/TypeScript):
- Replace `.rb` patterns with `.js`, `.jsx`, `.ts`, `.tsx`
- Replace `bundle exec rubocop` with `npx eslint`
- Adjust offense parsing patterns

### For SwiftLint (Swift):
- Replace `.rb` patterns with `.swift`
- Replace `bundle exec rubocop` with `swiftlint`
- Adjust offense parsing patterns

### For Python (flake8/black):
- Replace `.rb` patterns with `.py`
- Replace `bundle exec rubocop` with `flake8` or `black --check`
- Adjust offense parsing patterns

## Key Features

1. **Session Isolation**: Each Claude session gets its own tracking directory
2. **Concurrent Session Support**: Lock files prevent race conditions
3. **Git Integration**: Validates files are actually modified (not just touched)
4. **Automatic Cleanup**: Old sessions removed after 24 hours
5. **Multiple Fallbacks**: Works even if session_id not provided
6. **File Deduplication**: Each file tracked only once per session
7. **Diagnostic Tools**: Easy debugging of session state

## Troubleshooting

### Session ID not being extracted:
- Check if Claude Code is passing session_id in hook JSON
- Verify jq is installed and working
- Check fallback ID generation is working

### Files not being tracked:
- Run debug script to see active sessions
- Check file permissions on /tmp/claude-sessions/
- Verify hooks are configured correctly

### Multiple sessions interfering:
- Ensure session IDs are unique
- Check lock mechanism is working
- Verify cleanup is removing old sessions

## Benefits Over Time-Based Detection

1. **Accuracy**: Only tracks files Claude actually modified
2. **No False Positives**: External changes ignored
3. **Session Scoped**: Multiple Claude instances don't interfere
4. **Git Aware**: Understands version control state
5. **Performant**: No need to scan entire directory tree
6. **Reliable**: Multiple fallback mechanisms

## Repository Integration Notes

This implementation follows patterns from:
- DeeDee-Prototype's Swift validation hooks
- COVID-CO2-tracker's Rubocop integration
- General bash best practices for robustness

The system is designed to be:
- Self-contained (all logic in scripts/)
- Git-friendly (no binary files, all text)
- Debuggable (comprehensive logging and diagnostics)
- Maintainable (clear separation of concerns)