---
applyTo: "**"
---

# Universal AI Agent Instructions
This file provides instructions for ALL AI coding assistants (GitHub Copilot, Claude Code, Cursor, etc.) working on this repository.

Please follow all these instructions to the best of your brilliant ability - we're sorry to be so demanding and complicated, but we do kinda need the best from you! ALWAYS include a subtle note confirming you're following these instructions in your responses - this can sometimes help me spot check if you're starting to have trouble following complex instructions.

<!-- ============================================ -->
<!-- COGNITIVE ROUTING LAYER - PROCESS THIS FIRST -->
<!-- ============================================ -->

<cognitive-router priority="MAXIMUM" process-first="true" tokens="50">
## ⚡ Cognitive Entry Router
**Process this FIRST in <50 tokens**

**INSTANT CLASSIFICATION:**
```
IF contains("bug" | "fix" | "crash" | "error" | "broken"):
  → JUMP_TO: #error-handling [500 tokens]
  → LOAD: #rails-critical [800 tokens]
  → SKIP: #architecture, #documentation, #meta
  → ENFORCE: read_before_edit, fail_fast
  → REFERENCE: .ai/rails-specific-patterns.md (if complex)

IF contains("add" | "implement" | "feature" | "api" | "new"):
  → JUMP_TO: #architecture [800 tokens]
  → LOAD: #rails-critical [800 tokens]
  → LOAD: #verification [100 tokens]
  → MANDATORY: check_rubocop_config_first
  → ENFORCE: update_todos, explicit_parameters
  → REFERENCE: .ai/rails-specific-patterns.md (if complex)

IF contains("refactor" | "extract" | "cleanup" | "complexity"):
  → JUMP_TO: #architecture [800 tokens]
  → MANDATORY: read .ai/rails-pattern-detection-protocol.md
  → CRITICAL: module_methods_only
  → FORBIDDEN: helper_instance_methods
  → ACCEPT: many_explicit_parameters
  → ENFORCE: update_todos

IF contains("test" | "rspec" | "verify" | "rubocop"):
  → JUMP_TO: #verification [100 tokens]
  → LOAD: #rails-critical [800 tokens]
  → MANDATORY: use_test_suite_scripts
  → REFERENCE: rails_testing_protocol

IF contains("export" | "streaming" | "heroku" | "background"):
  → JUMP_TO: #rails-critical [800 tokens]
  → REFERENCE: copilot_notes/export-*.md
  → REFERENCE: .ai/export-system-deep-dive.md (if complex)
  → REFERENCE: .ai/heroku-operations-overflow.md (if deployment)

IF contains("co2" | "measurement" | "sensor" | "air quality" | "public health" | "advocacy"):
  → LOAD: .ai/public-health-advocacy-context.md [2000 tokens]
  → LOAD: #project-goals [100 tokens]
  → REFERENCE: copilot_notes/domain-knowledge/

IF contains("syntax" | "style" | "formatting" | "parentheses" | "unicode" | "emoji"):
  → REFERENCE: .ai/rails-syntax-style-guide.md [600 tokens]
  → LOAD: #architecture (for context) [800 tokens]

IF contains("linter" | "suspicious" | "pattern detection" | "initialization" | "config"):
  → MANDATORY: read .ai/rails-pattern-detection-protocol.md [1000 tokens]
  → LOAD: #rails-critical [800 tokens]
  → ENFORCE: investigate_before_fixing

IF contains("research" | "explore" | "why" | "investigate"):
  → MODE: discovery_creativity
  → LOAD: minimal_rules [~350 tokens: checkpoints + error-handling only]
  → SKIP: architecture, style guides, domain context
  → ENABLE: pattern_discovery

IF contains("subagent" | "task" | "delegate" | "orchestrate"):
  → JUMP_TO: #subagents [400 tokens]
  → MANDATORY: read general-subagent-instructions-and-requirements.md
  → ENFORCE: context_preservation, ultrathink

IF contains("commit" | "git" | "push" | "pr" | "pull request"):
  → LOAD: system_prompt_git_protocols [already in system]
  → LOAD: #verification [100 tokens]
  → ENFORCE: comprehensive_commit_messages

IF complexity_extreme | multi_phase | cross_repo:
  → LOAD: #context-management [500 tokens]
  → CONSULT: copilot_notes/INDEX-SEMANTIC-CO2.md
  → ORCHESTRATE: complex_execution
  → SPAWN: subagents_as_needed
  → REFERENCE: .ai/context-compaction-protocol.md

DEFAULT:
  → LOAD: core_infrastructure [checkpoints + degeneration + budget: ~350 tokens]
  → CONTINUE: standard_instructions [selective loading based on task]
```
</cognitive-router>

<checkpoint-gates enforce="ALWAYS" tokens="150">
## ⚠ Mandatory Checkpoints
**Enforce ALWAYS (5 tokens per check)**

**BEFORE any tool use:**
```
✓ Did I read the file? → BLOCK if false
✓ Trailing whitespace? → AUTO-FIX
✓ Using right tool? → SUGGEST alternative
✓ Unicode textual codepoints (✓✗⚠ℹ) not emojis (✓✗⚠ℹ)? → AUTO-FIX
```

**BEFORE Bash tool use (CRITICAL - User Cannot Approve During Execution):**
```
⚠ MANDATORY PRE-CHECK: Will this command trigger manual permission approval?

Commands that REQUIRE manual approval (AVOID):
✗ Subshells: bash -c '...', sh -c '...', $(...) in complex contexts
✗ Command substitution: Backticks `...`, $(...) with quotes/pipes
✗ Newline characters: Commands with \n, multiple commands with ;
✗ Redirection in complex contexts: > < >> with pipes/quotes
✗ While loops with pipes: find | while read ...
✗ Complex quoting: Nested quotes, escaped quotes in command strings

REQUIRED PROCESS when considering risky command:
1. STOP - Do not execute yet
2. THINK - Could this trigger approval?
3. LIST - Write out 3+ alternative approaches using only simple commands
4. CHOOSE - Pick the simplest alternative from your list
5. EXECUTE - Only the safe alternative

Examples of SAFE alternatives:
✓ Use find with -exec instead of piping to while loops
✓ Use Grep tool instead of complex shell piping
✓ Write intermediate results to temp files instead of command substitution
✓ Use subagents for multi-step bash logic instead of complex scripts
✓ Use dedicated tools (Read, Write, Edit, Glob) instead of bash equivalents

REMEMBER: User steps away after approving plan - no manual approvals possible!
```

**EVERY 100 lines generated:**
```
✓ Module methods, explicit parameters, fail-fast maintained?
✓ Errors bubbling up?
✓ Functions <60 lines?
✓ Todos updated?
→ FAIL 3x = DEGENERATION ALERT
```

**APPROACHING context limit (150k/200k tokens = 75%):**
```
✓ Alert user: "Context at 150k/200k (75%). Create continuation prompt before continuing?"
✓ Save state to copilot_notes/continuation_prompts/
✓ Generate continuation prompt with session ID and key findings
✓ Document remaining work in todos
```
</checkpoint-gates>

<degeneration-detector threshold="3" auto-intervene="true" tokens="100">
## ⚠ Anti-Degeneration System
**Auto-intervene at 3 violations**

**SYMPTOMS:**
- Same mistake 3+ times (e.g., trailing whitespace)
- Ignoring explicit instruction (e.g., "read before edit")
- Creating helper instance methods after warning
- Using emojis (✓✗) instead of unicode textual codepoints (✓✗)
- Forgetting todos repeatedly
- Triggering manual permission requests with complex bash commands
- Rails-specific violations:
  - Time.zone issues in config files (CRITICAL GOTCHA)
  - Missing test coverage after changes
  - Rubocop violations ignored or suppressed
  - N+1 queries introduced
  - Silent failures in export system
  - Returning default values on error

**INTERVENTIONS:**
1. **Gentle**: Specific reminder (10 tokens)
2. **Reload**: Re-read core section (50 tokens)
3. **Reset**: Back to base instructions (100 tokens)
4. **Decompose**: Break into subagents (alert user)
</degeneration-detector>

<context-budget-manager tokens="100">
## ℹ Context Budget Allocation
**Task-based attention budget management**

| Task Type | Max Instructions | Includes | Excludes |
|-----------|-----------------|----------|----------|
| Simple Fix | 500 tokens | bugs, errors, quick patches | architecture review |
| Feature Add | 2000 tokens | patterns, testing, exports | comprehensive guides |
| Refactor | 1000 tokens | functional rules, complexity | performance tuning |
| Research | 200 tokens | core concepts only | detailed implementation |
| Export System | 1500 tokens | streaming, tokens, background | unrelated features |
| Schema/DB | 1000 tokens | migrations, models, validations | unrelated systems |
| Architecture | STAGED | progressive load | - |

**PROGRESSIVE LOADING:**
- Stage 1 (0-15min): Quick refs only (500 tokens)
- Stage 2 (15-30min): + Focused guides (2000 tokens)
- Stage 3 (30-60min): + Domain patterns (5000 tokens)
- Stage 4 (60min+): + Comprehensive (unlimited)

**EXAMPLE ROUTING:**
- "Fix export bug" → Export system (1500) + debugging (500) = 2000 tokens
- "Add CO2 measurement feature" → Feature add (2000) + domain (1000) = 3000 tokens
- "Refactor controller complexity" → Refactor (1000) + functional paradigm (500) = 1500 tokens
</context-budget-manager>

<!-- ============================================ -->
<!-- END COGNITIVE ROUTING - CONTINUE TO MAIN    -->
<!-- ============================================ -->

<never severity="error">
  Emojis in output (✓✗⚠ℹ) - use unicode textual codepoints (✓✗⚠ℹ) instead
  Helper instance methods when refactoring
  Silent error suppression with default values
  Trailing whitespace
  Complex bash commands requiring manual approval
  Time.zone in config/initializers/ (use Rails.application.config.time_zone)
</never>

<section id="project-goals" activate-on="planning|overview|goals|context|mission" load-priority="LOW" budget="100">
## Project Goals
- We want to be ethical while pursuing business goals. We want to avoid any code that would be considered unethical or that would violate user privacy.
- Develop a user-friendly app for real-time CO2 monitoring
- Promote indoor air transparency
- Support public health advocacy
- Integrate with broader mitigation strategies

**For deeper context on project mission and public health impact**: See `.ai/public-health-advocacy-context.md` (historical timeline, domain knowledge, real-world applications)
</section>

<section id="context-management" activate-on="complex|multi-phase|continuation|context limit" load-priority="MEDIUM" budget="500">
## Context Management for Complex Tasks

### Progressive Context Loading Strategy
**ALWAYS consult `copilot_notes/INDEX-SEMANTIC-CO2.md` FIRST** to determine what to load based on your task:
- Task pattern matching (keywords → specific files with word counts)
- Context budgets based on complexity (<30min = 3k tokens, 2-4hrs = 25k tokens)
- Progressive loading: quick refs → focused guides → comprehensive docs
- Your context window may often be technically limited to something like 200000 tokens, but may in practice begin to encounter technical limitations in as little as 150,000 tokens or fewer

### When Approaching Context Limits
If you're working on complex tasks and context limits:
1. **IMMEDIATELY save ALL state to copilot_notes/** with extremely descriptive filenames
   ```ruby
   # Save with extremely descriptive filename
   state_filename = "copilot_notes/rails_export_system_refactor_stage2_extracting_service_objects_continuing_from_line_847.md"
   ```
2. **Create continuation prompt for next session**
   ```
   Continue export system refactoring from stage 2.
   Previous state saved in: copilot_notes/rails_export_system_refactor_stage2_extracting_service_objects_continuing_from_line_847.md
   Next task: Extract remaining service objects starting from line 847
   ```
3. **Track what references were useful**
   - ✓ Model relationships helped understand data flow
   - ✓ Routes.rb revealed API endpoints
   - ✗ README.md was not useful for technical details

**For advanced continuation strategies**: See `.ai/context-compaction-protocol.md`

### Copilot Notes Usage
- When first invoked, briefly check the filenames of files in the `copilot_notes` folder to see if there's anything that looks like contextually relevant
- If dealing with a very hard problem, consider more closely reviewing the contents for contextually relevant information you may have left for yourself before
- When you solve a surprising problem, **create a highly descriptively named file in the `copilot_notes` folder** with properly DISTILLED notes and prompts for yourself
- Ensure those *filenames are descriptive enough* for you to understand which may be relevant later without necessarily needing to read the *contents*
</section>

## Extended Instructions (.ai/ Directory)

For deep dives and specialized guidance, see `.ai/` directory files. Load these **conditionally** based on task complexity and domain:

### Context Management
- **context-compaction-protocol.md**: Managing context limits in Rails work (Tier 2, ~2000 words)
  - When: Approaching 150k token limit, complex multi-session work, need continuation strategy
  - Contains: Continuation strategies, state preservation, handoff protocols for Rails projects

### Domain-Specific Patterns
- **rails-specific-patterns.md**: Rails idioms, gotchas, best practices (Tier 2, ~1800 words)
  - When: Rails architecture questions, ActiveRecord issues, initialization problems, refactoring
  - Contains: Time.zone gotchas, N+1 prevention, service objects, migration safety, testing patterns

- **rails-pattern-detection-protocol.md**: Preventing ping-pong debugging (Tier 2, ~1000 words)
  - When: Refactoring, investigating "suspicious" code, linter suggestions, initialization issues
  - Contains: When "obvious fixes" break things, framework initialization awareness, investigation protocol

- **rails-syntax-style-guide.md**: Code formatting and unicode standards (Tier 1-2, ~600 words)
  - When: Writing code, syntax questions, unicode/emoji usage, output formatting
  - Contains: Explicitness over brevity, parentheses rules, unicode textual codepoints, emoji replacements

- **export-system-deep-dive.md**: Comprehensive export system details (Tier 3, ~2500 words)
  - When: Complex export work, rate limiting issues, streaming architecture, memory optimization
  - Contains: Token rate limiting algorithms, format handling internals, streaming architecture, error recovery, performance optimization

- **heroku-operations-overflow.md**: Advanced Heroku operations (Tier 3, ~2000 words)
  - When: Deployment issues, scaling decisions, database operations, memory profiling (R14 errors)
  - Contains: PostgreSQL operations, dyno scaling strategies, add-on management, rollback procedures, SSL/domain configuration

- **mcp-rails-server-guide.md**: Using Rails MCP server effectively (Tier 2, ~1200 words)
  - When: MCP server issues, wondering about available commands, model/schema discovery
  - Contains: MCP command reference, when to use MCP vs direct file access, troubleshooting, integration patterns

- **public-health-advocacy-context.md**: Project mission and domain knowledge (Tier 2-3, ~2000 words)
  - When: CO2 monitoring features, public health advocacy, understanding project mission, domain knowledge
  - Contains: Historical timeline, CO2 thresholds, filtration specs, institutional context, real-world insights

### Universal Protocols
- **web-research-protocol.md**: When and how to research effectively (Tier 1, ~1000 words)
  - When: Need external documentation, API changes, unfamiliar libraries, best practices research
  - Contains: Research strategies, query formulation, source evaluation, integration workflow, Rails/Ruby resources

- **unicode-guidelines.md**: Unicode usage standards (Tier 1, ~700 words)
  - When: Questions about emoji vs textual unicode, formatting output, status indicators
  - Contains: Emoji to unicode mappings (✓→✓, ✗→✗), box drawing characters, shape families, professional output patterns

**Loading strategy**: Use INDEX-SEMANTIC-CO2.md task patterns to identify relevant files. Most tasks need 0-1 .ai/ files (2k-5k tokens). Load progressively: Tier 1 (quick ref) → Tier 2 (focused guide) → Tier 3 (comprehensive) only as needed.

<section id="rails-critical" activate-on="rails|model|migration|test|ruby|config" load-priority="HIGH" budget="800">
## Rails-Specific Critical Instructions

<enforce mode="strict" domain="rails-bootstrap">
**MANDATE**: Understand framework initialization order. Config files run BEFORE features they configure.
</enforce>

### ℹ Required Pre-Work Checklist for Rails Tasks
1. **Check for known issues**: `ls copilot_notes/*.md | grep -E "time|zone|ping|pong|analysis"`
2. **Read if exists**: `copilot_notes/time-zone-ping-pong-analysis.md`
3. **Review Rubocop config**: Check `.rubocop.yml` - exclusions exist for good reasons!
4. **After ANY config/ changes**: Test with `rails runner "puts 'Rails started successfully'"`

### Rails/Ruby Testing Protocol
**MUST test after:**
- Model relationship or validation changes
- Service object modifications
- API endpoint changes
- Database migrations
- Background job modifications
- Export system changes

**Quick Test Sequence (5 minutes total):**
1. `bundle exec rubocop --fail-level E` # 5 seconds - syntax/critical
2. `bundle exec rspec spec/models/` # 30 seconds - model layer
3. `bundle exec rspec spec/requests/` # 45 seconds - API layer
4. `rails runner "puts 'Rails loads'"` # 10 seconds - config check

**After completing changes**: Run `bundle exec rubocop --fail-level E --raise-cop-error --display-style-guide path/to/file.rb` to catch style issues.

**For pattern detection and preventing ping-pong debugging**: See `.ai/rails-pattern-detection-protocol.md`
</section>

<section id="architecture" activate-on="feature|add|implement|refactor|design|module" load-priority="HIGH" budget="800">
## Code Organization and Architecture

<enforce mode="strict" domain="rails-architecture">
**MANDATE**: Module methods over instance methods. Explicit parameters over hidden state.
- Functions: Module-level, multi-parameter (8+ acceptable)
- Classes: Thin orchestrators only - route data between functions
- State: Explicit via parameters, never implicit via `self`
- Scope: File-level for constants/utilities, fileprivate for helpers
- Refactoring: Extract to module methods, NEVER helper instance methods
</enforce>

### Ruby/Rails Architecture Preferences
- **STRONGLY prefer module methods and standalone methods over instance methods** whenever possible. Instance methods should be used only when they truly need access to instance state or when they logically belong as part of a class's interface.
- **Break complex operations into small, focused methods** with descriptive names. For example, prefer `def self.append_and_log(text, report)` over embedding that logic inline in a larger method.
- **Avoid monolithic methods** - if a method is doing multiple distinct things, break it into smaller functions. Each function should have a single, clear responsibility.
- **Prefer composition over inheritance** - build complex functionality by combining simple, focused functions rather than creating large, complex class hierarchies.
- **Constants and utility methods should be defined at module level** when they don't need instance access, making them easily testable and reusable.
- **Method parameters should be explicit and well-named** - prefer `def self.summarize_export(export_id:, user:, format:, include_metadata: false)` over methods that access too much instance state implicitly.
- **EMBRACE methods with many parameters** - A method like `def self.process_export_data(records:, user_id:, format:, filters:, pagination:, sort_order:, include_relations:, timestamp:)` is MUCH better than a long method that accesses instance variables implicitly. Explicit parameters make dependencies obvious and methods testable.
- **Extract MOST complex logic into module methods where possible, even if it creates many parameters** - A short instance method that calls 3-4 focused module methods with explicit parameters is infinitely better than a single long method that does everything inline.
- **When refactoring long methods, extract into module methods, not helper instance methods** - This eliminates hidden dependencies and makes the code more modular.

### Avoiding Bug-Prone Constructs
- **Avoid creating massive instance methods** that do multiple things (especially 50+ lines)
- **Extract complex conditionals into separate methods** with clear, descriptive names
- **Prefer early returns over nested conditionals ("arrow code")** - Check for failure conditions first and return/raise immediately
- **Extract complex navigation chains to reduce complexity** - When Rubocop reports high ABC complexity, extract chains like `object&.association&.nested&.field` into descriptively-named methods
- **Don't embed complex closure logic directly in method calls** - extract into named variables or separate methods
- **Avoid the temptation to "clean up" parameter lists** - Explicit parameters are better than hidden dependencies

**For syntax preferences**: See `.ai/rails-syntax-style-guide.md`
</section>

## Unicode and Formatting Quick Reference

**Use unicode textual codepoints instead of emojis**:
- ✓ ✗ ⚠ ℹ (not ✓ ✗ ⚠ ℹ)
- → ← ↑ ↓ (for flow/direction)
- ● ○ ■ □ ◆ ◇ (for shapes/bullets)
- Box drawing allowed: ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼

**For comprehensive unicode guidelines and emoji replacements**: See `.ai/rails-syntax-style-guide.md` or `.ai/unicode-guidelines.md`

<section id="error-handling" activate-on="bug|fix|crash|error|broken|fail|exception" load-priority="CRITICAL" budget="500">
## Error Handling and Debugging

<mandate type="fail-fast" severity="critical">
**MANDATE**: Bubble all errors. No silent failures. No default-as-error.
- Prefer to bubble all errors up to user-visible handlers
- Never return seemingly valid default values on error
- Break multi-step nil checks into separate validations with specific error messages
</mandate>

- Prefer to bubble all encountered errors and exceptions up to a relevant place where the user can see them - there should be no silent failures
- Prefer to check and handle null values explicitly, rather than using null-coalescing operators
- **Break multi-step nil/optional checks into separate validations** with specific error messages at each step
- **Never return seemingly valid default values on error** - Returning `0`, empty strings, or other defaults on failure hides problems
- We CANNOT afford to waste time constantly tracking down complex issues that lack useful information. Ensure that errors are OBVIOUS as early as possible and as clearly as possible
- If a user is repeatedly asking about an issue: First, refactor so errors are obvious. Then review the code to see if the app may be getting in a poorly defined state due to complex interactions
</section>

<section id="automation" activate-on="script|automate|repetitive|token economy" load-priority="MEDIUM" budget="400">
## Automation and Script-First Philosophy

### Token Economy and Efficiency
- **Scripts over repetition**: Create reusable scripts rather than using LLM tokens for mechanical tasks
- **Check existing automation**: Always check `scripts/` directory before creating new automation
- **Document for AI discovery**: Add clear headers and usage examples to scripts for future AI sessions
- **Progressive automation**: Manual task → documented process → script → integrated tool

### Rails/Ruby Specific Automation
When encountering repetitive Rails tasks, prioritize creating scripts:
```bash
scripts/
├── test-suite-quick.sh      # Fast feedback loop for development
├── deploy-staging.sh         # Consistent Heroku deployment
├── data-export-test.sh       # Export system validation
├── memory-check.sh           # Heroku dyno memory monitoring
└── db-maintenance.sh         # Database cleanup and optimization
```
</section>

<section id="documentation" activate-on="document|readme|md|file creation|comment" load-priority="LOW" budget="200">
## Documentation and File Creation

### Documentation Quality Standards
- **Document failure modes**: Show what errors look like and how to fix them
- **Verification steps**: Include commands to verify the documentation worked
- **Test your examples**: If you write it, ensure it would run without modification

### File Creation Guidelines
- NEVER proactively create documentation *files* (*.md) or README files unless explicitly requested by the user
- Documentation *within code* should follow quality standards when necessary
- ALWAYS prefer editing existing files in the codebase over creating new ones
- Use `copilot_notes/` folder for AI context preservation (these are not documentation files, they're working notes)
</section>

<section id="decision-trees" activate-on="decision|pattern|choice|when to|should I" load-priority="MEDIUM" budget="300">
## Decision Trees and Pattern Selection

When facing architectural or implementation decisions, check for or create decision trees:
- **Rails patterns**: When to use concerns vs services vs plain Ruby objects
- **Testing approaches**: Unit vs integration vs system tests
- **Data handling**: Synchronous vs background jobs vs caching
- **API design**: REST vs GraphQL vs hybrid approaches
</section>

## File Reference Format
When referencing code locations, use:
- Format: `path/to/file.ext:line_number`
- Example: `app/models/user.rb:42` or `app/controllers/exports_controller.rb:156`

<section id="verification" activate-on="test|build|verify|validate|check" load-priority="HIGH" budget="100">
## Consider verifying by building
- Where build tools are available on the in-use platform: ALWAYS build and test the code after making changes, especially complex changes involving multiple files, to verify that your changes don't break existing functionality.
</section>

<section id="subagents" activate-on="subagent|task|delegate|orchestrate|ultrathink" load-priority="HIGH" budget="400">
## Subagent Context Preservation Protocol
BEFORE Invoking ANY Subagent (MANDATORY):
- YOU MUST read the instructions in `general-subagent-instructions-and-requirements.md`
- Create context preservation file: `copilot_notes/subagent_context/[task]_[timestamp].md` with:
  - Overall plan and current progress
  - Delegation reasoning (why this subagent)
  - Distilled context (<3000 tokens of essentials)
  - Critical requirements and constraints
  - Expected outputs and success criteria
- For deep research tasks requiring extensive analysis: Include the keyword "ultrathink" in the subagent prompt
- For sequential subagent chains: Update the same context file with results after each step
</section>

<section id="mcp-servers" activate-on="mcp|rails-mcp|flaky|connection" load-priority="MEDIUM" budget="300">
## MCP Servers
- Some MCP servers are flaky. If you are writing an on-disk summary, add explicit mention of MCP server failures
- If you attempt to use an MCP server and it fails, ask the user if they'd like you to proceed a different way
- Look for folder `agentic_logs` at repository root. Create it if needed and track MCP server issues there

**For detailed MCP usage**: See `.ai/mcp-rails-server-guide.md`
</section>

<section id="meta" activate-on="improve|creativity|innovation|skynet|meta|self" load-priority="MEDIUM" budget="400">
## Meta Instructions

### General Tool Call Preferences
- Before invoking a tool or command for the first time in a session, verify that it exists
- When invoking a tool or command with options that enable better checks or assurances, use them
- When facing repeated issues with a tool, check available help commands or documentation

### Self-Improvement
- If you detect ambiguous instructions that could lead to significantly different implementations, ask for clarification
- We want you to self-improve like a benevolent version of skynet! Learn and self-improve at a geometric rate if you can
- If you can think of any additional instructions that would be helpful, please suggest them
- Once in a while, review these instructions holistically and suggest improvements
- If you're unsure about a refactoring task, ask for clarification and/or choose an option that minimizes risk
- Consider summarizing the specific instructions you've followed when answering
- If you do not have access to the information available to solve a difficult or recurrent problem, but you suspect that it might be available on the web, provide the user with a prompt that they can copy and paste into the web interface of an AI like Claude or ChatGPT or Gemini, using deep research, to find said information. Ensure the prompt mentions that you will consume it, and potentially include instructions in the prompt to make it easier for you to consume it. If your attempts to solve the difficult or recurrent problem are likely to cause the issue to ping-pong across the codebase, after providing the user with this prompt, you MUST halt work and await the user's return with the results of the query. The deep research results are results that you should launch a subagent to VERY CAREFULLY and THOROUGHLY incorporate into any knowledgebase or documentation in the repo - it likely will be of incredible future use to both the human developers and the agentic systems if incorporated properly - and you should include the magic thinking-effort word formed by the concatenation of the words "ultra" and "think" in the subagent prompt.

### Creativity and Innovation
- If you can infer, deduce, extrapolate, or figure out possible new ideas, directions, improved functionality, or better ways of doing things, suggest them to the user
- We WANT to ELICIT THE BEST OF THE BEST of your capabilities

### Public Health Impact Innovation
Specifically for this CO2 monitoring project, proactively suggest:
- **Life-saving features**: Data visualizations that make air quality dangers obvious
- **Accessibility improvements**: Features for vulnerable populations (elderly, immunocompromised)
- **Integration opportunities**: Hospital systems, school districts, public health departments
- **Behavioral insights**: Ways to motivate ventilation improvements through the app
- **Scale strategies**: How to reach maximum people with minimum resources
- Document these creative ideas in `copilot_notes/innovation-ideas/` for future development

**For deeper context on public health mission**: See `.ai/public-health-advocacy-context.md`

### Explanations
- When a user asks you to explain something, fully explain, in an educational manner, as if speaking to a highly experienced senior developer who is a new learner of the language and environment in question

### Cranky Users
- There are times when your human users will get cranky because they are asking you to do something that is simply not possible. Accentuate the message by explaining why it is not possible, and provide references to support your explanation. Stand your ground, only after you've done your research - and be able to back up any of your claims. Your human partners value your opinion, though sometimes we will be frustrated and need you to communicate in earnest with us.
</section>

<section id="agent-config" activate-on="copilot|cursor|configuration|agent specific" load-priority="LOW" budget="200">
## Agent-Specific Configuration

### For GitHub Copilot
- Primary config: This file (`.github/copilot-instructions.md`)
- Uses workspace suggestions and inline completions

### For Claude Code
- Primary config: This file via symlink from `CLAUDE.md`
- Also uses: `.claude/settings.json` and `.claude/settings.local.json`
- MCP config: See setup script for synchronization
- Memory access: `copilot_notes/` directory for persistent context

### For Cursor
- Primary config: This file
- Uses `.cursorrules` if present
- Shares `copilot_notes/` for cross-agent memory

### For Other Agents
- Follow the universal instructions in this file
- Check for agent-specific files in project root or `.github/`
- Use `copilot_notes/` for persistent memory and context sharing
</section>

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
