#!/bin/bash
#
# Test Suite for Emoji Usage Checker
# Comprehensive tests for emoji detection and filtering
#

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="/tmp/emoji-checker-tests"
CHECKER="npx ts-node $SCRIPT_DIR/check-emoji-usage.ts"

# Source tty-colors library for TTY-aware output
source "${SCRIPT_DIR}/lib/tty-colors.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_color() {
    local color="$1"
    shift
    echo -e "${color}$*${NC}"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local expected_exit_code="$2"
    shift 2
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    print_color "$BLUE" "Test $TESTS_RUN: $test_name"
    
    set +e
    output=$($CHECKER "$@" 2>&1)
    actual_exit_code=$?
    set -e
    
    if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
        print_color "$GREEN" "  ✓ Passed (exit code: $actual_exit_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_color "$RED" "  ✗ Failed (expected: $expected_exit_code, got: $actual_exit_code)"
        echo "    Output: $output"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo
}

# Function to create a test file
create_test_file() {
    local filename="$1"
    local content="$2"
    echo "$content" > "$TEST_DIR/$filename"
}

# Clean up and create test directory
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

print_color "$YELLOW" "=========================================="
print_color "$YELLOW" "   Emoji Usage Checker Test Suite"
print_color "$YELLOW" "=========================================="
echo

# Test 1: Basic emoji detection in Ruby file
create_test_file "test1.rb" "# This is a comment with an emoji 😀
class User
  def welcome
    puts 'Welcome! 👋'
  end
end"

run_test "Basic emoji detection in Ruby file" 1 "$TEST_DIR/test1.rb" --threshold 1

# Test 2: Allowed symbols should pass
create_test_file "test2.rb" "# Using allowed symbols
# ✓ Success
# ✗ Error
# → Next step
# ⚠ Warning
# ◆ Important
class Validator
  def check
    puts '✓ All checks passed'
  end
end"

run_test "Allowed symbols should not trigger warning" 0 "$TEST_DIR/test2.rb"

# Test 3: Mixed emojis and allowed symbols
create_test_file "test3.sh" "#!/bin/bash
echo '✓ Starting deployment 🚀'
echo '→ Building application'
echo '✅ Build complete!'
echo '※ Note: Check logs'"

run_test "Mixed emojis and allowed symbols" 1 "$TEST_DIR/test3.sh" --threshold 1

# Test 4: Markdown with code blocks
create_test_file "test4.md" "# Documentation

This has an emoji in text 📝

\`\`\`ruby
# This emoji should be ignored 😀
puts 'Hello'
\`\`\`

More text with emoji 🎉"

run_test "Markdown filters code blocks" 1 "$TEST_DIR/test4.md" --threshold 1

# Test 5: Instruction file with emoji documentation
create_test_file "copilot-instructions.md" "# Instructions

## Emoji Replacement Guidelines
When replacing emojis, use these:
- \`📝\` → \`※\`
- \`✅\` → \`✓\`

## Other content
Regular text with emoji 🚨"

run_test "Instruction file filters emoji documentation" 1 "$TEST_DIR/copilot-instructions.md" --threshold 0

# Test 6: TypeScript file
create_test_file "test6.ts" "// TypeScript with emojis
function celebrate(): void {
  console.log('Party time! 🎉🎊');
  console.log('Success ✓');
}"

run_test "TypeScript file detection" 1 "$TEST_DIR/test6.ts" --threshold 1

# Test 7: JSON file
create_test_file "test7.json" '{
  "name": "Test Project 🚀",
  "description": "A test with emoji",
  "status": "✓ Active"
}'

run_test "JSON file detection" 1 "$TEST_DIR/test7.json" --threshold 0

# Test 8: Threshold testing
create_test_file "test8.rb" "# Multiple emojis
# 😀 😃 😄 😁
puts 'Test'"

run_test "Below threshold (3 emojis, threshold 5)" 0 "$TEST_DIR/test8.rb" --threshold 5
run_test "Above threshold (4 emojis, threshold 2)" 1 "$TEST_DIR/test8.rb" --threshold 2

# Test 9: Warning-only mode
create_test_file "test9.rb" "# Many emojis 😀😃😄😁😆"

run_test "Warning-only mode exits 0 even above threshold" 0 "$TEST_DIR/test9.rb" --threshold 1 --warning-only

# Test 10: Empty file
create_test_file "test10.rb" ""

run_test "Empty file should pass" 0 "$TEST_DIR/test10.rb"

# Test 11: File with only allowed symbols
create_test_file "test11.md" "# Status Indicators
✓ Complete
✗ Failed
→ In Progress
← Back
↑ Up
↓ Down
⚠ Warning
ℹ Information
★ Featured
◆ Important
● Bullet point
※ Note"

run_test "File with only allowed symbols" 0 "$TEST_DIR/test11.md"

# Test 12: YAML file
create_test_file "test12.yml" "name: Test
description: 'Deployment 🚀'
status: '✓ Active'
tags:
  - important ⚠
  - featured ★"

run_test "YAML file detection" 1 "$TEST_DIR/test12.yml" --threshold 0

# Print summary
print_color "$YELLOW" "=========================================="
print_color "$YELLOW" "   Test Results Summary"
print_color "$YELLOW" "=========================================="
echo
print_color "$BLUE" "Tests run: $TESTS_RUN"
print_color "$GREEN" "Tests passed: $TESTS_PASSED"
if [ "$TESTS_FAILED" -gt 0 ]; then
    print_color "$RED" "Tests failed: $TESTS_FAILED"
else
    print_color "$GREEN" "Tests failed: $TESTS_FAILED"
fi
echo

# Clean up
rm -rf "$TEST_DIR"

# Exit with appropriate code
if [ "$TESTS_FAILED" -gt 0 ]; then
    print_color "$RED" "✗ Test suite failed"
    exit 1
else
    print_color "$GREEN" "✓ All tests passed!"
    exit 0
fi