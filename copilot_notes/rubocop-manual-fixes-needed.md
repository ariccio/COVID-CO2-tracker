# Rubocop Manual Fixes Documentation
Generated: 2025-09-03

## Summary
- **Initial offenses**: 670
- **After safe auto-corrections**: 544  
- **After unsafe auto-corrections**: 515
- **Remaining manual fixes needed**: 515

## Breakdown by Category

### RSpec-Related Offenses (489 total - 95% of remaining)

#### High Priority (Potential Test Quality Issues)
1. **RSpec/NoExpectationExample (32)** - Tests without assertions
   - These tests provide no value and should either be removed or have expectations added
   - Location: Various spec files
   - Action: Add meaningful expectations or remove empty tests

2. **RSpec/VerifiedDoubles (2)** - Using unverified test doubles
   - Can lead to tests passing when actual code would fail
   - Action: Use `instance_double`, `class_double`, or `object_double` instead of `double`

3. **RSpec/AnyInstance (12)** - Using `allow_any_instance_of`
   - Makes tests brittle and harder to understand
   - Action: Refactor to inject dependencies or use more specific stubs

#### Medium Priority (Code Organization)
1. **RSpec/ExampleLength (122)** - Tests exceeding 5 lines
   - Project default seems to be longer tests
   - Consider: Increasing limit in .rubocop.yml to 10-15 lines
   - Or: Breaking complex tests into smaller, focused examples

2. **RSpec/MultipleExpectations (100)** - Multiple expectations per test
   - Project style allows this for integration tests
   - Consider: Configuring to allow 2-3 expectations for integration tests

3. **RSpec/MultipleMemoizedHelpers (59)** - Too many let/let! declarations (>5)
   - Consider: Extracting to factories or helper methods
   - Or: Increase limit to 8-10 in .rubocop.yml

4. **RSpec/InstanceVariable (89)** - Using instance variables in tests
   - Replace with `let` declarations for better isolation

#### Low Priority (Style Preferences)
1. **RSpec/ContextWording (43)** - Context descriptions not starting with "when/with/without"
   - Pure style preference, consider disabling if team doesn't agree

2. **RSpec/NestedGroups (7)** - Deeply nested describe/context blocks
   - Consider flattening test structure

3. **RSpec/LetSetup (5)** - Using `let!` for setup
   - Consider using `before` blocks for clarity

4. **RSpec/IndexedLet (4)** - Using numbered let variables
   - Rename to be more descriptive

### Rails-Related Offenses (11 total)

#### High Priority (Potential Issues)
1. **Rails/SkipsModelValidations (4)** - Using `update_attribute` or similar
   - Can bypass important validations
   - Replace with `update!` or `update` as appropriate

2. **Rails/HasManyOrHasOneDependent (2)** - Missing dependent option
   - Add `:destroy`, `:delete_all`, or `:nullify` to prevent orphaned records

3. **Rails/UniqueValidationWithoutIndex (1)** - Uniqueness validation without DB index
   - Add database index to prevent race conditions

#### Low Priority
1. **Rails/I18nLocaleTexts (4)** - Hardcoded text that should be internationalized
   - Only needed if planning multi-language support

### Naming Offenses (19 total)

1. **Naming/VariableNumber (15)** - Variables with numbers (e.g., `var1`, `var2`)
   - Use more descriptive names

2. **Naming/VariableName (2)** - Variables not following convention
   - Follow Ruby naming conventions (snake_case)

3. **Naming/FileName (1)** - File name doesn't match class/module name
   - Rename file or class to match

4. **Naming/PredicateName (1)** - Predicate method name issue
   - Ensure boolean methods end with `?`

### Other Offenses (6 total)

1. **Bundler/DuplicatedGroup (1)** - Duplicate group in Gemfile
   - Merge duplicate groups

2. **Layout/TrailingWhitespace (1)** - Can be auto-fixed
   - Run `rubocop -a` again

3. **Lint/EmptyBlock (1)** - Empty block in code
   - Add implementation or remove

4. **Lint/MissingCopEnableDirective (1)** - Disabled cop never re-enabled
   - Re-enable or remove disable directive

5. **Lint/SuppressedException (1)** - Suppressed exception in rescue
   - Handle or log the exception

6. **Style/StringConcatenation (1)** - Using + for string concatenation
   - Use string interpolation instead

## Recommended .rubocop.yml Configurations

```yaml
# Add to .rubocop.yml to align with project style

RSpec/ExampleLength:
  Max: 15  # Current project uses longer integration tests

RSpec/MultipleExpectations:
  Max: 3  # Allow multiple expectations for integration tests
  Exclude:
    - 'spec/requests/**/*'  # Integration tests often need multiple assertions
    - 'spec/security/**/*'  # Security tests verify multiple conditions

RSpec/MultipleMemoizedHelpers:
  Max: 10  # Complex tests need more setup

RSpec/ContextWording:
  Enabled: false  # Team preference varies

RSpec/InstanceVariable:
  Exclude:
    - 'spec/requests/**/*'  # Sometimes needed for request specs

Naming/VariableNumber:
  CheckMethodNames: false  # Allow numbered methods for lists
  CheckSymbols: false

# Consider for complex legacy code
RSpec/NestedGroups:
  Max: 4  # Allow deeper nesting for complex scenarios
```

## Priority Order for Manual Fixes

### Must Fix (Potential Bugs/Issues)
1. RSpec/NoExpectationExample - Empty tests
2. Rails/SkipsModelValidations - Bypasses validations
3. Rails/HasManyOrHasOneDependent - Data integrity
4. Rails/UniqueValidationWithoutIndex - Race conditions
5. Lint/SuppressedException - Hidden errors

### Should Fix (Best Practices)
1. RSpec/VerifiedDoubles - Test reliability
2. RSpec/AnyInstance - Test clarity
3. RSpec/InstanceVariable - Test isolation
4. Naming violations - Code readability

### Consider Configuring (Style Preferences)
1. RSpec/ExampleLength - Configure to match team style
2. RSpec/MultipleExpectations - Allow for integration tests
3. RSpec/MultipleMemoizedHelpers - Increase limit
4. RSpec/ContextWording - Disable if not team standard

## Next Steps

1. **Immediate**: Fix the 1 remaining auto-correctable offense
2. **High Priority**: Address the "Must Fix" category (~40 offenses)
3. **Configuration**: Update .rubocop.yml with project-appropriate settings
4. **Team Discussion**: Review RSpec conventions with team
5. **Gradual**: Address remaining offenses over time during regular development

## Commands for Targeted Fixes

```bash
# Fix specific cops one at a time
bundle exec rubocop --only Rails/SkipsModelValidations -a
bundle exec rubocop --only Rails/HasManyOrHasOneDependent --auto-gen-config

# Generate todo file for gradual fixing
bundle exec rubocop --auto-gen-config --auto-gen-only-exclude

# Check specific directories
bundle exec rubocop spec/models/
bundle exec rubocop app/models/
```

## Estimated Effort
- Configuration changes: 30 minutes
- Must-fix issues: 2-3 hours
- Full remediation: 1-2 days
- Or: Add exclusions and fix gradually over time