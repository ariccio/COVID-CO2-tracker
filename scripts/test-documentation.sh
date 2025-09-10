#!/bin/bash
# Documentation Testing Script
# Tests that documentation includes concrete, actionable examples

echo "🔍 Documentation Completeness Checker" >&2

# Check for concrete values in configuration docs
check_concrete_examples() {
    local file=$1
    echo "Checking $file for concrete examples..." >&2
    
    # Look for patterns that suggest missing concrete values
    if grep -q "string)" "$file" && ! grep -q "exactly\|must match\|Available.*:" "$file"; then
        echo "⚠️  WARNING: Parameters documented but no exact values shown" >&2
    fi
    
    # Check for project names specifically
    if grep -q "project_name" "$file" && ! grep -q "covid-co2-tracker\|deedee-prototype" "$file"; then
        echo "⚠️  WARNING: project_name mentioned but no actual project names listed" >&2
    fi
}

# Test for "Day 2" problems - what happens after setup
check_day_two_problems() {
    local file=$1
    echo "Checking for Day 2 problem coverage..." >&2
    
    if ! grep -q "restart\|RESTART" "$file"; then
        echo "⚠️  WARNING: No restart instructions found" >&2
    fi
    
    if ! grep -q "test\|verify\|confirm" "$file"; then
        echo "⚠️  WARNING: No verification steps provided" >&2
    fi
}

# Run checks on all guide files
for guide in copilot_notes/*guide*.md; do
    if [ -f "$guide" ]; then
        check_concrete_examples "$guide"
        check_day_two_problems "$guide"
    fi
done

echo "✅ Documentation check complete" >&2