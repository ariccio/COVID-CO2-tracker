# RSpec Rake Task Early Exit Issue Analysis

## Problem Summary
When running RSpec tests, the rake task specs in `spec/lib/tasks/export_tokens_rake_spec.rb` cause the entire test suite to exit early after running only those 6 tests, even though 315 tests should run.

## Key Observations

### Test Discovery Behavior
1. **Dry run works correctly**: `bundle exec rspec --dry-run` finds all 315 tests
2. **Actual execution fails**: When actually running tests (not dry-run), only 6 rake task tests execute
3. **Exclude pattern works**: Using `--exclude-pattern spec/lib/tasks/**/*_spec.rb` runs 276 tests (all others)
4. **Direct directory specification works**: `bundle exec rspec spec/models spec/requests spec/services spec/security` runs correctly

### The Root Cause
The rake task specs are **actually invoking rake tasks** that prompt for user input via STDIN. Even though the specs mock STDIN with:
```ruby
allow(STDIN).to receive(:gets).and_return(...)
```

When RSpec runs these tests, the actual rake task code executes and shows prompts like:
```
Enter description for this token: 
Select expiration period:
  1. 30 days (default)
  2. 90 days
  3. 1 year
  4. Custom (enter days)
```

This interactive prompting interferes with RSpec's test runner, causing it to complete after the rake task specs without continuing to other tests.

## Secondary Issue: Connection Pool Timeout

When tests run WITHOUT the rake task specs (using exclude pattern), we see failures including:
- **ActiveRecord::ConnectionTimeoutError** in concurrent token generation test
- The test database has a pool of 5 connections (default)
- The concurrent test creates 5 threads, each needing a connection
- DatabaseCleaner or the test framework itself may be holding a connection

## Solutions

### Fix 1: Prevent Rake Task Execution During Tests
The rake task specs should not actually execute the rake tasks. Instead, they should:
1. Stub the task execution more thoroughly
2. Test the task logic in isolation
3. Use a different testing approach that doesn't invoke the actual tasks

### Fix 2: Increase Test Database Connection Pool
In `config/database.yml`, increase the test database connection pool:
```yaml
test:
  <<: *default
  pool: 10  # Increase from 5 to handle concurrent tests
```

### Fix 3: Improve STDIN Mocking
The current STDIN mocking may not be intercepting all input requests. Consider:
1. Stubbing at a deeper level
2. Using a test helper that prevents any actual I/O
3. Refactoring rake tasks to use dependency injection for input

## Immediate Workarounds

### Option 1: Skip Rake Task Specs
```bash
bundle exec rspec --exclude-pattern spec/lib/tasks/**/*_spec.rb
```

### Option 2: Run Rake Task Specs Separately
```bash
# Run main test suite
bundle exec rspec spec/models spec/requests spec/services spec/security

# Run rake task specs separately
bundle exec rspec spec/lib/tasks
```

### Option 3: Fix Test Ordering
Configure RSpec to run rake task specs last, or isolate them in a separate test run.

## Test Results Summary
- Full suite (when working): 315 examples total
- Without rake task specs: 276 examples, 14 failures
- Rake task specs alone: 6 examples, 0 failures (but causes early exit)

## Recommendations
1. **Immediate**: Use exclude pattern to run tests without rake task specs
2. **Short-term**: Increase database connection pool for tests
3. **Long-term**: Refactor rake task specs to not execute actual tasks