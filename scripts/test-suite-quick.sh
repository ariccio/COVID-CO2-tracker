#!/bin/bash
#
# Quick Test Suite for Claude Stop Hook
# Runs minimal tests for fast feedback (~1 minute)
#
# Tests included:
# - Rubocop syntax check (errors only)
# - Rails boot verification
# - Basic smoke tests
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source tty-colors library for TTY-aware output
source "${SCRIPT_DIR}/lib/tty-colors.sh"

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}" >&2
}

# Function to run a test with nice output
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    # Create temp file for output
    local output_file=$(mktemp)
    
    # Run the test command with timeout protection
    if timeout 10 bash -c "$test_command" > "$output_file" 2>&1; then
        # Success: no output, just clean up and return
        rm -f "$output_file"
        return 0
    else
        # Failure: show test name and error details
        echo -n "  ◇ $test_name... " >&2
        print_color "$RED" "✗"
        # Show error output
        if [ -s "$output_file" ]; then
            echo "    Error output:" >&2
            cat "$output_file" | head -20 | sed 's/^/    /' >&2
            local line_count=$(wc -l < "$output_file")
            if [ "$line_count" -gt 20 ]; then
                echo "    ... ($(($line_count - 20)) more lines)" >&2
            fi
        fi
        rm -f "$output_file"
        return 1
    fi
}

# Navigate to project directory
cd "$PROJECT_DIR"

# Only show header in verbose mode
if [ "${VERBOSE:-false}" = "true" ]; then
    print_color "$BLUE" "Quick Test Suite"
    print_color "$BLUE" "────────────────"
    echo "" >&2
fi

FAILED_TESTS=0

# 1. Check Ruby syntax with Rubocop (errors only)
if command -v rubocop >/dev/null 2>&1; then
    if run_test "Rubocop syntax check" "bundle exec rubocop --fail-level E --raise-cop-error --display-style-guide --format quiet"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    print_color "$YELLOW" "  ※ Rubocop not found, skipping syntax check"
fi

# 2. Verify Rails can boot
if run_test "Rails boot check" "rails runner 'puts \"Rails loaded successfully\"' 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_color "$RED" "  ⚠ Rails failed to boot - this is critical!"
fi

# 3. Check for database connectivity (if Rails booted)
if [ $FAILED_TESTS -eq 0 ]; then
    if run_test "Database connection" "rails runner 'ActiveRecord::Base.connection.execute(\"SELECT 1\")' 2>&1"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# 4. Run critical model specs (if they exist)
if [ -d "spec/models" ] && [ $FAILED_TESTS -eq 0 ]; then
    # Check if there are any model specs
    if ls spec/models/*.rb >/dev/null 2>&1; then
        # Run only the most critical model specs (user, measurement if they exist)
        CRITICAL_SPECS=""
        for model in user measurement device location; do
            if [ -f "spec/models/${model}_spec.rb" ]; then
                CRITICAL_SPECS="$CRITICAL_SPECS spec/models/${model}_spec.rb"
            fi
        done
        
        if [ -n "$CRITICAL_SPECS" ]; then
            if run_test "Critical model specs" "bundle exec rspec $CRITICAL_SPECS --format progress --fail-fast"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    fi
fi

# 5. Check for pending migrations
if [ $FAILED_TESTS -eq 0 ]; then
    if run_test "Migration status" "rails db:migrate:status 2>/dev/null | head -20 | grep -q 'down' && exit 1 || exit 0"; then
        :
    else
        print_color "$YELLOW" "  ※ There are pending migrations"
        # This is a warning, not a failure
    fi
fi

# 6. Asset precompilation check (quick version)
if [ $FAILED_TESTS -eq 0 ]; then
    # Only check if assets can be precompiled, don't actually do it
    if run_test "Asset pipeline check" "rails runner 'Rails.application.config.assets.precompile' 2>&1"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# Only show separator and summary when there are failures or in verbose mode
if [ $FAILED_TESTS -gt 0 ] || [ "${VERBOSE:-false}" = "true" ]; then
    echo "" >&2
    print_color "$BLUE" "────────────────"
fi

# Summary
if [ $FAILED_TESTS -eq 0 ]; then
    # Success - silent unless verbose
    if [ "${VERBOSE:-false}" = "true" ]; then
        print_color "$GREEN" "✓ All quick tests passed"
    fi
    exit 0
else
    print_color "$RED" "✗ $FAILED_TESTS test(s) failed"
    exit 1
fi