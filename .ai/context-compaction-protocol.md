# Context Compaction and Continuation Prompts for Rails Projects

**Your goal in a continuation prompt**: Preserve your maximum reasoning ability, details, focus, intelligence, and goal-directed abilities across context compaction by generating copy-and-pasteable prompts, notes on disk with ALL relevant thoughts, reasoning, context, state, and anything else necessary to seamlessly continue. Treat this task as if you will instantiate an entirely new session of a separate agentic coding system instead of simply compacting the context.

## When Approaching Context Limits in Rails Work

### Context Limit Indicators
**Watch for these signs**:
- Token count approaching 150,000/200,000 (75% threshold)
- Response latency increasing noticeably
- Claude Code warning about context limits
- Complex refactoring spanning 50+ lines across multiple files
- Multi-phase implementation requiring 2+ hours of work

**If you're working on complex Rails tasks and approaching context limits**:

### Step 1: Save ALL State to copilot_notes/continuation_prompts/

Create highly descriptive filename using namespacing-style-patterns for extra discoverability:

```ruby
# Rails-specific continuation prompt naming pattern
state_filename = "copilot_notes/continuation_prompts/rails_#{feature}_#{phase}_#{branch_name}_state.md"

# Examples:
# "copilot_notes/continuation_prompts/rails_export_system_streaming_refactor_phase2_export_optimization_state.md"
# "copilot_notes/continuation_prompts/rails_controller_complexity_reduction_measurements_controller_state.md"
# "copilot_notes/continuation_prompts/rails_activerecord_n_plus_one_elimination_measurements_model_state.md"
```

**Filename structure**:
- `rails_` prefix (identifies Rails work)
- `{feature}` (export_system, authentication, measurements, venues)
- `{phase}` (refactor, migration, testing, optimization)
- `{specific_area}` (streaming, controller, model, service)
- `_state.md` suffix

### Step 2: Create Continuation Prompt for Next Session

**Format**: Copy-pasteable prompt that next agent can use immediately

```text
Continue Rails refactoring from stage 2.

**Previous state saved in**: copilot_notes/continuation_prompts/rails_export_system_streaming_refactor_phase2_state.md
**Previous session continuation notes**: copilot_notes/continuation_prompts/rails_export_system_streaming_continuation_prompt.md
**Branch**: feature/export-streaming-optimization
**Current file**: app/services/export_service.rb:156-247

**Next task**: Extract remaining service objects starting from line 247:
- Extract rate limiting logic to RateLimiter module
- Extract format conversion to FormatConverter service
- Extract error handling to ExportErrorHandler module

**Context from previous session**:
- Extracted streaming logic to StreamingExporter (lines 156-200)
- Created module methods with explicit parameters (no instance variables)
- All tests passing for extracted sections
- Rubocop ABC complexity reduced from 45 to 22

**Requirements**:
- Continue using module methods, not instance methods
- Keep explicit parameters (embrace many parameters over hidden dependencies)
- Test each extraction with bundle exec rspec spec/services/
- Maintain current error bubbling pattern
- Update ExportService to use new modules

**Critical gotchas to remember**:
- Don't use Time.zone in service modules (they may run during initialization)
- Keep background job coordination explicit (Sidekiq priority)
- Export tokens must be scoped to user (security concern)

**Load these references first**:
✓ .ai/rails-specific-patterns.md (module methods, service objects)
✓ .ai/export-system-deep-dive.md (rate limiting, error handling patterns)
✓ copilot_notes/export-system-implementation.md (current architecture)
```

### Step 3: Track What References Were Useful

**Document for next session** (prevents re-loading irrelevant content):

```markdown
## Reference Utility Assessment

**Highly useful** (load immediately):
- ✓ `.ai/rails-specific-patterns.md` - Module method patterns essential for refactoring
- ✓ `copilot_notes/export-system-implementation.md` - Understood current architecture
- ✓ `app/services/export_service.rb` - The file being refactored
- ✓ `spec/services/export_service_spec.rb` - Test patterns for extracted modules
- ✓ `.rubocop.yml` - ABC complexity rules, exclusions

**Moderately useful** (load if needed):
- ✓ `app/models/export.rb` - Model relationships for service
- ✓ `app/jobs/export_worker.rb` - Background job coordination
- ○ `copilot_notes/HEROKU-COMPLETE-GUIDE.md` - Memory optimization context

**Not useful for this task** (skip):
- ✗ `README.md` - No technical details for refactoring
- ✗ `.ai/heroku-operations-overflow.md` - Not relevant to refactoring
- ✗ `docs/getting-started.md` - Too general
- ✗ Historical archive docs - Not relevant to current work

**New references discovered**:
- ✓ `copilot_notes/time-zone-ping-pong-analysis.md` - Critical! Explains why Time.zone causes issues in services
- ✓ `app/services/streaming_exporter.rb` - Example of module method pattern done correctly
```

## Rails-Specific State Preservation Patterns

### Pattern 1: Controller Refactoring State

**When**: Breaking down complex controller action into service objects

**State file structure**:
```markdown
# Rails Controller Refactoring State

## Context
- File: app/controllers/exports_controller.rb
- Action: #create (lines 45-127, 82 lines)
- Issue: Rubocop ABC complexity 38/30, PerceivedComplexity 22/15
- Goal: Extract to service objects with explicit parameters

## Completed
- [x] Extracted parameter validation to ExportParamsValidator (lines 45-62)
- [x] Extracted authorization to ExportAuthorizer (lines 63-71)
- [x] Created ExportCreator service skeleton (lines 72-85)
- [x] Tests passing for ExportParamsValidator
- [x] Tests passing for ExportAuthorizer

## Current State (line 85)
Working on ExportCreator.create method:
- Need to extract format conversion logic
- Need to extract background job scheduling
- Need to extract response rendering

## Remaining Work
- [ ] Extract format conversion to FormatConverter.convert (lines 86-102)
- [ ] Extract job scheduling to ExportJobScheduler.schedule (lines 103-115)
- [ ] Extract response rendering to ExportResponseRenderer.render (lines 116-127)
- [ ] Update controller to use all services
- [ ] Run full test suite
- [ ] Run Rubocop to verify complexity reduction

## Service Object Pattern
Using module methods with explicit parameters (from .ai/rails-specific-patterns.md):

def self.convert(data:, format:, user:, options: {})
  # Explicit parameters, no instance variables
  # Fail-fast with specific error messages
  # Return result or raise exception
end


## Test Pattern
Using RSpec with let blocks for setup:

describe ExportParamsValidator do
  let(:params) { { format: 'csv', filters: { start_date: '2025-01-01' } } }
  let(:user) { create(:user) }

  describe '.validate' do
    context 'with valid parameters' do
      it 'returns validated parameters' do
        result = described_class.validate(params: params, user: user)
        expect(result[:format]).to eq('csv')
      end
    end
  end
end


## Critical Gotchas Remembered
- Don't use helper instance methods (extract to module methods instead)
- Keep parameters explicit (don't hide dependencies)
- Fail-fast with specific error messages
- Bubble errors up to controller
- No silent failures (no default return values on error)

## References Loaded
- .ai/rails-specific-patterns.md (service object pattern)
- .ai/rails-specific-patterns.md (testing patterns)
- app/controllers/exports_controller.rb (current state)
- spec/controllers/exports_controller_spec.rb (test patterns)
```

### Pattern 2: ActiveRecord Query Optimization State

**When**: Eliminating N+1 queries, optimizing eager loading

**State file structure**:
```markdown
# Rails ActiveRecord N+1 Elimination State

## Context
- Model: app/models/measurement.rb
- Issue: N+1 queries in #with_venue_details scope
- Query: Measurement.with_venue_details.includes(?)
- Impact: 500+ queries on leaderboard page, 3s load time

## Completed
- [x] Identified N+1 with bullet gem output
- [x] Analyzed query patterns with rails console
- [x] Created test fixture with 100 measurements
- [x] Baseline: 523 queries, 3.2s load time

## Current State
Working on eager loading strategy:
- measurements → venues → users (nested associations)
- measurements → co2_readings (has_many)
- Need to optimize without over-fetching

## Investigation Results
Tried includes(:venue) - still N+1 for venue.user
Tried includes(venue: :user) - works but loads all venue data
Tried joins(:venue) - works for filtering but doesn't eager load

**Correct pattern** (from .ai/rails-specific-patterns.md):
measurements.includes(venue: [:user, :place]).preload(:co2_readings)


## Remaining Work
- [ ] Apply includes(venue: [:user, :place]).preload(:co2_readings)
- [ ] Test with bullet gem
- [ ] Benchmark query count and time
- [ ] Update with_venue_details scope definition
- [ ] Update leaderboard controller to use optimized scope
- [ ] Run spec/models/measurement_spec.rb
- [ ] Verify no new N+1 queries introduced

## Query Analysis
Before: 523 queries, 3.2s
SELECT "measurements".* FROM "measurements" -- 1 query
SELECT "venues".* FROM "venues" WHERE "venues"."id" = ? -- 100 queries (N+1)
SELECT "users".* FROM "users" WHERE "users"."id" = ? -- 100 queries (N+1)
SELECT "co2_readings".* FROM "co2_readings" WHERE ... -- 200 queries (N+1)

After (expected): 4 queries, <500ms
SELECT "measurements".* FROM "measurements"
SELECT "venues".* FROM "venues" WHERE "venues"."id" IN (...)
SELECT "users".* FROM "users" WHERE "users"."id" IN (...)
SELECT "co2_readings".* FROM "co2_readings" WHERE "co2_readings"."measurement_id" IN (...)


## Critical Gotchas Remembered
- includes for eager loading associations
- preload for separate queries (better for has_many with large datasets)
- joins for filtering only (doesn't eager load)
- Don't over-eager-load (balance memory vs query count)

## References Loaded
- .ai/rails-specific-patterns.md (eager loading patterns)
- app/models/measurement.rb (current model)
- app/models/venue.rb (association structure)
- spec/models/measurement_spec.rb (test patterns)
- Bullet gem output (N+1 detection)
```

### Pattern 3: Migration State

**When**: Complex multi-step migration, need to preserve rollback strategy

**State file structure**:
```markdown
# Rails Migration State - Add Export Versioning

## Context
- Migration: db/migrate/20251017_add_export_versioning.rb
- Goal: Add versioning to exports table for audit trail
- Complexity: Need to migrate existing exports to v1, preserve data

## Completed
- [x] Created migration file
- [x] Added version column (integer, default 1, not null)
- [x] Added data migration for existing exports (set version = 1)
- [x] Tested migration up with sample data
- [x] Verified data integrity

## Current State
Working on rollback safety:
- Need to verify down migration doesn't lose data
- Need to test with production-like data volume
- Need to document migration order for zero-downtime deploy

## Migration Code
ruby
class AddExportVersioning < ActiveRecord::Migration[7.0]
  def up
    add_column :exports, :version, :integer, default: 1, not null: false

    # Data migration for existing exports
    reversible do |dir|
      dir.up do
        Export.where(version: nil).update_all(version: 1)
      end
    end

    change_column_null :exports, :version, false
  end

  def down
    remove_column :exports, :version
  end
end


## Remaining Work
- [ ] Test rollback with db:rollback
- [ ] Verify data preserved after rollback
- [ ] Update Export model with version validation
- [ ] Add index on version column if querying by version
- [ ] Update export specs to include version
- [ ] Document deployment order in HEROKU-COMPLETE-GUIDE.md

## Zero-Downtime Deploy Strategy
1. Deploy migration (add column with default)
2. Run migration (db:migrate)
3. Verify old code still works (column has default)
4. Deploy new code (uses version column)
5. No downtime (column nullable during transition)

## Critical Gotchas Remembered
- Use reversible block for data migrations
- Add column with default first, then change_column_null
- Test rollback (down migration)
- Consider zero-downtime deploy order
- Add index if querying by new column

## References Loaded
- .ai/rails-specific-patterns.md (migration safety)
- .ai/heroku-operations-overflow.md (zero-downtime deploy)
- db/schema.rb (current schema)
- app/models/export.rb (model validations)
```

## Complex Task Context Management (The Plan For)

### When You're Generating a Response That Will Exceed Context Capacity

**Before context window fills**, you MUST:

1. **Commit to continuation_prompts/ ALL relevant contextual information**:
   - Important reasoning/thinking tokens
   - Planning thoughts and mental checklists
   - Concrete plan/checklist text
   - Original prompt inputs
   - Current state of work
   - Files modified so far
   - Tests passing/failing
   - Rubocop results
   - Critical discoveries or gotchas

2. **Be careful not to fill context window BEFORE you're done saving state**:
   - Switch to thinking in mental checklists if necessary
   - Prioritize state preservation over completing current task
   - Save state incrementally if needed

3. **Emit a prompt for next agent**:
   - Copy-pasteable
   - Includes all context from state file
   - Clear next steps
   - References to load
   - Critical gotchas to remember

4. **If one iteration unlikely to be enough**:
   - Break task down into individual prompts
   - Create chained prompts (manual or automatic)
   - Guide the next agent like driving a car
   - Update state file with progress at each iteration

## Rails-Specific Continuation Checklist

**Before creating continuation prompt, verify state file includes**:

**Code State**:
- [ ] Current file and line number
- [ ] Branch name
- [ ] Files modified (list)
- [ ] Current method or class being worked on
- [ ] Completed extractions/refactorings
- [ ] Remaining work (specific line ranges)

**Test State**:
- [ ] Tests passing (which specs)
- [ ] Tests failing (which specs, why)
- [ ] Test patterns being used
- [ ] Fixtures or factories needed

**Rails Environment State**:
- [ ] Rubocop results (ABC, complexity metrics)
- [ ] Rails version and relevant gems
- [ ] Database schema changes
- [ ] Migration status (if applicable)

**Critical Gotchas**:
- [ ] Time.zone issues discovered
- [ ] N+1 queries found and fixed
- [ ] Background job coordination notes
- [ ] Security concerns (authorization, params)

**References**:
- [ ] Which .ai/ files were useful
- [ ] Which copilot_notes/ files were useful
- [ ] Which model/controller/service files to load
- [ ] Which specs to reference for patterns

**Next Steps**:
- [ ] Concrete next task (specific file and line)
- [ ] Expected complexity (time estimate)
- [ ] Load order for references
- [ ] Testing strategy

## Token Budgeting for Continuation

**Estimate tokens needed for next session**:

**Minimal continuation** (simple task, <30 min):
- State file: ~1000 tokens
- References: ~2000 tokens (1-2 .ai/ files)
- Code files: ~1000 tokens (1-2 files)
- **Total**: ~4000 tokens

**Standard continuation** (moderate task, 30-60 min):
- State file: ~2000 tokens
- References: ~5000 tokens (2-3 .ai/ files + copilot_notes/)
- Code files: ~3000 tokens (3-5 files)
- **Total**: ~10,000 tokens

**Complex continuation** (large task, 1-2 hours):
- State file: ~3000 tokens
- References: ~10,000 tokens (3-4 .ai/ files + comprehensive guides)
- Code files: ~7000 tokens (5-10 files)
- **Total**: ~20,000 tokens

**Document token budget in continuation prompt** so next agent knows what to load.

## Continuation Prompt Template for Rails Work

```markdown
# Continuation Prompt: [Feature Name] - [Phase]

**Session**: [Session number or ID]
**Previous State**: copilot_notes/continuation_prompts/[state_filename].md
**Branch**: [branch_name]
**Estimated Tokens Needed**: [X]k tokens

## Quick Context
[2-3 sentences summarizing what you were doing]

## Current State
- **File**: [file_path]:[line_number]
- **Task**: [specific task description]
- **Progress**: [X% complete, or specific metrics]
- **Tests**: [passing/failing status]
- **Rubocop**: [complexity metrics]

## Completed Last Session
- [x] [Specific completed task 1]
- [x] [Specific completed task 2]
- [x] [Specific completed task 3]

## Next Tasks (Priority Order)
1. [ ] [Next immediate task with file:line]
2. [ ] [Following task]
3. [ ] [Final task]

## Load These References First (~[X]k tokens)
**Critical** (load immediately):
- [file_path] - [why it's critical]
- [.ai/file.md] - [specific section needed]

**If needed**:
- [file_path] - [when you'll need this]

**Skip**:
- [file_path] - [why not needed]

## Critical Gotchas to Remember
⚠ [Gotcha 1 - specific technical issue]
⚠ [Gotcha 2 - pattern to avoid]
✓ [Pattern that works well]

## Testing Strategy
1. [Test command 1]
2. [Test command 2]
3. [Final verification]

## Success Criteria
- [ ] [Specific measurable criterion 1]
- [ ] [Specific measurable criterion 2]
- [ ] [Final verification criterion]

---
**Token budget**: [X]k tokens
**Estimated time**: [X] minutes
**Complexity**: [low/medium/high]
```

## Best Practices for Seamless Continuation

### DO:
✓ Save state early (at 140k tokens, not 190k)
✓ Include specific line numbers
✓ Document what references were actually useful
✓ Preserve reasoning tokens (why decisions were made)
✓ Include Rubocop and test results
✓ Specify branch name
✓ List completed work explicitly
✓ Prioritize next tasks clearly
✓ Estimate token budget for next session

### DON'T:
✗ Wait until context is completely full
✗ Use vague descriptions ("refactor the controller")
✗ Forget to include test status
✗ Omit critical gotchas discovered
✗ Leave out file paths and line numbers
✗ Forget branch name
✗ Mix multiple unrelated tasks
✗ Skip reference utility assessment

## Rails-Specific Token Savers

**Instead of loading entire files**:
- Load specific methods with line ranges
- Reference file paths, let next agent read only what's needed
- Use Glob to find files, not load them all

**Instead of loading all .ai/ files**:
- Load sections of .ai/ files (they're well-structured)
- Reference tier system (Tier 1 → 2 → 3 as needed)
- Skip comprehensive docs unless specifically needed

**Instead of re-reading context**:
- State file should distill all relevant context
- Next agent trusts state file, doesn't re-derive
- Include reasoning tokens in state file

## Emergency Context Compaction

**If context fills unexpectedly** (rare but possible):

1. **Immediate**: Save current file edits to disk
2. **Quick state dump**: Create bare-minimum state file with:
   - Current file and line
   - Completed work
   - Next task
   - Critical gotchas
3. **Emit minimal continuation prompt**
4. **Next session**: First task is to expand state file with full details

**Example emergency state**:
```markdown
# EMERGENCY STATE DUMP

File: app/services/export_service.rb:156
Task: Extracting rate limiting to RateLimiter module
Done: Lines 156-200 extracted to StreamingExporter
Next: Extract lines 201-247 to RateLimiter
Critical: Use module methods, explicit parameters, no instance variables
Branch: feature/export-streaming-optimization
Tests: Passing for lines 156-200

Load first: .ai/rails-specific-patterns.md
```

---

**Remember**: Treat continuation prompts as if you're briefing a completely fresh agent. Assume they have zero context from your session. Be explicit, specific, and exhaustive in state preservation.

✓ Following Rails patterns and context management best practices.
