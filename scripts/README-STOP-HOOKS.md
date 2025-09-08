# Claude Stop Hook Test System

## Overview
The Claude stop hook automatically runs tests after Claude Code completes work on your codebase. This ensures code quality and catches issues immediately.

## Components

### 1. Main Stop Hook (`claude-stop-hook.sh`)
- Entry point called by Claude Code when a session ends
- Determines which tests to run based on modified files
- Manages test execution with timeouts
- Generates session summary reports

### 2. Test Suites

#### Quick Tests (`test-suite-quick.sh`)
- **Duration**: ~1 minute
- **Purpose**: Fast feedback for basic validation
- **Tests**:
  - Rubocop syntax errors
  - Rails boot verification
  - Database connectivity
  - Migration status
  - Asset pipeline check

#### Smart Tests (`test-suite-smart.sh`)
- **Duration**: Variable (2-5 minutes)
- **Purpose**: Targeted testing based on changes
- **Tests**: Runs specific specs for modified files
- **Usage**: Automatically selected when Ruby files are modified

#### Full Tests (`test-suite-full.sh`)
- **Duration**: 5-10 minutes
- **Purpose**: Comprehensive validation
- **Tests**:
  - Full Rubocop analysis
  - All RSpec suites
  - Security scans (Brakeman)
  - Database integrity
  - Export system validation

## Configuration

### Environment Variables
- `SKIP_CLAUDE_TESTS=true` - Skip all tests
- `CLAUDE_TEST_LEVEL` - Force test level: "quick", "smart", "full", or "none"

### Test Level Selection (Automatic)
The system automatically selects the appropriate test level based on file types:

#### Quick Tests
- No changes detected
- Only documentation files (`.md`, `.txt`)
- Only asset files (`.css`, `.scss`, images)

#### Smart Tests (Targeted)
- **Ruby files only** (`.rb`) - Runs specific specs for modified files
- **Test files only** (`spec/*.rb`) - Runs those specific tests

#### Full Tests (E2E)
- **Cross-stack changes** - Both Ruby (`.rb`) AND frontend (`.js`, `.ts`, `.tsx`) files
- **Frontend changes** - Any TypeScript (`.ts`, `.tsx`) or JavaScript (`.js`, `.jsx`) files
- **Config changes** - Files in `config/` directory
- **Database migrations** - Files in `db/migrate/`
- **Infrastructure changes** - Any system configuration

#### Manual Override
Set `CLAUDE_TEST_LEVEL` to force a specific level:
- `export CLAUDE_TEST_LEVEL=quick` - Always quick tests
- `export CLAUDE_TEST_LEVEL=smart` - Always smart tests  
- `export CLAUDE_TEST_LEVEL=full` - Always full E2E tests
- `export CLAUDE_TEST_LEVEL=none` - Skip all tests

## Usage

### Manual Testing
```bash
# Run quick tests
./scripts/test-suite-quick.sh

# Run smart tests with file list
echo -e "app/models/user.rb\\napp/controllers/api_controller.rb" | ./scripts/test-suite-smart.sh

# Run full test suite
./scripts/test-suite-full.sh

# Test the stop hook manually
echo '{"session_id": "test-123"}' | ./scripts/claude-stop-hook.sh
```

### Disable/Enable Stop Hook
To temporarily disable:
```bash
export SKIP_CLAUDE_TESTS=true
```

To force a specific test level:
```bash
export CLAUDE_TEST_LEVEL=full  # Always run full tests
export CLAUDE_TEST_LEVEL=none  # Never run tests
```

## Session Integration
The stop hook integrates with the session tracking system:
- Reads modified files from session tracker
- Falls back to git status if no session data
- Cleans up session data after tests
- Saves summary to `/tmp/claude-session-{id}-summary.txt`

## Test Results
- **Success**: Green checkmarks, exit code 0
- **Warnings**: Yellow warnings, still passes
- **Failures**: Red X marks, but doesn't block Claude Code
- **Summary**: Saved to temp file for review

## Troubleshooting

### Tests not running
1. Check if `SKIP_CLAUDE_TESTS` is set
2. Verify scripts are executable: `chmod +x scripts/*.sh`
3. Check `.claude/settings.local.json` has stop hook configured

### Tests timing out
- Adjust timeout in `claude-stop-hook.sh` (default 10 minutes)
- Use `CLAUDE_TEST_LEVEL=quick` for faster feedback

### False positives
- Migration warnings can be ignored if intentional
- Rubocop style issues (yellow) don't fail tests
- Security warnings from Brakeman are informational

## Implementation Notes
- Tests run with `set -euo pipefail` for strict error handling
- Each test has a 10-second timeout to prevent hanging
- Output is captured and only shown on failure
- Colors are used for better readability
- Session data is properly cleaned up after tests