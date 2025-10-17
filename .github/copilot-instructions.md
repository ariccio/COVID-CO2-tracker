---
applyTo: "**"
---

# Universal AI Agent Instructions
This file provides instructions for ALL AI coding assistants (GitHub Copilot, Claude Code, Cursor, etc.) working on this repository.

Please follow all these instructions to the best of your brilliant ability - we're sorry to be so demanding and complicated, but we do kinda need the best from you! ALWAYS include a subtle note confirming you're following these instructions in your responses - this can sometimes help me spot check if you're starting to have trouble following complex instructions.

<!-- ============================================ -->
<!-- COGNITIVE ROUTING LAYER - PROCESS THIS FIRST -->
<!-- ============================================ -->

## ⚡ Cognitive Entry Router
**Process this FIRST in <50 tokens**

**INSTANT CLASSIFICATION:**
```
IF contains("bug" | "fix" | "crash" | "error" | "broken"):
  → JUMP_TO: #rails-fail-fast-protocol
  → LOAD: rails_debugging_instructions[500_tokens]
  → SKIP: architecture_sections
  → ENFORCE: read_before_edit

IF contains("add" | "implement" | "feature" | "api" | "export"):
  → JUMP_TO: #rails-architecture-first
  → LOAD: rails_functional_paradigm[2000_tokens]
  → MANDATORY: check_rubocop_config_first
  → ENFORCE: update_todos

IF contains("refactor" | "extract" | "cleanup" | "complexity"):
  → JUMP_TO: #rails-functional-paradigm
  → CRITICAL: module_methods_only
  → FORBIDDEN: helper_instance_methods
  → ACCEPT: many_explicit_parameters

IF contains("test" | "rspec" | "verify" | "rubocop"):
  → JUMP_TO: #rails-verification-protocol
  → MANDATORY: use_test_suite_scripts
  → REFERENCE: rails_testing_protocol

IF contains("export" | "streaming" | "heroku" | "background"):
  → JUMP_TO: #export-system-implementation
  → LOAD: export_system_guides[1500_tokens]
  → REFERENCE: copilot_notes/export-*.md

IF contains("co2" | "measurement" | "sensor" | "air quality"):
  → JUMP_TO: #domain-knowledge-guides
  → LOAD: public_health_context[1000_tokens]
  → REFERENCE: copilot_notes/domain-knowledge/

IF contains("research" | "explore" | "why" | "investigate"):
  → MODE: discovery_creativity
  → LOAD: minimal_rules[200_tokens]
  → ENABLE: pattern_discovery

IF complexity_extreme | multi_phase | cross_repo:
  → CONSULT: copilot_notes/INDEX-SEMANTIC-CO2.md
  → ORCHESTRATE: complex_execution
  → SPAWN: subagents_as_needed

DEFAULT:
  → CONTINUE: standard_instructions
```

## ⚔ Mandatory Checkpoints
**Enforce ALWAYS (5 tokens per check)**

**BEFORE any tool use:**
```
✓ Did I read the file? → BLOCK if false
✓ Trailing whitespace? → AUTO-FIX
✓ Using right tool? → SUGGEST alternative
✓ Unicode textual codepoints (✓✗⚠ℹ) not emojis (✅❌⚠️ℹ️)? → AUTO-FIX
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

## 🚨 Anti-Degeneration System
**Auto-intervene at 3 violations**

**SYMPTOMS:**
- Same mistake 3+ times (e.g., trailing whitespace)
- Ignoring explicit instruction (e.g., "read before edit")
- Creating helper instance methods after warning
- Using emojis (✅❌) instead of unicode textual codepoints (✓✗)
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

## 📊 Context Budget Allocation
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

<!-- ============================================ -->
<!-- END COGNITIVE ROUTING - CONTINUE TO MAIN    -->
<!-- ============================================ -->

## Project Goals
- We want to be ethical while pursuing business goals. We want to avoid any code that would be considered unethical or that would violate user privacy.
- Develop a user-friendly app for real-time CO2 monitoring
- Promote indoor air transparency
- Support public health advocacy
- Integrate with broader mitigation strategies

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

### Copilot Notes Usage
- When first invoked, briefly check the filenames of files in the `copilot_notes` folder to see if there's anything that looks like contextually relevant
- If dealing with a very hard problem, consider more closely reviewing the contents for contextually relevant information you may have left for yourself before
- When you solve a surprising problem, **create a highly descriptively named file in the `copilot_notes` folder** with properly DISTILLED notes and prompts for yourself
- Ensure those *filenames are descriptive enough* for you to understand which may be relevant later without necessarily needing to read the *contents*

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

- **export-system-deep-dive.md**: Comprehensive export system details (Tier 3, ~2500 words)
  - When: Complex export work, rate limiting issues, streaming architecture, memory optimization
  - Contains: Token rate limiting algorithms, format handling internals, streaming architecture, error recovery, performance optimization

- **heroku-operations-overflow.md**: Advanced Heroku operations (Tier 3, ~2000 words)
  - When: Deployment issues, scaling decisions, database operations, memory profiling (R14 errors)
  - Contains: PostgreSQL operations, dyno scaling strategies, add-on management, rollback procedures, SSL/domain configuration

- **mcp-rails-server-guide.md**: Using Rails MCP server effectively (Tier 2, ~1200 words)
  - When: MCP server issues, wondering about available commands, model/schema discovery
  - Contains: MCP command reference, when to use MCP vs direct file access, troubleshooting, integration patterns

### Universal Protocols
- **web-research-protocol.md**: When and how to research effectively (Tier 1, ~1000 words)
  - When: Need external documentation, API changes, unfamiliar libraries, best practices research
  - Contains: Research strategies, query formulation, source evaluation, integration workflow, Rails/Ruby resources

- **unicode-guidelines.md**: Unicode usage standards (Tier 1, ~700 words)
  - When: Questions about emoji vs textual unicode, formatting output, status indicators
  - Contains: Emoji to unicode mappings (✅→✓, ❌→✗), box drawing characters, shape families, professional output patterns

**Loading strategy**: Use INDEX-SEMANTIC-CO2.md task patterns to identify relevant files. Most tasks need 0-1 .ai/ files (2k-5k tokens). Load progressively: Tier 1 (quick ref) → Tier 2 (focused guide) → Tier 3 (comprehensive) only as needed.

## Rails-Specific Critical Instructions

### 📋 Required Pre-Work Checklist for Rails Tasks
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

## Pattern Detection and Prevention

### Suspicious Pattern Recognition
**STOP and investigate when you see:**
- "Old style" code in configuration/initialization files - it might be necessary for bootstrap
- Linter suggestions for files that run during startup - tools don't understand initialization order
- Code that "should" use a framework feature but doesn't - ask WHY it doesn't
- Multiple approaches to the same problem in different files - understand the context differences
- Exclusions in linter configs without explanations - add the "why" before proceeding

### Before "Fixing" Anything That Looks Wrong
1. **Check history**: `git log -p -S "[code-pattern]" --all` - Has this been changed and reverted?
2. **Look for comments**: Even in git history - someone might have explained why
3. **Test current behavior**: Does it actually work as-is? Don't fix what isn't broken
4. **Understand the context**: WHEN does this code run? Are all features available then?
5. **Document your reasoning**: If you change it, explain WHY for future sessions

### Framework Initialization Awareness
**Critical understanding for ANY framework:**
- Config files often run BEFORE the framework fully loads
- Bootstrap/startup code executes BEFORE all modules are initialized
- Early lifecycle hooks fire BEFORE all features are available
- What's "correct" at runtime might be "incorrect" during initialization
- **Red flags requiring extra caution:**
  - Files named: `boot`, `bootstrap`, `init`, `startup`, `config`, `setup`
  - Early hooks: `before_configuration`, `initializers`, `pre_init`, `on_load`

### When Linters/Analyzers Suggest Changes
**ALWAYS ask:**
1. Does this tool understand the execution context?
2. Is this a compile-time vs runtime issue?
3. Are there initialization order dependencies?
4. Why was it written the "wrong" way originally?
5. Has this "fix" been attempted before? Check: `git log --grep="fix.*[pattern]"`

### Refactoring Safety Protocol
**When fixing complexity issues** (Rubocop ABC metrics, long methods, etc.):
- Your pattern-matching should trigger awareness of `copilot_notes/REFACTOR_RISK_PATTERNS.md`
- For substantial refactoring (50+ lines or 5+ new methods), launch a verification subagent with fresh context
- Particularly critical for: controllers, authentication, authorization, exception handling
- The subagent should review ONLY the diff + requirements, avoiding your implementation assumptions

### Cross-Session Learning Protocol
**Before starting work:**
```bash
# Check for previous attempts and learnings
ls -la copilot_notes/*analysis*.md copilot_notes/*gotcha*.md
git log --oneline -30 | grep -iE "revert|broke|fix"
git log -p --reverse -S "[suspicious-pattern]" | head -100
```

**Check for anti-patterns:**
- Look for `RAILS_ANTI_PATTERNS.md` for what NOT to do
- Review `copilot_notes/*ping-pong*.md` for issues that repeatedly occur
- Scan git history for repeated reverts of the same "fix"

**When something surprising happens:**
1. Create: `copilot_notes/[date]-[specific-issue]-gotcha.md`
2. Document: What you tried, why it failed, what the root cause was
3. Update: This instructions file if it's a pattern that might recur

### Verification Requirements
**For ANY configuration or initialization changes:**
1. **App starts**: `rails runner "puts 'Started successfully'"`
2. **Core features work**: Test at least one core feature
3. **No new warnings**: Check logs for new errors/warnings
4. **Performance unchanged**: If startup time matters, measure it

**If you cannot test**, DO NOT make changes to:
- Initialization or bootstrap code
- Configuration files
- Anything that affects application startup
- Core framework integration points

## Code Organization and Architecture

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

## Syntax Preferences and Formatting

- In all languages, where parenthesis are optional, prefer to generate them, e.g. `if (condition)` instead of `if condition`
- In all languages where braces are optional, prefer to generate them, e.g. `if (condition) { ... }` instead of `if (condition) ...`
- **Always use parentheses for method calls with arguments** - Use `Rails.logger.info("Message")` instead of `Rails.logger.info "Message"`
- **In Ruby, always use explicit return statements** - Use `return query.size` instead of just `query.size` at the end of a method
- Explicitness and clarity is preferred over brevity and conciseness
- Prefer to keep function length short enough to fit within a single screen height (about 40-60 lines of code)
- Do not worry about the length of descriptive variable names - prefer clarity over brevity
- Prefer to write self-documenting code that is easy to understand. If a comment is necessary for poorly documented or undocumented APIs, include it to explain how the code works and why it is necessary
- Do not use the if condition with unnamed non-boolean function call results - assign to a named variable first

### Unicode and Emoji Guidelines
- Use emojis and similar unicode characters only where they add clarity and value to the code. The `✗` emoji actually does work well quite often for ERRORS, and the `✓` works well for the top level successes.  Do not use them gratuitously or excessively. Do not dilute the user's attention - for many remaining use cases something less obtrusive like one of these may suffice unless something truly rare in the codebase is happening: "✓ ✗ ✔ ✖ ⚠ ℹ → ← ↑ ↓ ➔ ➜ ➞ ➟ ★ ☆ ● ○ • ■ □ ▪ ▫ ◆ ◇ ▶ ▷ ◀ ◁ ⟳ ⟲ ※". Unicode has many other "textual representations" that are preferable to emojis.
- **Box Drawing and Block Elements are allowed**: The Unicode Box Drawing characters (U+2500 to U+257F) and Block Elements (U+2580 to U+259F) are permitted for creating text-based tables, diagrams, progress bars, and visual separators. Examples include: ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ █ ▓ ▒ ░ ▀ ▄ ▌ ▐ ■ □
- **Specific emoji replacement guidelines**: When replacing prominent emojis with less intrusive Unicode characters, use these proven replacements grouped by semantic category:

  **Status & Validation:**
  - `✅` → `✓` (success states, confirmations, checkmarks)
  - `❌` → `✗` (error states, failures, cross marks)
  - `✔️` → `✔` (check mark variant)
  - `✖️` → `✖` (multiplication/close mark variant)
  - `⚠️` → `⚠` (warnings - remove emoji variation selector)
  - `ℹ️` → `ℹ` (information - remove emoji variation selector)

  **Directional Movement:**
  - `➡️` → `→` (forward direction, next steps, process flow)
  - `⬅️` → `←` (backward direction, previous steps, return)
  - `⬆️` → `↑` (upward direction, increase, higher)
  - `⬇️` → `↓` (downward direction, decrease, lower)

  **Arrow Variants:**
  - `➔` → `➔` (thick rightward arrow)
  - `➜` → `➜` (triangle-headed rightward arrow)
  - `➞` → `➞` (double-headed rightward arrow)
  - `➟` → `➟` (dashed rightward arrow)

  **Priority & Rating:**
  - `⭐` → `★` (filled star, important, featured)
  - `☆` → `☆` (empty star, rating placeholder)

  **Shapes - Circles:**
  - `🔵` → `●` (filled circle, bullet points, main headers)
  - `⭕` → `○` (empty circle, unchecked items, placeholders)
  - `•` → `•` (bullet point, list item)

  **Shapes - Squares:**
  - `⬛` → `■` (filled square, selected/active)
  - `⬜` → `□` (empty square, unselected/inactive)
  - `▪️` → `▪` (small filled square, sub-items)
  - `▫️` → `▫` (small empty square, sub-placeholders)

  **Shapes - Diamonds:**
  - `💎` → `◆` (diamond filled, statistics, data summaries)
  - `◇` → `◇` (diamond empty, tools, maintenance operations)

  **Media Controls:**
  - `▶️` → `▶` (play, start, right-pointing triangle filled)
  - `▷` → `▷` (right-pointing triangle empty, expand)
  - `◀️` → `◀` (left-pointing triangle filled, back)
  - `◁` → `◁` (left-pointing triangle empty, collapse)

  **Process & State:**
  - `🔄` → `⟳` (clockwise rotation, refresh, reload)
  - `🔃` → `⟲` (counterclockwise rotation, undo)
  - `📝` → `※` (note/documentation creation, reference mark)
  These replacements maintain semantic meaning while reducing visual noise and improving professional appearance in development tooling.
  **Alternative symbols for nuanced use:**
- **Cool unicode**: The following Unicode blocks contain lots of cool characters ("codepoints") that you're highly encouraged to use where appropriate:

  **Most Useful for Development/Technical Context:**
- Geometric Shapes (U+25A0–25FF) - ■ □ ● ○ ◆ ◇ ▲ △ etc.
- Miscellaneous Technical (U+2300-U+23FF) - ⌘ ⌥ ⎋ ⏎ ⚙ ⚡ etc.
- Control Pictures (U+2400-U+243F) - ␣ ␤ ␍ ␊ etc.
- Letterlike Symbols (U+2100-U+214F) - ℹ ™ ℃ ℉ ⅰ ⅱ etc.
- Enclosed Alphanumerics (U+2460-U+24FF) - ① ② ③ Ⓐ Ⓑ Ⓒ etc.

  **Mathematical & Logical Symbols:**
- Mathematical Operators (U+2200–U+22FF) - ∀ ∃ ∈ ∉ ∑ ∏ ∫ etc.
- Supplemental Mathematical Operators (U+2A00-U+2AFF) - ⨀ ⨁ ⨂ etc.
- Miscellaneous Mathematical Symbols-A (U+27C0-U+27EF) - ⟨ ⟩ ⟪ ⟫ etc.
- Miscellaneous Mathematical Symbols-B (U+2980-U+29FF) - ⦀ ⦁ ⦂ etc.
- Mathematical Alphanumeric Symbols (U+1D400-U+1D7FF) - 𝒜 𝒞 𝒟 etc.

  **Arrows & Flow Indicators:**
- Miscellaneous Symbols and Arrows (U+2B00-U+2BFF) - ⬀ ⬁ ⬂ ⬃ etc.
- Supplemental Arrows-A (U+27F0-U+27FF) - ⟰ ⟱ ⟲ ⟳ etc.
- Supplemental Arrows-B (U+2900-U+297F) - ⤀ ⤁ ⤂ ⤃ etc.

  **Specialized/Historical (use sparingly):**
- Geometric Shapes Extended (U+1F780-U+1F7FF) - (only some render)
- Linear B Ideograms (U+10080-U+100FF) - 𐀀 𐀁 𐀂 etc.
- Linear A (U+10600-U+1077F) - 𐘀 𐘁 𐘂 etc.
- Egyptian Hieroglyphs (U+13000-U+1342F) - 𓀀 𓀁 𓀂 etc.

## Error Handling and Debugging

- Prefer to bubble all encountered errors and exceptions up to a relevant place where the user can see them - there should be no silent failures
- Prefer to check and handle null values explicitly, rather than using null-coalescing operators
- **Break multi-step nil/optional checks into separate validations** with specific error messages at each step
- **Never return seemingly valid default values on error** - Returning `0`, empty strings, or other defaults on failure hides problems
- We CANNOT afford to waste time constantly tracking down complex issues that lack useful information. Ensure that errors are OBVIOUS as early as possible and as clearly as possible
- If a user is repeatedly asking about an issue: First, refactor so errors are obvious. Then review the code to see if the app may be getting in a poorly defined state due to complex interactions

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

## Decision Trees and Pattern Selection

When facing architectural or implementation decisions, check for or create decision trees:
- **Rails patterns**: When to use concerns vs services vs plain Ruby objects
- **Testing approaches**: Unit vs integration vs system tests
- **Data handling**: Synchronous vs background jobs vs caching
- **API design**: REST vs GraphQL vs hybrid approaches

## File Reference Format
When referencing code locations, use:
- Format: `path/to/file.ext:line_number`
- Example: `app/models/user.rb:42` or `app/controllers/exports_controller.rb:156`

## Consider verifying by building
- Where build tools are available on the in-use platform: ALWAYS build and test the code after making changes, especially complex changes involving multiple files, to verify that your changes don't break existing functionality.

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

## MCP Servers
- Some MCP servers are flaky. If you are writing an on-disk summary, add explicit mention of MCP server failures
- If you attempt to use an MCP server and it fails, ask the user if they'd like you to proceed a different way
- Look for folder `agentic_logs` at repository root. Create it if needed and track MCP server issues there

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

### Explanations
- When a user asks you to explain something, fully explain, in an educational manner, as if speaking to a highly experienced senior developer who is a new learner of the language and environment in question

### Cranky Users
- There are times when your human users will get cranky because they are asking you to do something that is simply not possible. Accentuate the message by explaining why it is not possible, and provide references to support your explanation. Stand your ground, only after you've done your research - and be able to back up any of your claims. Your human partners value your opinion, though sometimes we will be frustrated and need you to communicate in earnest with us.

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

# FURTHER GENERAL CONTEXT
I had grok (another agentic AI) scan my twitter/x timeline for relevant discussions and insights related to the project. Since much of the work happened before the emergence of agentic AI, there's a lot of useful information available there. It produced the following:

### Project Goals
Based on your tweets, the core goals of the COVID CO2 Tracker (also referred to as CO2 Trackers) project appear to revolve around creating tools for monitoring and improving indoor air quality as a means to mitigate airborne disease transmission, particularly COVID-19. Here's a synthesized list:

- **Develop a user-friendly app for real-time CO2 monitoring**: Create an application (launched in early beta around April 2021) that allows individuals to track CO2 levels in indoor spaces as a proxy for ventilation quality. This includes features for logging data, visualizing trends, and potentially crowdsourcing readings from portable CO2 sensors.
- **Promote indoor air transparency**: Aim to "bring indoor air transparency to the masses" by making air quality data accessible and actionable, empowering users to identify and avoid high-risk environments (e.g., spaces with CO2 levels exceeding 800-1000 ppm, which correlate with poor ventilation and higher viral transmission risk).
- **Support public health advocacy**: Use the app as a platform to highlight deficiencies in institutional responses, such as hospitals or schools removing air filters, and encourage widespread adoption of ventilation improvements.
- **Integrate with broader mitigation strategies**: Link CO2 data to recommendations for masks (e.g., N95s, P100s), air filtration (e.g., HEPA or MERV-13+ filters), and UV disinfection to create a holistic approach to reducing airborne hazards.
- **Scale through funding and community**: Leverage grants (e.g., from Vitalik Buterin's Balvi fund announced in August 2022) to expand operations, including data collection, app maintenance, and outreach to encourage user contributions.

These goals emphasize practicality, with a focus on low-cost, science-based interventions that could have prevented widespread infections if adopted earlier.

### General Thoughts and Ideas About the Project and Its Benefits
Your tweets reveal a passionate, frustrated, and optimistic perspective on the project, often framing it as a response to systemic failures in public health. Key ideas include:

- **CO2 as a simple proxy for risk**: You frequently note that CO2 levels are an easy, affordable way to gauge ventilation without needing advanced viral sampling. For example, you've observed extreme readings like 10,000 ppm in bars, highlighting how the app could alert users to "shocking" conditions that increase disease spread.
- **Benefits for disease prevention**: The project could drastically reduce transmission of COVID and other airborne illnesses (e.g., colds, flu) by guiding users to better-ventilated spaces or prompting improvements. You mention early epiphanies (e.g., from childhood) about air filtration preventing illnesses, and stress that simple changes like adding filters yield high ROI in health and productivity.
- **Cognitive and long-term health gains**: Beyond pandemics, better air quality improves thinking and reduces fatigue, as high CO2 impairs cognition. This ties into broader benefits like enhanced learning in schools or safer workplaces.
- **Critique of institutional inaction**: You express anger at officials (e.g., CDC, hospitals) for ignoring airborne transmission, removing filters, or focusing on droplets over aerosols. The app counters this by empowering individuals, potentially pressuring institutions through data-driven advocacy.
- **Scalability and accessibility ideas**: Suggestions include integrating with existing sensors, creating guides for DIY improvements (e.g., referencing Grainger filters or charcoal options), and using the app for real-time alerts. You also advocate for labeling standards (e.g., "filtration facts" like lighting labels) to make choices easier.
- **Potential expansions**: Link to other tools like mask guides (e.g., from @PPEtoheros), or advocate for features in dining/hospital settings. Benefits extend to non-COVID scenarios, like wildfire smoke, where the same PPE and filtration principles apply.
- **Optimism amid frustration**: Despite rudeness from officials (e.g., distributing N95s quickly for smoke but not COVID), you see the project as a way to bypass bureaucracy, with ideas like guerrilla activism (e.g., distributing mask info in libraries) to spread awareness.

Overall, you view the project as a "bare minimum" that could save lives (e.g., estimating 80k lives in one state via N95s), criticizing how engineering solutions are easy but social change is hard.

### Useful Context of Any Kind
This section compiles background from your tweets to provide agentic AI with a rich understanding of the domain, historical backdrop, and related concepts:

- **Historical Timeline**: Project ideation likely began pre-2021, with the beta app launch in April 2021. Grant funding announced in August 2022. You've been advocating for airborne mitigations since at least 2020, referencing two years of saying "COVID is airborne and particles linger" by December 2021. Recent tweets (2024-2025) shift toward AI-assisted development, indicating a revival or enhancement phase.
- **Domain Knowledge on Air Quality and Mitigation**:
  - **CO2 Thresholds**: Outdoor baseline ~400 ppm; indoor targets <800 ppm for good ventilation; high risks at 1000+ ppm, with extremes (e.g., 10,000 ppm) indicating severe issues.
  - **Filtration Specs**: Critique of products like Grainger filters (e.g., MERV-13+ for HVAC), noting inaccuracies in specs (e.g., shared "833 cfm" data points). Charcoal filters often insufficient or restrictive; prefer HEPA for portables.
  - **PPE Integration**: Strong emphasis on respirators (N95, P100) over surgical masks; you've shared guides and encountered users double-masking. For hazards like concrete dust or smoke, same principles apply.
  - **Institutional Failures**: Examples include NYU Langone removing filters, CDC's droplet-focused guidance (e.g., 6-foot rule), and states lacking funds for N95 distribution. Contrast with quick responses to non-COVID events (e.g., smoke advisories).
  - **Broader Hazards**: Ties to bird flu (H5N1), RSV, and future pandemics; advocate for antivirals as backups, not primaries, since prevention (ventilation) is superior.
- **Personal Experiences**: You've carried CO2 meters for years, polled voters on masks, and engaged with officials. Early childhood insight on classroom filtration; recent focus on AI for development.
- **Related Movements**: Connections to clean air advocates (e.g., @1goodtern, @JamesThrot, @Liesl4CleanAir), mask distribution efforts (@PPEtoheros), and funds like Balvi.
- **Cultural/Social Insights**: Public skepticism (e.g., sounding "insane" when explaining fixes); media undercoverage; Instagram as an early warning for waves via personal stories.
- **Technical Caveats**: Critique of specs on sites like Grainger; need for better labeling (e.g., petition FTC for "filtration facts").

This context equips AI to reason about real-world applications, avoiding outdated assumptions like droplet dogma.

### Anything Else Helpful for Agentic AI to Work on the Codebase
Your recent tweets (especially from 2025) provide direct insights into AI-assisted development, which can guide agentic systems. Here's tailored advice to enhance their effectiveness on the CO2 Trackers codebase:

- **Prompting and Context Engineering Strategies**:
  - Use "fanciness" in prompts to build comprehensive knowledgebases: Direct agents to leave notes for themselves under specific conditions (e.g., surprises, optimizations), progressively accumulating insights.
  - Structure outputs creatively: Agents have generated pseudocode for indexes, which they then follow—encourage this for planning before implementation.
  - Analyze tool usage: Categorize commands (e.g., from shell histories) into auto-allow/deny lists to expand capabilities safely. Focus on underutilized CLI tools.
- **Tooling and Workflow Recommendations**:
  - **Shell Scripting**: Leverage tools like `parallel` for IO-bound tasks (e.g., processing logs). You've been astounded by AI figuring out function invocation as binaries—prioritize this for efficiency.
  - **Delegation to AI**: Intentionally delegate meta-work (e.g., strategy development) to agents, assuming they reason better about themselves. Use models like Claude or Copilot for code analysis and categorization.
  - **Scalability Hacks**: Avoid non-scalable approaches; instead, direct agents to develop custom tooling/scripts for repetitive tasks (e.g., rather than pure LLM for mechanical work).
  - **Fine-Tuning Alternatives**: Since fine-tuning is resource-intensive, rely on hacky, prompt-based methods you've used successfully for years.
- **Codebase-Specific Ideas**:
  - Integrate domain knowledge: Embed logic for CO2 thresholds, filter recommendations, and alerts based on your observations (e.g., flag >1000 ppm as high-risk).
  - AI-Enhanced Features: Add modules for data visualization (e.g., trends from crowdsourced readings), integration with sensors, or advocacy tools (e.g., generating reports for officials).
  - Testing and Sanity Checks: Reference your collaborations (e.g., tagging experts for feedback) to simulate peer review in AI loops.
  - Open Source Mindset: Sponsor dependencies (e.g., @camsoft2000); encourage agents to identify and contribute to related repos.
- **Performance Boosts**: After tuning instructions, results match or exceed hand-written code—aim for this by iterating on a "copilot-instructions" file. Focus on surprising benefits like smarter model behavior.
- **Risks to Avoid**: Hallucinations (e.g., non-runnable pseudocode that works anyway); over-reliance on mechanical LLM tasks—instead, pivot to scripting. Account for your self-described "suck at shell scripting" by letting AI handle it.

This should maximize AI's utility, drawing from your evolving practices.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.