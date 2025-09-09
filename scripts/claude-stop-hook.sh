#!/bin/bash
#
# Claude Stop Hook - Test Runner
# Runs appropriate tests after Claude Code completes work
#
# This hook:
# 1. Determines what files were modified during the session
# 2. Selects appropriate test suite based on changes
# 3. Runs tests and reports results
# 4. Cleans up session data
#
# Environment variables:
#   SKIP_CLAUDE_TESTS - Set to "true" to skip all tests
#   CLAUDE_TEST_LEVEL - "quick" (default), "full", or "none"
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SESSION_ID_FILE="/tmp/claude-current-session-id"
MAX_TEST_DURATION=600  # 10 minutes timeout

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}"
}

# Check if we're already in a stop hook (prevent recursion)
if [ "${stop_hook_active:-false}" = "true" ]; then
    print_color "$YELLOW" "※ Stop hook already active, skipping to prevent recursion"
    exit 0
fi

# Check if tests are explicitly skipped
if [ "${SKIP_CLAUDE_TESTS:-false}" = "true" ]; then
    print_color "$YELLOW" "※ Tests skipped via SKIP_CLAUDE_TESTS environment variable"
    exit 0
fi

# Extract session ID from stdin or fallback sources
SESSION_ID=""
if [ -p /dev/stdin ]; then
    INPUT=$(cat)
    SESSION_ID=$("$SCRIPT_DIR/extract-session-id.sh" <<< "$INPUT" || echo "")
fi

# Fallback to session ID file if not found in input
if [ -z "$SESSION_ID" ] && [ -f "$SESSION_ID_FILE" ]; then
    SESSION_ID=$(cat "$SESSION_ID_FILE")
fi

# If still no session ID, generate one
if [ -z "$SESSION_ID" ]; then
    SESSION_ID="stop-hook-$(date +%s)"
    print_color "$YELLOW" "※ No session ID found, using: $SESSION_ID"
fi

# Get list of modified files from session tracker
MODIFIED_FILES=""
if [ -x "$SCRIPT_DIR/track-session-files.sh" ]; then
    MODIFIED_FILES=$("$SCRIPT_DIR/track-session-files.sh" list "$SESSION_ID" 2>/dev/null || echo "")
fi

# If no tracked files, try git to find recently modified files
if [ -z "$MODIFIED_FILES" ]; then
    print_color "$BLUE" "※ No session-tracked files found, checking git for recent changes..."
    cd "$PROJECT_DIR"
    # Get files modified in the last 5 minutes
    MODIFIED_FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}' || echo "")
fi

# Determine test level based on modified files
determine_test_level() {
    local files="$1"
    local test_level="${CLAUDE_TEST_LEVEL:-auto}"
    
    if [ "$test_level" != "auto" ]; then
        echo "$test_level"
        return
    fi
    
    # If no files modified, run quick tests
    if [ -z "$files" ]; then
        echo "quick"
        return
    fi
    
    # Check file types
    local has_ruby=false
    local has_config=false
    local has_migration=false
    local has_spec=false
    local has_typescript=false
    local has_javascript=false
    local has_frontend=false
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        
        case "$file" in
            *.rb)
                has_ruby=true
                ;;
            config/*.yml|config/*.rb|config/environments/*.rb)
                has_config=true
                ;;
            db/migrate/*.rb)
                has_migration=true
                ;;
            spec/*.rb)
                has_spec=true
                ;;
            *.ts|*.tsx)
                has_typescript=true
                has_frontend=true
                ;;
            *.js|*.jsx)
                has_javascript=true
                has_frontend=true
                ;;
            *.vue|*.svelte)
                has_frontend=true
                ;;
        esac
    done <<< "$files"
    
    # Determine test level based on file types
    # Backend + Frontend changes = likely need E2E
    if [ "$has_ruby" = true ] && [ "$has_frontend" = true ]; then
        echo "full"  # Cross-stack changes need E2E
    elif [ "$has_config" = true ] || [ "$has_migration" = true ]; then
        echo "full"  # Infrastructure changes need full validation
    elif [ "$has_typescript" = true ] || [ "$has_javascript" = true ]; then
        echo "full"  # Frontend changes often need E2E browser tests
    elif [ "$has_ruby" = true ] || [ "$has_spec" = true ]; then
        echo "smart"  # Backend-only changes can use targeted tests
    else
        echo "quick"  # Documentation, configs, etc.
    fi
}

# Get test level
TEST_LEVEL=$(determine_test_level "$MODIFIED_FILES")

# print_color "$BLUE" "═══════════════════════════════════════════════════════════════"
# print_color "$BLUE" "◆ Claude Stop Hook - Test Runner"
# print_color "$BLUE" "═══════════════════════════════════════════════════════════════"
# echo ""
print_color "$BLUE" "● Session ID: $SESSION_ID"
print_color "$BLUE" "● Test Level: $TEST_LEVEL"
print_color "$BLUE" "● Project: COVID-CO2-tracker"
echo ""

# Show modified files if any
if [ -n "$MODIFIED_FILES" ]; then
    print_color "$BLUE" "● Modified files during session:"
    echo "$MODIFIED_FILES" | while IFS= read -r file; do
        [ -z "$file" ] && continue
        echo "  - $file"
    done
    echo ""
fi

# Run appropriate test suite with timeout
run_tests_with_timeout() {
    local test_script="$1"
    local timeout_duration="${2:-$MAX_TEST_DURATION}"
    
    if [ ! -x "$test_script" ]; then
        print_color "$RED" "✗ Test script not found or not executable: $test_script"
        return 1
    fi
    
    # Run tests with timeout
    timeout "$timeout_duration" "$test_script" 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        print_color "$RED" "✗ Tests timed out after ${timeout_duration} seconds"
        return 1
    fi
    
    return $exit_code
}

# Execute tests based on level
TEST_RESULT=0
case "$TEST_LEVEL" in
    none)
        print_color "$YELLOW" "※ Test level set to 'none', skipping all tests"
        ;;
    quick)
        print_color "$BLUE" "→ Running quick test suite..."
        if run_tests_with_timeout "$SCRIPT_DIR/test-suite-quick.sh" 60; then
            # print_color "$GREEN" "✓ Quick tests passed"
            echo ""
        else
            print_color "$RED" "✗ Quick tests failed"
            TEST_RESULT=1
        fi
        ;;
    smart)
        print_color "$BLUE" "→ Running smart test selection..."
        # First run quick tests
        if run_tests_with_timeout "$SCRIPT_DIR/test-suite-quick.sh" 60; then
            print_color "$GREEN" "✓ Quick tests passed"
            # Then run targeted tests based on modified files
            if [ -x "$SCRIPT_DIR/test-suite-smart.sh" ]; then
                echo "$MODIFIED_FILES" | run_tests_with_timeout "$SCRIPT_DIR/test-suite-smart.sh" 300
                if [ $? -eq 0 ]; then
                    # print_color "$GREEN" "✓ Smart tests passed"
                    echo ""
                else
                    print_color "$RED" "✗ Smart tests failed"
                    TEST_RESULT=1
                fi
            fi
        else
            print_color "$RED" "✗ Quick tests failed, skipping smart tests"
            TEST_RESULT=1
        fi
        ;;
    full)
        print_color "$BLUE" "→ Running full test suite..."
        if run_tests_with_timeout "$SCRIPT_DIR/test-suite-full.sh" 600; then
            # print_color "$GREEN" "✓ Full test suite passed"
            :  # No-op command to make the then clause non-empty
        else
            print_color "$RED" "✗ Full test suite failed"
            TEST_RESULT=1
        fi
        ;;
    *)
        print_color "$YELLOW" "※ Unknown test level: $TEST_LEVEL, running quick tests"
        run_tests_with_timeout "$SCRIPT_DIR/test-suite-quick.sh" 60
        TEST_RESULT=$?
        ;;
esac

echo ""
print_color "$BLUE" "═══════════════════════════════════════════════════════════════"

# Generate summary report
SUMMARY_FILE="/tmp/claude-session-${SESSION_ID}-summary.txt"
{
    echo "Claude Session Summary"
    echo "====================="
    echo "Session ID: $SESSION_ID"
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Test Level: $TEST_LEVEL"
    echo "Test Result: $([ $TEST_RESULT -eq 0 ] && echo "PASSED" || echo "FAILED")"
    echo ""
    if [ -n "$MODIFIED_FILES" ]; then
        echo "Modified Files:"
        echo "$MODIFIED_FILES" | while IFS= read -r file; do
            [ -z "$file" ] && continue
            echo "  - $file"
        done
    fi
} > "$SUMMARY_FILE"

print_color "$BLUE" "● Summary saved to: $SUMMARY_FILE"

# Clean up session data
if [ -x "$SCRIPT_DIR/track-session-files.sh" ]; then
    "$SCRIPT_DIR/track-session-files.sh" clear "$SESSION_ID" 2>/dev/null || true
fi

# Clear session ID file
rm -f "$SESSION_ID_FILE"

# Exit with test result (0 for success, non-zero for failure)
# Note: We exit with 0 regardless to not interrupt Claude Code
# The test failures are reported but don't block the session
exit 0