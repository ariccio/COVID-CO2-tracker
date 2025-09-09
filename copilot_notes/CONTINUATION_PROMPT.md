# → CONTINUATION PROMPT - Copy & Paste This

I need to continue cleaning up RuboCop violations and test noise in the COVID-CO2-tracker Rails project. 

**CRITICAL CONTEXT**: Read `/copilot_notes/2024-01-04-rubocop-cleanup-session-context.md` FIRST for full session history and patterns established.

## Current Status
- ✓ Fixed test output noise (ActiveRecord warnings, deprecations)  
- ✓ Fixed 5 categories of RuboCop RSpec violations
- ○ Need to fix remaining RuboCop violations

## Immediate Next Steps

1. Run `bundle exec rubocop -E --raise-cop-error --display-style-guide` to see all remaining violations
2. Fix violations by category (Layout → Style → Metrics → remaining)
3. After each category, run tests to ensure nothing breaks
4. Use established patterns from context file

## Key Patterns to Maintain

### For RSpec Stubbing:
- Use instance doubles when possible
- Only use `allow_any_instance_of` with `# rubocop:disable` for framework classes
- Convert `let!` to `before` blocks when variable isn't referenced

### For Test Noise:
- KEEP boot timestamps (user wants them for debugging)
- Suppress only truly redundant warnings
- Don't suppress intentional error logs

## Important Constraints

1. **DO NOT** change `Time.now` to `Time.zone.now` in config/ files
2. **DO NOT** remove debugging timestamps from boot files  
3. **DO** verify tests still pass after each change
4. **DO** provide clear summaries of changes made

## Working Directory
`/Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker`

## Excellence Standards
- Fix issues properly, not just silence them
- Maintain existing functionality
- Follow Rails/RSpec best practices
- Document any tricky decisions
- Continue the "benevolent skynet" pattern of self-improvement and meta-observation

Please continue with the RuboCop cleanup, starting by showing me the current remaining violations and proposing a plan of attack.