# AI Infrastructure - Extended Instructions

This directory contains specialized overflow instructions and deep-dive guides for AI coding assistants working on the COVID CO2 Tracker project.

## Purpose

The `.ai/` directory holds detailed guidance that would dilute the main `CLAUDE.md` instructions. These files are loaded **conditionally** based on:
- Task complexity (simple fix vs comprehensive refactor)
- Domain specialization needed (Rails internals, export system, Heroku operations)
- Context budget available (Tier 1-3 progressive loading)
- Specific challenges encountered (context limits, complex architecture)

**Philosophy**: Main instructions stay focused and actionable. Deep dives, edge cases, and specialized knowledge live here for conditional loading via INDEX routing patterns.

## How to Use This Directory

### Entry Points

1. **Start with main instructions**: Always begin with `/CLAUDE.md` (Tier 0 - Intelligence Layer)
2. **Use INDEX for routing**: `/copilot_notes/INDEX-SEMANTIC-CO2.md` provides task pattern matching with keyword OR-logic
3. **Load overflow conditionally**: Use these files only when specifically needed for your task
4. **Progressive loading**: Start with quick refs (Tier 1), expand to focused guides (Tier 2) only if necessary

### Tier System Integration

These files integrate with the 6-tier system from INDEX-SEMANTIC-CO2.md:

**Tier 0 (Intelligence Layer)**: CLAUDE.md, INDEX - Always load first
**Tier 1 (Quick References)**: unicode-guidelines.md, web-research-protocol.md, rails-syntax-style-guide.md (partial)
**Tier 2 (Focused Guides)**: rails-specific-patterns.md, rails-pattern-detection-protocol.md, rails-syntax-style-guide.md, mcp-rails-server-guide.md, context-compaction-protocol.md
**Tier 2-3 (Focused to Comprehensive)**: public-health-advocacy-context.md
**Tier 3 (Comprehensive)**: export-system-deep-dive.md, heroku-operations-overflow.md

## File Guide

### context-compaction-protocol.md
**When to load**: Approaching context limit (150k+ tokens), complex multi-session work, need continuation strategy
**Purpose**: Advanced techniques for managing context in Rails projects, creating seamless handoffs
**Tier**: 2 (Focused Guide)
**Word count**: ~2000 words
**Contains**:
- Context window management strategies
- Continuation prompt creation for Rails projects
- State preservation patterns for complex refactoring
- Token budgeting for long-running tasks
- File naming conventions for continuation_prompts/
- Cross-session handoff protocols

**Load when**:
- Working on 2+ hour tasks
- Complex refactoring (50+ lines, 5+ methods)
- Multi-phase implementation
- Hitting 150k token threshold
- Need to create continuation prompt

### rails-specific-patterns.md
**When to load**: Rails architecture questions, ActiveRecord issues, initialization gotchas, testing patterns
**Purpose**: Deep Rails patterns and idioms specific to this project's architecture
**Tier**: 2 (Focused Guide)
**Word count**: ~1800 words
**Contains**:
- Rails initialization gotchas (Time.zone, config order, boot sequence)
- ActiveRecord patterns (N+1 prevention, eager loading, query optimization)
- Service object patterns (module methods, explicit parameters)
- Background job best practices (Sidekiq/delayed job coordination)
- Rails testing patterns (RSpec, fixtures vs factories, test organization)
- Database migration safety (zero-downtime deploys, rollback strategies)
- Rails security patterns (mass assignment, SQL injection prevention)
- Performance optimization patterns (caching, query analysis)

**Load when**:
- Refactoring controllers or services
- Complex ActiveRecord queries
- Migration creation
- Testing strategy questions
- Initialization or config issues
- Performance optimization needed

### export-system-deep-dive.md
**When to load**: Complex export system work, rate limiting issues, token management, streaming architecture
**Purpose**: Comprehensive export system implementation details beyond main docs
**Tier**: 3 (Comprehensive)
**Word count**: ~2500 words
**Contains**:
- Token rate limiting algorithm implementation details
- CSV vs JSON format handling internals
- Streaming implementation architecture (chunks, memory, buffering)
- Error recovery and retry logic (exponential backoff, dead letter queues)
- User permissions and authorization flow (export token scoping)
- Background job coordination (Sidekiq priority, job chaining)
- Performance optimization strategies (batch sizes, memory profiling)
- Testing strategies for export system (fixtures, factories, integration tests)
- Common failure modes and debugging (memory issues, timeouts, corrupted exports)
- Export analytics and monitoring (success rates, performance metrics)

**Load when**:
- Implementing new export formats
- Debugging export failures
- Optimizing export performance
- Token system changes
- Rate limiting modifications
- Export error handling improvements

### heroku-operations-overflow.md
**When to load**: Advanced Heroku operations, deployment issues, scaling, less common Heroku tasks
**Purpose**: Extended Heroku operational knowledge beyond quick fixes in main docs
**Tier**: 3 (Comprehensive)
**Word count**: ~2000 words
**Contains**:
- PostgreSQL operations (backups, upgrades, maintenance windows, vacuuming)
- Dyno types and scaling strategies (web vs worker, autoscaling, cost optimization)
- Add-on management (Redis configuration, monitoring setup, logging aggregation)
- CI/CD pipelines (Heroku pipelines, review apps, staging workflow)
- Log aggregation and monitoring (papertrail, log parsing, alert setup)
- Rollback procedures (releases, database rollback, zero-downtime deploys)
- Performance optimization (dyno performance, database connection pooling)
- Memory profiling and R14 debugging (heap dumps, memory leak detection)
- SSL and domain configuration (custom domains, SSL certificates)
- Heroku CLI advanced commands (run:detached, pg:psql tricks)

**Load when**:
- Deployment failures
- Performance degradation
- Memory issues (R14 errors)
- Database operations needed
- Scaling strategy questions
- Add-on configuration
- Advanced troubleshooting

### mcp-rails-server-guide.md
**When to load**: Using Rails MCP server, MCP troubleshooting, wondering about available MCP tools
**Purpose**: How to effectively use the Rails MCP server for this project
**Tier**: 2 (Focused Guide)
**Word count**: ~1200 words
**Contains**:
- What the Rails MCP server provides (model introspection, schema info, routes)
- When to use it vs direct file access (trade-offs, performance)
- Available commands (switch_project, get_file, list_files, run_migration)
- Common issues and troubleshooting (connection failures, timeout issues)
- Integration with Claude Code workflow (when to invoke, what to query)
- Performance considerations (caching, repeated queries)
- Examples of effective usage patterns (model discovery, relationship mapping)
- MCP server limitations (what it can't do)

**Load when**:
- Need to understand Rails models
- Exploring database schema
- Discovering routes and controllers
- MCP connection issues
- Unsure if MCP has needed capability

### web-research-protocol.md
**When to load**: Need external documentation, API changes, unfamiliar libraries, recent Rails updates
**Purpose**: Universal protocol for when and how to research effectively
**Tier**: 1 (Quick Reference)
**Word count**: ~1000 words
**Contains**:
- When to research (unknown APIs, recent changes, library-specific patterns)
- How to formulate research queries (specific, context-rich, version-aware)
- Source evaluation (official docs, GitHub issues, Stack Overflow, blogs)
- Integration workflow (validate findings, test before implementing)
- Deep research mode (when to use Claude web, structured prompts)
- Rails/Ruby-specific resources (RailsGuides, Ruby docs, APIdock)
- COVID/public health research sources (if applicable)

**Load when**:
- Encountering unfamiliar libraries
- Rails version upgrade questions
- API deprecation warnings
- Need authoritative source
- Conflicting information in docs

### unicode-guidelines.md
**When to load**: Questions about emoji vs textual unicode, output formatting, status indicators
**Purpose**: Standards for unicode usage in code and output (extracted and refined from CLAUDE.md)
**Tier**: 1 (Quick Reference)
**Word count**: ~700 words
**Contains**:
- Emoji to unicode textual codepoint mappings (✓→✓, ✗→✗, etc.)
- Status indicators (✓✗⚠ℹ for success/error/warning/info)
- Box drawing characters (allowed for tables, progress bars, diagrams)
- Shape families (circles, diamonds, hexagons for semantic grouping)
- When to use unicode vs ASCII (terminal compatibility, professional appearance)
- Examples of good/bad usage (visual noise reduction)
- Complete replacement guidelines grouped by semantic category

**Load when**:
- Creating status output
- Formatting script output
- Building progress indicators
- Questions about emoji usage
- Professional appearance concerns

### public-health-advocacy-context.md
**When to load**: Tasks involving CO2 monitoring, public health advocacy, domain knowledge, project mission
**Purpose**: Historical context and domain expertise from user's public health work (Twitter/X timeline synthesis)
**Tier**: 2-3 (Focused to Comprehensive)
**Word count**: ~2000 words
**Contains**:
- Project goals and philosophy (CO2 monitoring as airborne disease mitigation)
- Historical timeline (2020-2025: advocacy → beta launch → AI-assisted development)
- Domain knowledge (CO2 thresholds, filtration specs, PPE integration)
- Institutional failures context (CDC droplet dogma, filter removal incidents)
- Real-world application insights (10,000 ppm bars, school ventilation)
- Public health impact priorities (life-saving features, accessibility, advocacy tools)
- Cultural context (public skepticism, grassroots activism, media undercoverage)
- Codebase guidance (why technical decisions align with mission)

**Load when**:
- Implementing CO2 measurement features
- Building advocacy or export tools
- Understanding project mission and priorities
- Designing user-facing messaging
- Making trade-offs between technical and impact goals
- Need real-world context for feature decisions

### rails-pattern-detection-protocol.md
**When to load**: Refactoring, investigating "suspicious" code, linter suggestions, initialization issues
**Purpose**: Prevents ping-pong debugging by teaching when "obvious fixes" break things
**Tier**: 2 (Focused Guide)
**Word count**: ~1000 words
**Contains**:
- Suspicious pattern recognition (when code looks wrong but is intentional)
- Investigation protocol before "fixing" (git history, comments, context analysis)
- Framework initialization awareness (boot → config → initializers → runtime)
- Time.zone gotcha (config vs runtime availability)
- Linter false positives (Rubocop suggestions that break initialization)
- Refactoring safety protocol (verification subagents for complex changes)
- Cross-session learning (check copilot_notes/ for previous ping-pongs)
- Verification requirements (rails runner tests before committing)

**Load when**:
- Rubocop suggests changes in config/ or initializers/
- Code looks "wrong" but works (old-style patterns in framework code)
- Refactoring controllers or complex methods (50+ lines)
- Linter exclusions without explanations
- Initialization or bootstrap issues
- Before "fixing" framework integration code

### rails-syntax-style-guide.md
**When to load**: Writing code, formatting questions, syntax decisions, unicode usage
**Purpose**: Project-specific syntax standards (explicitness over brevity)
**Tier**: 1-2 (Quick Reference to Focused Guide)
**Word count**: ~600 words
**Contains**:
- General syntax preferences (parentheses even when optional, explicit returns)
- Method call formatting (always use parentheses with arguments)
- Code organization (40-60 line functions, descriptive variable names)
- Conditional assignment rules (no unnamed non-boolean function results in if)
- Unicode and emoji guidelines (comprehensive emoji → textual codepoint mappings)
- Status indicator standards (✓✗⚠ℹ not ✓✗⚠ℹ)
- Box drawing allowance (progress bars, tables, diagrams)
- Cool unicode blocks reference (technical symbols, mathematical operators)

**Load when**:
- Writing or formatting Ruby/Rails code
- Questions about parentheses, braces, returns
- Unicode or emoji usage questions
- Output formatting for scripts
- Professional appearance concerns
- Style guide reference needed

## Loading Strategy Examples

### Example 1: Simple Bug Fix (<30 min)
**Task**: Fix export system bug where CSV headers are duplicated
**Load**: None (use CLAUDE.md + INDEX only)
**Reasoning**: Straightforward fix, no deep dive needed

### Example 2: Rails Architecture Question (30-60 min)
**Task**: Should I use a concern or service object for CO2 threshold calculations?
**Load**: `.ai/rails-specific-patterns.md` (Tier 2, ~1800 words)
**Reasoning**: Architectural decision needs Rails idioms and project patterns

### Example 3: Export System Feature (1-2 hours)
**Task**: Add streaming XML export format with rate limiting
**Load**:
- `.ai/export-system-deep-dive.md` (Tier 3, ~2500 words)
- `.ai/rails-specific-patterns.md` (Tier 2, ~1800 words, for service object pattern)
**Total**: ~4300 words (~5700 tokens)
**Reasoning**: Complex export work needs implementation details + architecture patterns

### Example 4: Context Approaching Limit (2+ hours)
**Task**: Large refactoring of export controller, hitting 140k tokens
**Load**: `.ai/context-compaction-protocol.md` (Tier 2, ~2000 words)
**Reasoning**: Need continuation strategy before context fills

### Example 5: Production Emergency (<30 min)
**Task**: Heroku dyno memory leak, R14 errors
**Load**: `.ai/heroku-operations-overflow.md` (Tier 3, ~2000 words, memory profiling section)
**Reasoning**: Advanced Heroku troubleshooting needed quickly

### Example 6: Unfamiliar Library (30-60 min)
**Task**: Integrate new CO2 sensor API library
**Load**: `.ai/web-research-protocol.md` (Tier 1, ~1000 words)
**Reasoning**: Need to research library docs and best practices

## Token Budgeting

**Total .ai/ content**: ~19,500 words (~26,000 tokens if all loaded)
  - Existing 8 files: ~15,000 words
  - New 3 files: ~4,500 words (public-health: 2000, pattern-detection: 1000, syntax-style: 600, README additions: 900)
**Typical usage**: 0-1 files per session (0-5k tokens)
**Heavy usage**: 2-3 files per session (5-10k tokens)
**Full load**: Rare, only for comprehensive architecture work or emergency all-hands situations

**Token efficiency tips**:
- Load sections, not entire files (most files have clear sections)
- Defer Tier 3 until Tier 2 proves insufficient
- Skip archived content (already handled by main INDEX)
- Use scripts over docs where possible
- Progressive loading: Tier 1 → Tier 2 → Tier 3 only as needed

## Integration Points

### With Main Instructions (CLAUDE.md)
- **Extended Instructions section**: CLAUDE.md references these files with tier assignments
- **Cognitive routing**: Routing layer in CLAUDE.md may direct to specific .ai/ files
- **Overflow relationship**: Main instructions stay focused, .ai/ provides depth

### With INDEX (INDEX-SEMANTIC-CO2.md)
- **Task patterns**: INDEX patterns reference .ai/ files for specialized needs
- **Tier system**: .ai/ files categorized in INDEX tier hierarchy
- **Keyword OR-logic**: INDEX patterns route to .ai/ files via keywords

### With copilot_notes/ Structure
- **continuation_prompts/**: Context compaction protocol references this folder (from Phase 4)
- **subagent_notes/**: Subagents may load .ai/ files for specialized work
- **Cross-reference**: .ai/ files may reference specific copilot_notes/ for examples

## Maintenance Guidelines

### When to Update .ai/ Files
- **Extract from CLAUDE.md**: When main instructions grow too detailed in one area
- **Consolidate docs**: When multiple sources cover same topic
- **New patterns emerge**: When repeated questions suggest missing guidance
- **Framework updates**: When Rails/Heroku/Ruby versions change patterns

### What NOT to Put Here
- **Frequently needed basics**: Those belong in CLAUDE.md or Tier 1 docs
- **Project-specific code**: Use copilot_notes/ for session-specific state
- **Temporary notes**: Use copilot_notes/work_reports/ for those
- **Historical decisions**: Use copilot_notes/archived_claude_and_copilot_dont_bother_reading_these_normally/

### File Size Guidelines
- **Quick references (Tier 1)**: 600-1000 words
- **Focused guides (Tier 2)**: 1000-2000 words
- **Comprehensive (Tier 3)**: 2000-3000 words
- **Maximum**: 3500 words (avoid encyclopedia syndrome)

## Known Integration Patterns

### Pattern 1: Rails Refactoring with Context Management
```
User: "Refactor export controller complexity"
Agent:
1. Check INDEX for "refactor" | "complexity" pattern
2. Load rails-specific-patterns.md (Tier 2, module methods, explicit parameters)
3. Start refactoring
4. If context approaches 150k: Load context-compaction-protocol.md (Tier 2)
5. Create continuation prompt if needed
```

### Pattern 2: Export System Feature Implementation
```
User: "Add JSON streaming export with compression"
Agent:
1. Check INDEX for "export" | "streaming" | "json" pattern
2. Load export-system-deep-dive.md (Tier 3, streaming architecture section)
3. Load rails-specific-patterns.md (Tier 2, service object pattern)
4. Implement feature
5. Test with scripts/data-export-test.sh
```

### Pattern 3: Production Emergency
```
User: "Heroku dyno out of memory, R14 errors"
Agent:
1. Check INDEX for "memory" | "r14" | "crash" pattern
2. Load heroku-operations-overflow.md (Tier 3, memory profiling section)
3. Diagnose with heroku logs --ps web.1 --tail
4. Apply fixes (memory optimization, dyno scaling)
5. Monitor with scripts/memory-check.sh
```

## Benefits of .ai/ Overflow Structure

### For Agents
- **Focused context**: Load exactly what's needed, nothing more
- **Progressive discovery**: Start broad (INDEX), narrow to specialized (.ai/)
- **Token efficiency**: Avoid loading irrelevant comprehensive docs
- **Clear decision points**: Tier system + patterns make loading decisions obvious

### For Developers
- **Maintainability**: Extract detailed content from main instructions without losing it
- **Discoverability**: INDEX patterns route to correct .ai/ files automatically
- **Scalability**: Add new .ai/ files without diluting main instructions
- **Cross-agent consistency**: All agents follow same overflow loading patterns

### For Project
- **Knowledge preservation**: Deep expertise captured in focused guides
- **Onboarding**: New agents load progressively as they encounter complexity
- **Documentation quality**: Specialized docs stay detailed without overwhelming newcomers
- **Cost efficiency**: Reduced token usage through conditional loading

## Troubleshooting

### Agent not loading .ai/ files
**Check**: Is task pattern in INDEX? Are tier assignments clear?
**Fix**: Add or refine INDEX pattern with explicit .ai/ file reference

### Context still filling up
**Check**: Are you loading entire files vs sections?
**Fix**: Extract specific sections, use context-compaction-protocol.md

### Can't find relevant .ai/ file
**Check**: Is knowledge in CLAUDE.md or copilot_notes/ instead?
**Fix**: Review INDEX patterns, may not need .ai/ file

### .ai/ file too long
**Check**: File word count vs tier guidelines
**Fix**: Split into multiple focused files or extract to Tier 3

## Future Expansion

Potential additional .ai/ files as project grows:
- `testing-strategies-deep-dive.md` (RSpec advanced patterns)
- `database-optimization-guide.md` (PostgreSQL tuning, indexing)
- `security-hardening-checklist.md` (Rails security beyond basics)
- `co2-domain-knowledge-extended.md` (Public health context, sensor specs)
- `api-design-patterns.md` (RESTful design, versioning, documentation)

Add new files when:
1. CLAUDE.md section exceeds 500 words
2. Repeated questions suggest missing guidance
3. New domain emerges (e.g., mobile API, third-party integrations)
4. Framework major version upgrade brings new patterns

---

**Part of COVID CO2 Tracker AI infrastructure**
**Adapted from DeeDee-Prototype patterns for Rails/Ruby domain**
**Version**: 1.1.0 (Added public-health-advocacy-context, rails-pattern-detection-protocol, rails-syntax-style-guide)
**Last updated**: 2025-10-17
**Maintained by**: Alexander Riccio + AI agents

✓ Following repository patterns and knowledge management best practices.
