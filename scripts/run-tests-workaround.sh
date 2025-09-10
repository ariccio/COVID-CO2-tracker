#!/bin/bash

# Temporary workaround script for RSpec test suite issues
# Created: 2025-09-10
# Issue: Rake task specs cause early exit; connection pool timeouts

echo "================================"
echo "Running RSpec Test Suite with Workarounds"
echo "================================"
echo ""
echo "This script works around two issues:"
echo "1. Rake task specs causing early test suite exit"
echo "2. Database connection pool timeouts in concurrent tests"
echo ""

# Set higher connection pool for tests
export RAILS_MAX_THREADS=10

echo "→ Running main test suite (excluding problematic rake task specs)..."
echo ""

bundle exec rspec \
  --exclude-pattern "spec/lib/tasks/**/*_spec.rb" \
  --format progress \
  --format documentation --out tmp/rspec_results.txt

MAIN_EXIT_CODE=$?

echo ""
echo "→ Running rake task specs separately..."
echo ""

bundle exec rspec spec/lib/tasks/export_tokens_rake_spec.rb \
  --format progress

RAKE_EXIT_CODE=$?

echo ""
echo "================================"
echo "Test Results Summary"
echo "================================"
echo "Main suite exit code: $MAIN_EXIT_CODE"
echo "Rake specs exit code: $RAKE_EXIT_CODE"

# Show failure summary if any
if [ $MAIN_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "Main suite failures:"
  grep -A 20 "Failed examples:" tmp/rspec_results.txt || true
fi

# Return non-zero if either suite failed
if [ $MAIN_EXIT_CODE -ne 0 ] || [ $RAKE_EXIT_CODE -ne 0 ]; then
  exit 1
fi

echo ""
echo "✓ All tests passed!"
exit 0