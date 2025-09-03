# Lefthook System Documentation

## What is Lefthook?

Lefthook is a fast and powerful Git hooks manager for Ruby projects. It allows you to run scripts automatically at various Git lifecycle events (pre-commit, pre-push, etc.) to maintain code quality and catch issues before they're committed or pushed.

## Configuration in COVID CO2 Tracker

The lefthook configuration is defined in `lefthook.yml` at the project root.

### Pre-Commit Hooks

Pre-commit hooks run automatically before each commit. They can be run manually with:
```bash
lefthook run pre-commit
```

The project has 3 pre-commit hooks configured to run in parallel:

#### 1. **test-backend** (Tag: backend)
- **Command**: `rspec ./spec`
- **Purpose**: Runs all RSpec tests in the `spec/` directory
- **When it runs**: Before every commit
- **What it checks**: Ensures all tests pass before allowing a commit

#### 2. **rubocop** (Tag: backend)
- **Command**: `bundle exec rubocop --fail-level E`
- **Purpose**: Runs RuboCop linter for Ruby code style and quality checks
- **Fail level**: Only fails on Error-level issues (not warnings)
- **What it checks**: 
  - Ruby syntax errors
  - Code style violations
  - Best practices
  - Potential bugs

#### 3. **brakeman** (Tag: security)
- **Command**: `bundle exec brakeman -w3 --no-progress --no-pager --skip-files node_modules/,/co2_client/,/co2_native_client/`
- **Purpose**: Security vulnerability scanner for Rails applications
- **Warning level**: -w3 (high confidence warnings only)
- **Excluded paths**: node_modules/, co2_client/, co2_native_client/
- **What it checks**: 
  - SQL injection vulnerabilities
  - Cross-site scripting (XSS)
  - Mass assignment issues
  - Other Rails security vulnerabilities

### Pre-Push Hooks

Pre-push hooks run before pushing to remote. They can be run manually with:
```bash
lefthook run pre-push
```

Current active pre-push hooks:

#### 1. **remind_i18next_typescript.rb** (Script)
- **Runner**: Ruby
- **Purpose**: Reminder script for i18next TypeScript considerations

#### 2. **test-e2e** (Tags: e2e, backend, frontend)
- **Command**: `yarn run ts-node utils/run_e2e.ts`
- **Purpose**: Runs end-to-end tests using TypeScript

### Commented Out Hooks

Several hooks are currently disabled but can be re-enabled:
- **Frontend linting** (`lint`)
- **Frontend tests** (`test-frontend`)
- **TODO checks** (`check-todos`)
- **Package audits** for security
- **Active Record Doctor** for database issues

## How to Use Lefthook

### Running All Hooks for a Stage
```bash
# Run all pre-commit hooks
lefthook run pre-commit

# Run all pre-push hooks
lefthook run pre-push

# Force run even if no changes (useful for testing)
lefthook run pre-commit --force

# Run with verbose output to see what's happening
lefthook run pre-commit --verbose
```

### Running Specific Hooks
```bash
# Run only tests
lefthook run pre-commit --commands test-backend

# Run only rubocop
lefthook run pre-commit --commands rubocop

# Run only security checks
lefthook run pre-commit --commands brakeman
```

### Skipping Hooks
```bash
# Commit without running hooks (use cautiously!)
git commit --no-verify -m "Emergency fix"

# Or set environment variable
LEFTHOOK=0 git commit -m "Skip hooks"
```

### Running Hooks by Tag
```bash
# Run only backend-related hooks
lefthook run pre-commit --tags backend

# Run only security-related hooks
lefthook run pre-commit --tags security
```

## Troubleshooting

### If Hooks Don't Run Automatically
1. Make sure lefthook is installed: `lefthook install`
2. Check if hooks are installed in `.git/hooks/`
3. Verify lefthook version: `lefthook version`

### If Tests or Linters Fail
1. Run the specific command manually to see detailed output
2. Fix the issues reported
3. Re-run the hook to verify fixes

### Performance Issues
- Hooks run in parallel by default (pre-commit)
- Pre-push hooks run sequentially (`parallel: false`)
- You can adjust parallelization in `lefthook.yml`

## Benefits of Using Lefthook

1. **Early Error Detection**: Catches issues before they reach the repository
2. **Consistent Code Quality**: Enforces style and quality standards automatically
3. **Security**: Brakeman catches security vulnerabilities before deployment
4. **Fast Feedback**: Parallel execution makes checks faster
5. **Flexible**: Can be bypassed when needed for emergencies

## Integration with CI/CD

While lefthook runs locally, the same checks typically run in CI/CD pipelines. This provides:
- **Double verification**: Local + CI checks
- **Faster development**: Catch issues locally before CI
- **Reduced CI failures**: Most issues caught before push

## For AI Agents

When working with this codebase:
1. Always run `lefthook run pre-commit --force` before committing major changes
2. Fix any rubocop or test failures before proceeding
3. Pay special attention to brakeman security warnings
4. Use `--verbose` flag to understand what each hook is doing
5. Document any new hooks added to lefthook.yml