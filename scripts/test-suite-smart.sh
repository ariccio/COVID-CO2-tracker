#!/bin/bash
#
# Smart Test Suite for Claude Stop Hook
# Runs targeted tests based on modified files
#
# Usage: 
#   echo "file1.rb\nfile2.rb" | test-suite-smart.sh
#   
# The script reads modified files from stdin and determines
# which tests to run based on what was changed
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}" >&2
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    # echo -n "  ◇ $test_name... " >&2
    
    local output_file=$(mktemp)
    
    if eval "$test_command" > "$output_file" 2>&1; then
        # print_color "$GREEN" "✓"
        rm -f "$output_file"
        return 0
    else
        print_color "$RED" "✗"
        # Show limited error output
        if [ -s "$output_file" ]; then
            cat "$output_file" | head -10 | sed 's/^/    /' >&2
        fi
        rm -f "$output_file"
        return 1
    fi
}

# Read modified files from stdin
MODIFIED_FILES=""
if [ -p /dev/stdin ] || [ ! -t 0 ]; then
    MODIFIED_FILES=$(cat)
fi

# If no files provided, exit early
if [ -z "$MODIFIED_FILES" ]; then
    print_color "$YELLOW" "※ No modified files provided to smart test suite"
    exit 0
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# print_color "$CYAN" "Smart Test Selection"
# print_color "$CYAN" "────────────────────"
# echo ""
# print_color "$BLUE" "Analyzing modified files..."

# Initialize test sets
SPECS_TO_RUN=""
RUN_ALL_MODELS=false
RUN_ALL_REQUESTS=false
RUN_ALL_SERVICES=false
RUN_SECURITY=false
RUN_MIGRATIONS=false
MODIFIED_MODELS=""
MODIFIED_CONTROLLERS=""
MODIFIED_SERVICES=""

# Analyze each modified file
while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Skip non-Ruby files for spec selection
    case "$file" in
        *.md|*.txt|*.yml|*.json|*.css|*.scss|*.js|*.html|*.erb)
            # These don't need Ruby tests but might need other validation
            continue
            ;;
    esac
    
    # Categorize Ruby files
    case "$file" in
        app/models/*.rb)
            model_name=$(basename "$file" .rb)
            MODIFIED_MODELS="$MODIFIED_MODELS $model_name"
            # Add corresponding spec if it exists
            if [ -f "spec/models/${model_name}_spec.rb" ]; then
                SPECS_TO_RUN="$SPECS_TO_RUN spec/models/${model_name}_spec.rb"
            fi
            ;;
            
        app/controllers/*.rb)
            controller_name=$(basename "$file" .rb | sed 's/_controller$//')
            MODIFIED_CONTROLLERS="$MODIFIED_CONTROLLERS $controller_name"
            # Add corresponding request spec if it exists
            if [ -f "spec/requests/${controller_name}_spec.rb" ]; then
                SPECS_TO_RUN="$SPECS_TO_RUN spec/requests/${controller_name}_spec.rb"
            elif [ -f "spec/requests/${controller_name}_controller_spec.rb" ]; then
                SPECS_TO_RUN="$SPECS_TO_RUN spec/requests/${controller_name}_controller_spec.rb"
            fi
            RUN_SECURITY=true
            ;;
            
        app/services/*.rb)
            service_name=$(basename "$file" .rb)
            MODIFIED_SERVICES="$MODIFIED_SERVICES $service_name"
            # Add corresponding spec if it exists
            if [ -f "spec/services/${service_name}_spec.rb" ]; then
                SPECS_TO_RUN="$SPECS_TO_RUN spec/services/${service_name}_spec.rb"
            fi
            ;;
            
        config/*.rb|config/environments/*.rb)
            # Config changes need broader testing
            RUN_ALL_MODELS=true
            RUN_SECURITY=true
            print_color "$YELLOW" "  ⚠ Config file changed: $file"
            ;;
            
        db/migrate/*.rb)
            RUN_MIGRATIONS=true
            RUN_ALL_MODELS=true
            print_color "$YELLOW" "  ⚠ Migration changed: $file"
            ;;
            
        spec/*.rb)
            # If a spec file itself was modified, run it
            SPECS_TO_RUN="$SPECS_TO_RUN $file"
            ;;
            
        lib/*.rb)
            # Library changes might affect multiple areas
            RUN_ALL_MODELS=true
            RUN_ALL_SERVICES=true
            ;;
    esac
done <<< "$MODIFIED_FILES"

# Remove duplicates from specs to run
if [ -n "$SPECS_TO_RUN" ]; then
    SPECS_TO_RUN=$(echo "$SPECS_TO_RUN" | tr ' ' '\n' | sort -u | tr '\n' ' ')
fi

# echo ""
FAILED_TESTS=0

# Run migration checks if needed
if [ "$RUN_MIGRATIONS" = true ]; then
    print_color "$CYAN" "Database Checks:"
    if run_test "Migration status" "rails db:migrate:status | tail -5"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    if run_test "Test DB migrate" "RAILS_ENV=test rails db:migrate"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    # echo ""
fi

# Run broad test categories if needed
if [ "$RUN_ALL_MODELS" = true ]; then
    print_color "$CYAN" "Running all model specs (config/lib change detected):"
    if [ -d "spec/models" ]; then
        if run_test "All model specs" "bundle exec rspec spec/models/ --format progress --fail-fast"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    # echo ""
elif [ -n "$MODIFIED_MODELS" ]; then
    print_color "$CYAN" "Modified models:$MODIFIED_MODELS"
fi

if [ "$RUN_ALL_REQUESTS" = true ]; then
    print_color "$CYAN" "Running all request specs:"
    if [ -d "spec/requests" ]; then
        if run_test "All request specs" "bundle exec rspec spec/requests/ --format progress --fail-fast"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    # echo ""
elif [ -n "$MODIFIED_CONTROLLERS" ]; then
    print_color "$CYAN" "Modified controllers:$MODIFIED_CONTROLLERS"
fi

if [ "$RUN_ALL_SERVICES" = true ]; then
    print_color "$CYAN" "Running all service specs:"
    if [ -d "spec/services" ]; then
        if run_test "All service specs" "bundle exec rspec spec/services/ --format progress --fail-fast"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    # echo ""
elif [ -n "$MODIFIED_SERVICES" ]; then
    print_color "$CYAN" "Modified services:$MODIFIED_SERVICES"
fi

# Run security tests if needed
if [ "$RUN_SECURITY" = true ]; then
    print_color "$CYAN" "Security checks required:"
    if [ -d "spec/security" ]; then
        if run_test "Security specs" "bundle exec rspec spec/security/ --format progress"; then
            :
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    # echo ""
fi

# Run specific specs for modified files
if [ -n "$SPECS_TO_RUN" ]; then
    print_color "$CYAN" "Running targeted specs:"
    for spec in $SPECS_TO_RUN; do
        if [ -f "$spec" ]; then
            spec_name=$(basename "$spec")
            if run_test "$spec_name" "bundle exec rspec $spec --format progress"; then
                :
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    done
    # echo ""
fi

# If no specific tests were identified, run minimal smoke tests
if [ -z "$SPECS_TO_RUN" ] && [ "$RUN_ALL_MODELS" = false ] && [ "$RUN_ALL_REQUESTS" = false ] && [ "$RUN_ALL_SERVICES" = false ]; then
    print_color "$CYAN" "No specific tests identified, running smoke tests:"
    if run_test "Rails boot" "rails runner 'puts Rails.version'"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    if run_test "Routes valid" "rails routes --expanded | head -20 >/dev/null"; then
        :
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# Summary
# echo ""
print_color "$CYAN" "────────────────────"

if [ $FAILED_TESTS -eq 0 ]; then
    # print_color "$GREEN" "✓ All targeted tests passed"
    exit 0
else
    print_color "$RED" "✗ $FAILED_TESTS targeted test(s) failed"
    exit 1
fi