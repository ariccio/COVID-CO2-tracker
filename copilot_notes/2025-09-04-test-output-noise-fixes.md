# Test Output Noise Fixes
Date: 2025-09-04
Author: Claude Code

## Problem
The test output was extremely noisy with:
1. StringScanner warnings about already initialized constants
2. Rails.application.secrets deprecation warnings
3. "Including..." messages for each support file
4. Error logs and stack traces from intentional test errors
5. Excessive output making it hard to see actual test results

## Solutions Applied

### 1. Fixed "Including..." Messages
**File**: `spec/rails_helper.rb`
- Removed the `puts("Including #{f}...")` statement when loading support files
- Now loads files silently

### 2. Created Warning Suppression System
**File**: `spec/support/suppress_warnings.rb` (NEW)
- Suppresses StringScanner duplicate constant warnings
- Attempts to suppress Rails.application.secrets deprecation (partial success)
- Loaded FIRST before other support files to prevent noise during initialization

### 3. Silenced Deprecation Warnings in Test Environment
**File**: `config/environments/test.rb`
- Changed `config.active_support.deprecation` from `:stderr` to `:silence`
- Added option to show deprecations with `SHOW_DEPRECATIONS=1` environment variable if needed

### 4. Enhanced Log Suppression Helper
**File**: `spec/support/log_suppression_helper.rb`
- Added ability to suppress stderr output for tests with intentional errors
- Enhanced the `:suppress_error_logs` tag to capture and discard error output
- Added `suppress_all_output` method for complete output suppression

### 5. Tagged Security Tests with Error Suppression
**File**: `spec/security/export_system_security_spec.rb`
- Added `:suppress_error_logs` tag to describe blocks that intentionally trigger errors:
  - SQL Injection Tests
  - Integration Security Tests
  - Additional Security Hardening Tests

## Results

### Before (sample):
```
/Users/alexanderriccio/.rbenv/versions/3.2.2/lib/ruby/gems/3.2.0/gems/strscan-3.1.0/lib/strscan.bundle: warning: already initialized constant StringScanner::Version
/Users/alexanderriccio/.rbenv/versions/3.2.2/lib/ruby/gems/3.2.0/gems/strscan-3.1.0/lib/strscan.bundle: warning: already initialized constant StringScanner::Id
DEPRECATION WARNING: `Rails.application.secrets` is deprecated...
Including /Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker/spec/support/cors_test_helper.rb...
Including /Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker/spec/support/log_suppression_helper.rb...
E, [2025-09-03T23:57:56.471535 #93225] ERROR -- : {"event":"export_failed"...
[Multiple pages of stack traces]
```

### After:
```
...................

Finished in 1.47 seconds (files took 1.52 seconds to load)
19 examples, 0 failures
```

## Testing Commands

Run individual specs:
```bash
bundle exec rspec spec/requests/api/v1/exports_spec.rb --format progress
```

Run security specs:
```bash
bundle exec rspec spec/security/export_system_security_spec.rb --format progress
```

Run full test suite:
```bash
bundle exec rspec --format progress
```

Run pre-commit hook:
```bash
lefthook run pre-commit
```

## Environment Variables

- `SHOW_DEPRECATIONS=1` - Show deprecation warnings if needed for debugging
- `SUPPRESS_ALL_OUTPUT=1` - Suppress all stdout/stderr in tests (use with caution)

## Notes

1. The StringScanner warning might still appear in some edge cases but is mostly suppressed
2. The Rails.application.secrets deprecation is fully suppressed in test output
3. Error logs from intentional test errors are now properly suppressed
4. The test output is now clean and shows only what's necessary:
   - Test progress indicators (dots)
   - Final summary
   - Actual test failures (when they occur)
   - Pending tests

## Verification

The fixes have been tested and verified to work with:
- Individual spec files
- Full test suite
- Pre-commit hooks via lefthook

The test output is now clean and professional, making it much easier to spot actual issues.