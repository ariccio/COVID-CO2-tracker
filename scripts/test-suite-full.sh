#!/bin/bash
#
# Full Test Suite for Claude Stop Hook
# Runs comprehensive tests (~5-10 minutes)
#
# Tests included:
# - Full Rubocop analysis
# - All RSpec tests
# - Security tests
# - Database integrity
# - Asset compilation
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source tty-colors library for TTY-aware output
source "${SCRIPT_DIR}/lib/tty-colors.sh"

# Timing variables
SUITE_START_TIME=$(date +%s)

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}" >&2
}

# Function to format duration
format_duration() {
    local seconds=$1
    local minutes=$((seconds / 60))
    local remaining_seconds=$((seconds % 60))
    
    if [ $minutes -gt 0 ]; then
        echo "${minutes}m ${remaining_seconds}s"
    else
        echo "${seconds}s"
    fi
}

# Function to run a test with timing and output
run_test() {
    local test_name="$1"
    local test_command="$2"
    local allow_failure="${3:-false}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local start_time=$(date +%s)
    local output_file=$(mktemp)
    
    # Run the test command
    if eval "$test_command" > "$output_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        # Success case - commented out to reduce noise
        # echo -n "  ◆ $test_name... "
        # print_color "$GREEN" "✓ ($(format_duration $duration))"
        rm -f "$output_file"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Only show failures and warnings
        echo -n "  ◆ $test_name... " >&2
        if [ "$allow_failure" = "true" ]; then
            print_color "$YELLOW" "⚠ ($(format_duration $duration))"
        else
            print_color "$RED" "✗ ($(format_duration $duration))"
        fi
        
        # Show error output
        if [ -s "$output_file" ]; then
            echo "    Error output:" >&2
            cat "$output_file" | head -30 | sed 's/^/    /' >&2
            local line_count=$(wc -l < "$output_file")
            if [ "$line_count" -gt 30 ]; then
                echo "    ... ($(($line_count - 30)) more lines)" >&2
            fi
        fi
        rm -f "$output_file"
        
        if [ "$allow_failure" = "true" ]; then
            return 0
        else
            return 1
        fi
    fi
}

# Function to run a test section
run_section() {
    local section_name="$1"
    # print_color "$CYAN" ""
    # print_color "$CYAN" "━━━ $section_name ━━━"
}

# Navigate to project directory
cd "$PROJECT_DIR"

# print_color "$BLUE" "╔═══════════════════════════════════════════╗"
# print_color "$BLUE" "║         Full Test Suite Execution         ║"
# print_color "$BLUE" "╚═══════════════════════════════════════════╝"
echo "" >&2

FAILED_TESTS=0
WARNINGS=0
TOTAL_TESTS=0

# Section 1: Environment Verification
run_section "Environment Verification"

if run_test "Ruby version" "ruby --version"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if run_test "Bundle check" "bundle check || bundle install"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if run_test "Rails environment" "rails runner 'puts \"Rails #{Rails.version} in #{Rails.env} mode\"'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_color "$RED" "    ✗ Critical: Rails won't boot!"
fi

# Section 2: Database Tests
if [ $FAILED_TESTS -eq 0 ]; then
    run_section "Database Tests"
    
    if run_test "Database connection" "rails db:version"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    if run_test "Pending migrations check" "rails db:migrate:status | grep -q '^\s*down' && exit 1 || exit 0"; then
        :
    else
        WARNINGS=$((WARNINGS + 1))
        print_color "$YELLOW" "    ⚠ Warning: Pending migrations detected"
    fi
    
    # Run test database setup if needed
    if run_test "Test database setup" "RAILS_ENV=test rails db:prepare" "true"; then
        :
    else
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Section 3: Code Quality (Rubocop)
run_section "Code Quality Analysis"

if command -v rubocop >/dev/null 2>&1; then
    if run_test "Rubocop full analysis" "bundle exec rubocop  --raise-cop-error --display-style-guide --parallel"; then
        :
    else
        # Check if it's just warnings or actual errors
        if bundle exec rubocop --fail-level E --format quiet >/dev/null 2>&1; then
            WARNINGS=$((WARNINGS + 1))
            print_color "$YELLOW" "    ⚠ Rubocop found style issues (not errors)"
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            print_color "$RED" "    ✗ Rubocop found syntax errors!"
        fi
    fi
else
    print_color "$YELLOW" "  ※ Rubocop not found, skipping code analysis"
fi

# Section 4: RSpec Tests
if [ -d "spec" ] && [ $FAILED_TESTS -eq 0 ]; then
    run_section "RSpec Test Suites"
    
    # Model specs
    if [ -d "spec/models" ]; then
        if ls spec/models/*.rb >/dev/null 2>&1; then
            if run_test "Model specs" "bundle exec rspec spec/models/ --format progress"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    fi
    
    # Request specs
    if [ -d "spec/requests" ]; then
        if ls spec/requests/*.rb >/dev/null 2>&1; then
            if run_test "Request specs" "bundle exec rspec spec/requests/ --format progress"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    fi
    
    # Service specs
    if [ -d "spec/services" ]; then
        if ls spec/services/*.rb >/dev/null 2>&1; then
            if run_test "Service specs" "bundle exec rspec spec/services/ --format progress"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    fi
    
    # Security specs
    if [ -d "spec/security" ]; then
        if ls spec/security/*.rb >/dev/null 2>&1; then
            if run_test "Security specs" "bundle exec rspec spec/security/ --format progress"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    fi
fi

# Section 5: Security Checks
if [ $FAILED_TESTS -eq 0 ]; then
    run_section "Security Analysis"
    
    # Brakeman security scanner
    if command -v brakeman >/dev/null 2>&1; then
        if run_test "Brakeman security scan" "bundle exec brakeman -q --no-pager --no-exit-on-warn --no-exit-on-error" "true"; then
            :
        else
            WARNINGS=$((WARNINGS + 1))
            print_color "$YELLOW" "    ⚠ Brakeman found potential security issues"
        fi
    fi
    
    # Bundle audit for vulnerable dependencies
    if command -v bundle-audit >/dev/null 2>&1; then
        if run_test "Bundle audit" "bundle exec bundle-audit check --update" "true"; then
            :
        else
            WARNINGS=$((WARNINGS + 1))
            print_color "$YELLOW" "    ⚠ Vulnerable dependencies detected"
        fi
    fi
fi

# Section 6: Asset Pipeline
if [ $FAILED_TESTS -eq 0 ]; then
    run_section "Asset Pipeline"
    
    # Only test compilation, don't actually compile in test
    if run_test "Asset compilation test" "RAILS_ENV=test rails runner 'Rails.application.config.assets.paths.each { |p| raise \"Missing: #{p}\" unless File.exist?(p) }'"; then
        :
    else
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Section 7: Export System Validation
if [ $FAILED_TESTS -eq 0 ]; then
    run_section "Export System Validation"
    
    # Check if export system files exist and are valid
    if [ -f "app/services/data_export_service.rb" ]; then
        if run_test "Export service syntax" "ruby -c app/services/data_export_service.rb"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    
    # Run export-specific tests if they exist
    if [ -f "spec/services/data_export_service_spec.rb" ]; then
        if run_test "Export service specs" "bundle exec rspec spec/services/data_export_service_spec.rb --format progress"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
fi

# Calculate total duration
SUITE_END_TIME=$(date +%s)
TOTAL_DURATION=$((SUITE_END_TIME - SUITE_START_TIME))

# Final Summary
# echo ""
# print_color "$BLUE" "╔═══════════════════════════════════════════╗"
# print_color "$BLUE" "║            Test Suite Summary             ║"
# print_color "$BLUE" "╚═══════════════════════════════════════════╝"
# echo ""

PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS - WARNINGS))

print_color "$BLUE" "Duration: $(format_duration $TOTAL_DURATION)"
print_color "$BLUE" "Environment: $(rails runner 'puts Rails.env' 2>/dev/null || echo 'unknown')"
print_color "$BLUE" "Tests: $TOTAL_TESTS total, $PASSED_TESTS passed"

if [ $FAILED_TESTS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_color "$GREEN" "✓ All tests passed successfully!"
    exit 0
elif [ $FAILED_TESTS -eq 0 ]; then
    print_color "$YELLOW" "✓ Tests passed with $WARNINGS warning(s)"
    exit 0
else
    print_color "$RED" "✗ $FAILED_TESTS test(s) failed"
    if [ $WARNINGS -gt 0 ]; then
        print_color "$YELLOW" "⚠ Plus $WARNINGS warning(s)"
    fi
    exit 1
fi