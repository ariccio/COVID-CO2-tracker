# ◆ COVID CO2 Tracker Semantic Knowledge Index
*AI-optimized task pattern matching for rapid context loading*
*Version 4.0.0 | Last Updated: 2025-10-17 | Total Files: 44 (25 archived) | Total Words: ~40,000*
*✓ Now with Tier System, Progressive Loading, OR-Logic Keywords, 7 Context Budget Examples*

## ⚠ ALWAYS START HERE
This index maps task patterns → relevant files with ACTUAL word counts for precise context budget management.
**Goal**: Load <20k tokens for 80% of tasks, maintain laser focus on public health mission.

## ◆ EMOJI PREFIX LEGEND (Visual Scanning)
Use these markers to quickly identify file purpose and priority:

- **⚠_CRITICAL**: Immediate action needed (errors, security, production issues)
- **✓_QUICK_FIX**: Fast solutions (<5 min, <1000 words)
- **ℹ_INFO**: Background knowledge, context, explanations
- **◆_IMPLEMENTATION**: Step-by-step guides for building features
- **★_DEEP_DIVE**: Comprehensive analysis, architecture, patterns (3000+ words)
- **◇_MAINTENANCE**: Operations, deployment, monitoring
- **⟳_REFACTOR**: Code quality, reorganization, improvements

## ■ TIER SYSTEM (Priority-Based Loading)

Load files progressively based on tier priority. Skip higher tiers unless needed.

### Tier 0: Intelligence Layer (LOAD FIRST - <1 min)
**Purpose**: Bootstrap AI with routing and context management
- `CLAUDE.md` - Cognitive router, checkpoint gates, universal instructions
- `INDEX-SEMANTIC-CO2.md` (this file) - Task pattern matching, file routing
- **Total**: ~8,000 words | Always load these first

### Tier 1: Quick References (<1000 words, <2 min)
**Purpose**: Fast answers for common issues, immediate problem-solving
- `PROBLEM_SOLUTION_MAP_CO2.md` (299 words) - Problem → solution mapping
- `rails-quick-reference-card.md` (824 words) - Essential Rails commands
- `QUICK-REFERENCE-CARD.md` (773 words) - Essential commands & shortcuts
- `GOTCHA-TEMPLATE.md` (225 words) - Template for documenting new issues
- **Scripts**: `scripts/test-suite-quick.sh`, `scripts/git-hooks/test-*.sh`
- **Total**: ~2,100 words | Load for <15 min tasks

### Tier 2: Focused Guides (1000-3000 words, 5-10 min)
**Purpose**: Targeted implementation guidance, specific domains
- `docs/export-system-implementation.md` (3,667 words) - Complete export technical docs
- `docs/export-system-analysis.md` (2,613 words) - System analysis & architecture
- `rails-architecture-deep-dive.md` (1,262 words) - Complete architecture analysis
- `rails-mcp-server-usage-guide.md` (1,204 words) - MCP server usage
- `AI-AGENT-PROJECT-CONTEXT.md` (1,203 words) - Project context for AI agents
- `RAILS_ANTI_PATTERNS.md` (1,800 words) - Common Rails mistakes to avoid
- `time-zone-ping-pong-analysis.md` (1,576 words) - CRITICAL startup failure pattern
- `RAILS_DECISION_TREES.md` (1,200 words) - Architecture decision guides
- `guides/quick/venue-leaderboard-implementation.md` (1,631 words) - 2-hour implementation
- `guides/quick/sms-alert-implementation-guide.md` (1,156 words) - 1-hour implementation
- `2025-08-28-sms-alert-enhanced-with-rails-guides.md` (1,586 words) - SMS with Rails patterns
- `2025-09-02-IMMEDIATE-ACTION-PLAN.md` (1,302 words) - Critical fixes needed NOW
- **Total**: ~20,200 words | Load for 30-60 min tasks

### Tier 3: Comprehensive Guides (3000+ words, 15-30 min)
**Purpose**: Deep dives, complete references, complex refactoring
- `HEROKU-COMPLETE-GUIDE.md` (12,186 words) - Comprehensive Heroku operations
- `EMERGENCY-PLAYBOOK-CO2.md` (2,476 words) - Production emergency procedures
- `2025-09-02-export-system-ultrathink-improvements.md` (2,419 words) - Ultra-comprehensive improvements
- `2025-09-02-AUTOMATION-OPPORTUNITIES.md` (3,125 words) - Automation analysis
- `2025-09-02-KNOWLEDGE-GAPS-CRITICAL.md` (1,839 words) - Critical missing documentation
- `MEMORY-INFRASTRUCTURE-PORTING-PLAN.md` (1,892 words) - Memory system porting
- `MASTER-REVIVAL-PLAN-2025.md` (1,414 words) - Complete revival strategy
- **Total**: ~25,350 words | Load for 1-4 hour tasks

### Tier 4: Templates & Scripts (Executable, Varies)
**Purpose**: Runnable tools, automation, executable templates
- **Scripts directory**: `scripts/test-suite-*.sh`, `scripts/git-hooks/*.sh`, `scripts/heroku-*.sh`
- **Templates**: `continuation_prompts/`, `GOTCHA-TEMPLATE.md`, `DOCUMENTATION-TEMPLATE.md`
- **Automation**: Test runners, deployment scripts, git hooks
- **Total**: Varies | Load when need to run or automate

### Tier 5: Archive (Only If Investigating Past Decisions)
**Purpose**: Historical context, superseded docs, old sessions
- `archived_claude_and_copilot_dont_bother_reading_these_normally/` (25 files, ~35,000 words)
- **Skip unless**: Investigating why something was changed, understanding historical decisions
- **Total**: ~35,000 words | ⚠ Skip during normal operations

## → PROGRESSIVE LOADING STRATEGY

Use these stages to avoid over-loading or under-loading context. Start minimal, expand as needed.

### Stage 1: Reconnaissance (0 tokens, <1 min)
**Goal**: Identify what you need without loading anything heavy
1. **Check this INDEX** for task patterns (keyword search)
2. **Use Glob** to find relevant files: `glob "**/*export*.md"`
3. **Scan directory structure** for new/active work: `ls copilot_notes/active-sessions/`
4. **Identify tier level** needed based on task complexity

**Decision Point**: Can I solve with Tier 1 quick refs? → Stage 2 | Need deeper understanding? → Stage 3

### Stage 2: Quick References (500-1000 tokens, 2-5 min)
**Goal**: Fast problem-solving with minimal context loading
1. **Load Tier 0** (if not already loaded): CLAUDE.md, INDEX
2. **Load Tier 1 quick refs**: PROBLEM_SOLUTION_MAP_CO2.md, rails-quick-reference-card.md
3. **Check scripts** for automation: `ls scripts/*.sh`
4. **Scan task patterns** in INDEX for specific file recommendations

**Decision Point**: Is solution clear? → Implement | Need implementation details? → Stage 3

### Stage 3: Focused Guides (2000-5000 tokens, 10-15 min)
**Goal**: Load specific implementation guides for targeted work
1. **Load Tier 2 focused guides** related to your task
2. **Load relevant code files** (models, controllers, services)
3. **Load architecture docs** if modifying structure
4. **Check file dependencies** in INDEX to ensure completeness

**Decision Point**: Can I implement now? → Start work | Need comprehensive understanding? → Stage 4

### Stage 4: Comprehensive Deep Dives (10000+ tokens, 30+ min)
**Goal**: Full understanding for complex refactoring, architecture changes, or multi-file work
1. **Load Tier 3 comprehensive guides**
2. **Load all relevant deep dives**
3. **Load extensive code analysis**
4. **Load historical context** if needed (Tier 5 archive)
5. **Review file dependencies** to ensure nothing missed

**Decision Point**: Full understanding achieved → Execute complex work | Context limit approaching? → Create continuation prompt

## ■ FILE CATALOG BY CATEGORY

### ⚠ Emergency & Production Operations (5,507 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `EMERGENCY-PLAYBOOK-CO2.md` | 2,476 | Production emergency procedures | crash, outage, H10, R14, memory |
| `HEROKU-COMPLETE-GUIDE.md` | 12,186 | Comprehensive Heroku operations guide | deploy, logs, config, restart, memory, database, monitoring |
| `deep-research-reports/compass_artifact_wf-Heroku-*.md` | 2,160 | Comprehensive Heroku operations | deep dive, research |
*Note: 8 Heroku files archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/heroku/` - content consolidated into HEROKU-COMPLETE-GUIDE.md*
*Note: Production environment snapshot archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/completed/` - historical reference*

### ▪ Export System Documentation (21,206 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `docs/export-system-implementation.md` | 3,667 | Complete technical documentation | implementation, API, streaming |
| `docs/export-system-analysis.md` | 2,613 | System analysis & architecture | design, patterns, decisions |
| `2025-09-02-export-system-ultrathink-improvements.md` | 2,419 | Ultra-comprehensive improvements | security, performance, UX |
| `2025-08-28-sms-alert-enhanced-with-rails-guides.md` | 1,586 | SMS alerts with Rails patterns | Twilio, ActionMailer, jobs |
| `2025-09-02-export-system-production-readiness-plan.md` | 1,304 | Production deployment checklist | validation, testing, rollout |
| `2025-09-02-IMMEDIATE-ACTION-PLAN.md` | 1,302 | Critical fixes needed NOW | security, bugs, performance |
| `guides/quick/venue-leaderboard-implementation.md` | 1,631 | Public venue rankings | 2-hour implementation |
| `guides/quick/sms-alert-implementation-guide.md` | 1,156 | SMS alerts in 1 hour | quick win, Twilio |
| `2025-08-31-production-deployment-plan.md` | 1,625 | Deployment strategy & steps | rollout, validation |
| `docs/api/export-endpoints.md` | 880 | API endpoint documentation | routes, parameters, responses |
| `docs/EXPORT_SYSTEM_PRODUCTION_READY.md` | 700 | Production readiness summary | checklist, status |

*Note: 6 export planning files archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/superseded/` - consolidated into current implementation docs*

### ▫ Rails Architecture & MCP Tools (8,957 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `rails-architecture-deep-dive.md` | 1,262 | Complete architecture analysis | models, controllers, services |
| `rails-mcp-server-usage-guide.md` | 1,204 | How to use Rails MCP server | navigate, analyze, inspect |
| `rails-quick-reference-card.md` | 824 | Rails commands & patterns | console, migrations, tests |
| `AI-AGENT-PROJECT-CONTEXT.md` | 1,203 | Project context for AI agents | background, goals, structure |
| `rails-console-runtime-insights-2025-09-08.md` | 738 | Runtime type info & SQL patterns | console, types, queries, performance |

*Note: 4 exploration files archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/exploratory/` - insights integrated into main guides*
*Note: Project architecture overview archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/completed/` - superseded by detailed guide*

### ◆ Knowledge Infrastructure (14,432 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `2025-09-02-AUTOMATION-OPPORTUNITIES.md` | 3,125 | Automation analysis | scripts, tools, efficiency |
| `MEMORY-INFRASTRUCTURE-PORTING-PLAN.md` | 1,892 | Memory system porting | context, preservation |
| `2025-09-02-KNOWLEDGE-GAPS-CRITICAL.md` | 1,839 | Critical missing documentation | gaps, needed, priority |
| `2025-09-02-SUBAGENT-PROMPTS.md` | 1,468 | Delegation prompt templates | subagents, tasks |
| `2025-09-02-KNOWLEDGEBASE-PRAGMATIC-PLAN.md` | 1,240 | Practical improvements | tonight, actionable |

*Note: 3 advanced concept files archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/advanced-concepts/` - future vision documents*
*Note: Memory setup summary archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/completed/` - setup complete*

### → Quick References & Guides (5,554 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `MASTER-REVIVAL-PLAN-2025.md` | 1,414 | Complete revival strategy | roadmap, priorities, timeline |
| `TECHNICAL-UPGRADE-GUIDE.md` | 1,227 | Technical debt solutions | upgrades, modernization |
| `FEATURE-PRIORITY-MATRIX.md` | 1,074 | Impact vs effort analysis | priorities, quick wins |
| `IMPLEMENTATION-QUICKSTART.md` | 958 | Quick start guide | setup, getting started |
| `QUICK-REFERENCE-CARD.md` | 773 | Essential commands | commands, shortcuts, tips |
| `rubocop-complexity-reduction-pattern.md` | 674 | Proven patterns for reducing complexity | refactoring, ABC, rubocop, orchestration |
| `PROBLEM_SOLUTION_MAP_CO2.md` | 299 | Problem → solution mapping | troubleshooting, fixes |

### ⚠ CRITICAL: Known Issues & Anti-Patterns (5,885 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `RAILS_ANTI_PATTERNS.md` | 1,800 | Common Rails mistakes to avoid | N+1, queries, services, testing |
| `time-zone-ping-pong-analysis.md` | 1,576 | Time.zone startup failure pattern | CRITICAL, Rails init, Time.now |
| `RAILS_DECISION_TREES.md` | 1,200 | Architecture decision guides | patterns, choices, service vs model |
| `ai-session-pattern-analysis.md` | 1,084 | AI session behavior patterns | sessions, memory, patterns |
| `GOTCHA-TEMPLATE.md` | 225 | Template for documenting gotchas | template, documentation |

### ※ Session & Continuation Files (2,410 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `2025-09-02-session-context-complete.md` | 975 | Complete session context | export system, production |
| `2025-09-02-continuation-prompt.md` | 435 | Current continuation template | latest, improved |
| `2025-09-02-ultra-compressed-context.md` | 150 | Minimal context handoff | compressed, emergency |

*Note: 15+ session files archived to `archived_claude_and_copilot_dont_bother_reading_these_normally/sessions/` and `archived_claude_and_copilot_dont_bother_reading_these_normally/continuation/` - historical contexts preserved*

### □ Documentation Standards (1,764 words)
| File | Words | Description | Keywords |
|------|-------|-------------|----------|
| `EXAMPLE-IMPROVED-DOCUMENTATION.md` | 968 | Documentation example | format, standards |
| `token-counting-calibration-note-for-deedee.md` | 623 | Token counting insights | context, management |
| `AI-DOCUMENTATION-INSTRUCTIONS.md` | 288 | Documentation standards | quality, format |
| `DOCUMENTATION-TEMPLATE.md` | 219 | Documentation template | template, structure |

## → TASK PATTERN MATCHER V3 (Keyword OR-Logic)

Use keyword search with OR-logic (pipe `|` separator) to find relevant files fast.
Keywords are case-insensitive. Multiple matches possible.

### Primary Task Patterns (Keyword OR-Logic)

#### "export" | "api" | "streaming" | "token" | "csv" | "json"
**Export System Work** - Token rate limiting, API endpoints, data streaming
```yaml
⚠_CRITICAL: 2025-09-02-IMMEDIATE-ACTION-PLAN.md (1,302 words) # Security fixes
◆_IMPLEMENTATION: docs/export-system-implementation.md (3,667 words) # Complete technical docs
★_DEEP_DIVE: docs/export-system-analysis.md (2,613 words) # System architecture
★_IMPROVEMENTS: 2025-09-02-export-system-ultrathink-improvements.md (2,419 words) # Comprehensive enhancements
◇_DEPLOYMENT: 2025-09-02-export-system-production-readiness-plan.md (1,304 words) # Production checklist
◇_DEPLOYMENT: 2025-08-31-production-deployment-plan.md (1,625 words) # Deployment strategy
ℹ_ENDPOINTS: docs/api/export-endpoints.md (880 words) # API documentation
✓_STATUS: docs/EXPORT_SYSTEM_PRODUCTION_READY.md (700 words) # Production readiness
Total: ~14,500 words | Tier 2-3 | Stage 3-4 for complex work
```

#### "heroku" | "deployment" | "production" | "dyno" | "logs" | "config"
**Heroku Operations** - Deploy, monitor, troubleshoot production
```yaml
⚠_EMERGENCY: EMERGENCY-PLAYBOOK-CO2.md (2,476 words) # Production outage procedures
★_COMPREHENSIVE: HEROKU-COMPLETE-GUIDE.md (12,186 words) # Complete Heroku operations
★_RESEARCH: deep-research-reports/compass_artifact_wf-Heroku-*.md (2,160 words) # Deep dive
◇_DEPLOYMENT: 2025-08-31-production-deployment-plan.md (1,625 words) # Deployment steps
Total: ~18,500 words | Tier 3 | Stage 4 for comprehensive understanding
```

#### "co2" | "sensor" | "measurement" | "air quality" | "ventilation" | "ppm"
**CO2 Domain & Public Health** - Core domain knowledge, measurement science
```yaml
ℹ_PROJECT: AI-AGENT-PROJECT-CONTEXT.md (1,203 words) # Project background & goals
ℹ_DOMAIN: CLAUDE.md (relevant sections) # Public health context, project mission
◆_FEATURES: guides/quick/venue-leaderboard-implementation.md (1,631 words) # Public venue rankings
ℹ_ARCHITECTURE: rails-architecture-deep-dive.md (1,262 words) # Measurement model
Total: ~4,100 words | Tier 1-2 | Stage 2-3 for domain understanding
```

#### "rails" | "activerecord" | "model" | "migration" | "controller" | "service"
**Rails Architecture** - Models, controllers, services, patterns
```yaml
✓_QUICK: rails-quick-reference-card.md (824 words) # Essential commands
◆_ARCHITECTURE: rails-architecture-deep-dive.md (1,262 words) # Complete architecture
◆_MCP: rails-mcp-server-usage-guide.md (1,204 words) # MCP server navigation
⚠_ANTI_PATTERNS: RAILS_ANTI_PATTERNS.md (1,800 words) # Common mistakes to avoid
ℹ_DECISIONS: RAILS_DECISION_TREES.md (1,200 words) # Architecture decision guides
ℹ_RUNTIME: rails-console-runtime-insights-2025-09-08.md (738 words) # Console & SQL patterns
Total: ~7,000 words | Tier 1-2 | Stage 2-3 for architecture work
```

#### "test" | "rspec" | "spec" | "testing" | "ci" | "continuous integration"
**Testing & Quality** - Test suites, RSpec, CI/CD
```yaml
✓_QUICK: scripts/test-suite-quick.sh # Fast feedback loop
◆_FULL: scripts/test-suite-full.sh # Complete test suite
◆_INFRASTRUCTURE: quality_infrastructure/README.md # CI/CD documentation
ℹ_PATTERNS: RAILS_ANTI_PATTERNS.md#testing-patterns (relevant section) # Testing best practices
Total: Varies | Tier 1 & 4 | Stage 2 for quick testing
```

#### "git hooks" | "pre-commit" | "lefthook" | "gitleaks" | "pre-push"
**Git Hooks & Security** - Pre-commit hooks, secret detection, automation (NEW from Phase 3)
```yaml
◆_INFRASTRUCTURE: quality_infrastructure/README.md # Hook setup documentation
◆_SCRIPTS: scripts/git-hooks/*.sh # Hook implementations
⚠_SECURITY: .lefthook.yml # Hook configuration
⚠_SECURITY: scripts/git-hooks/pre-commit # Gitleaks, rubocop, tests
✓_TEST: scripts/git-hooks/test-*.sh # Hook testing scripts
Total: ~2,000 words | Tier 4 | Stage 2 for hook work
```

#### "security" | "secrets" | "credentials" | "leak" | "gitleaks" | "env"
**Security & Secrets** - Credential management, leak detection (NEW from Phase 3)
```yaml
⚠_CRITICAL: 2025-09-02-IMMEDIATE-ACTION-PLAN.md (1,302 words) # Security fixes
⚠_HOOKS: scripts/git-hooks/pre-commit # Gitleaks integration
⚠_CONFIG: .lefthook.yml # Security hook configuration
ℹ_RAILS: RAILS_ANTI_PATTERNS.md#security-patterns (relevant section) # Security best practices
Total: ~2,500 words | Tier 2 | Stage 2 for security work
```

#### "tty-colors" | "ci/cd" | "github desktop" | "terminal" | "ansi"
**CI/CD & Terminal Issues** - TTY detection, color codes, GitHub Desktop compatibility (NEW from Phase 3)
```yaml
◆_INFRASTRUCTURE: quality_infrastructure/README.md # CI/CD documentation
◆_SCRIPTS: scripts/git-hooks/*.sh # TTY-aware scripts
✓_QUICK: PROBLEM_SOLUTION_MAP_CO2.md # Common CI/CD issues
Total: ~1,500 words | Tier 4 | Stage 2 for CI/CD work
```

#### "cognitive routing" | "checkpoint gates" | "degeneration detection" | "context management"
**Cognitive Infrastructure** - AI decision-making, quality checkpoints (NEW from Phase 2)
```yaml
ℹ_CRITICAL: CLAUDE.md (relevant sections) # Cognitive router, checkpoint gates
ℹ_INDEX: INDEX-SEMANTIC-CO2.md (this file) # Task pattern matching, routing
◆_MEMORY: MEMORY-INFRASTRUCTURE-PORTING-PLAN.md (1,892 words) # Memory system
◆_SUBAGENTS: 2025-09-02-SUBAGENT-PROMPTS.md (1,468 words) # Delegation templates
ℹ_PATTERNS: ai-session-pattern-analysis.md (1,084 words) # Session behavior patterns
Total: ~12,000 words | Tier 0-2 | Stage 3 for meta-work
```

#### "context budget" | "token limit" | "out of context" | "continuation" | "handoff"
**Context Management** - Token budgets, session continuation, handoffs (NEW from Phase 2)
```yaml
ℹ_INDEX: INDEX-SEMANTIC-CO2.md (this file) # Context budgets, token recommendations
◆_CONTINUATION: continuation_prompts/ # Session handoff prompts
◆_TEMPLATES: 2025-09-02-continuation-prompt.md (435 words) # Current template
✓_COMPRESSED: 2025-09-02-ultra-compressed-context.md (150 words) # Emergency handoff
ℹ_CALIBRATION: token-counting-calibration-note-for-deedee.md (623 words) # Token insights
Total: ~3,000 words | Tier 1-4 | Stage 2 for continuation work
```

#### "archive" | "historical" | "dont_bother_reading" | "superseded" | "old"
**Archive Navigation** - Historical context, superseded docs (NEW from Phase 4)
```yaml
⚠_SKIP: archived_claude_and_copilot_dont_bother_reading_these_normally/ # 25 files, ~35k words
ℹ_INDEX: INDEX-SEMANTIC-CO2.md#archived-files (this file) # Archive documentation
Total: ~35,000 words | Tier 5 | Skip unless investigating past decisions
```

#### "refactor" | "complexity" | "rubocop" | "abc metric" | "code quality"
**Refactoring & Code Quality** - Complexity reduction, safe refactoring patterns
```yaml
⚠_SAFETY: REFACTOR_RISK_PATTERNS.md (675 words) # Safety checks & patterns
◆_PATTERNS: rubocop-complexity-reduction-pattern.md (547 words) # Proven patterns
◆_IMPLEMENTATION: REFACTOR_SAFETY_IMPLEMENTATION_GUIDE.md (678 words) # For other repos
⚠_ANTI_PATTERNS: RAILS_ANTI_PATTERNS.md (1,800 words) # Common mistakes
⟳_LAUNCH: Subagent for verification (>50 lines changed) # Safety protocol
Total: ~2,900 words | Tier 2 | Stage 2-3 for refactoring
```

#### "time zone" | "Time.zone" | "startup" | "initialization" | "boot" | "config"
**Critical Rails Gotchas** - Startup failures, initialization order issues
```yaml
⚠_CRITICAL: time-zone-ping-pong-analysis.md (1,576 words) # READ THIS FIRST
⚠_CONFIG: .rubocop.yml # Check exclusions before "fixing"
ℹ_ANTI_PATTERNS: RAILS_ANTI_PATTERNS.md (1,800 words) # Framework initialization awareness
✓_TEMPLATE: GOTCHA-TEMPLATE.md (225 words) # Document new gotchas
Total: ~3,600 words | Tier 1-2 | Stage 2 BEFORE making config changes
```

#### "sms" | "twilio" | "alerts" | "notifications" | "actionmailer" | "background jobs"
**SMS Alerts Implementation** - Twilio integration, notifications
```yaml
◆_QUICK_WIN: guides/quick/sms-alert-implementation-guide.md (1,156 words) # 1-hour implementation
◆_ENHANCED: 2025-08-28-sms-alert-enhanced-with-rails-guides.md (1,586 words) # Rails patterns
ℹ_ARCHITECTURE: rails-architecture-deep-dive.md (1,262 words) # Background job infrastructure
Total: ~4,000 words | Tier 2 | Stage 3 for 1-hour quick win
```

#### "venue" | "leaderboard" | "public" | "rankings" | "place model"
**Venue Leaderboard Implementation** - Public venue rankings
```yaml
◆_QUICK_WIN: guides/quick/venue-leaderboard-implementation.md (1,631 words) # 2-hour implementation
ℹ_ARCHITECTURE: rails-architecture-deep-dive.md (1,262 words) # Place model understanding
Total: ~2,900 words | Tier 2 | Stage 3 for 2-hour quick win
```

#### "memory" | "r14" | "crash" | "out of memory" | "oom" | "dyno restart"
**Memory Issues & Crashes** - Production memory troubleshooting
```yaml
⚠_EMERGENCY: EMERGENCY-PLAYBOOK-CO2.md (2,476 words) # Immediate procedures
◇_HEROKU: HEROKU-COMPLETE-GUIDE.md#memory-management (relevant sections) # Memory optimization
◇_MONITORING: HEROKU-COMPLETE-GUIDE.md#monitoring (relevant sections) # Dyno monitoring
Total: ~8,000 words | Tier 3 | Stage 4 for emergency response
```

### When You Need To...

#### AVOID KNOWN GOTCHAS (READ FIRST)
```yaml
Time.zone Issues in Config Files:
  1. time-zone-ping-pong-analysis.md (1,576 words) # CRITICAL - READ THIS
  2. Check .rubocop.yml exclusions before "fixing" anything
  Total: ~1,600 words

AI Session Issues:
  1. ai-session-pattern-analysis.md (1,084 words) # Understand patterns
  2. GOTCHA-TEMPLATE.md (225 words) # How to document new issues
  Total: ~1,300 words
```

#### Refactor Code / Fix Complexity Issues
```yaml
Rubocop/Complexity Violations:
  1. REFACTOR_RISK_PATTERNS.md (675 words) # Safety checks & patterns
  2. rubocop-complexity-reduction-pattern.md (547 words) # Proven patterns
  3. REFACTOR_SAFETY_IMPLEMENTATION_GUIDE.md (678 words) # For other repos
  Total: ~1,900 words
  
Quick Refactoring:
  1. REFACTOR_RISK_PATTERNS.md#quick-mental-checklist (200 words)
  2. Launch verification subagent for changes >50 lines
  Total: ~200 words + subagent
```

#### Fix Production Issues
```yaml
EMERGENCY (Memory/Crash/Outage):
  1. EMERGENCY-PLAYBOOK-CO2.md (2,476 words) # START HERE
  2. HEROKU-COMPLETE-GUIDE.md#emergency-commands (relevant sections)
  3. HEROKU-COMPLETE-GUIDE.md#troubleshooting (relevant sections)
  Total: ~4,500 words

Database Issues:
  1. HEROKU-COMPLETE-GUIDE.md#database-management (relevant sections)
  2. EMERGENCY-PLAYBOOK-CO2.md#database-locked
  Total: ~3,000 words

Export System Issues:
  1. 2025-09-02-IMMEDIATE-ACTION-PLAN.md (1,302 words)
  2. HEROKU-COMPLETE-GUIDE.md#export-system-deployment (relevant sections)
  Total: ~3,000 words
```

#### Deploy Changes
```yaml
Standard Deployment:
  1. HEROKU-COMPLETE-GUIDE.md#deployment-commands (relevant sections)
  2. 2025-08-31-production-deployment-plan.md (1,625 words)
  Total: ~2,500 words

Export System Deployment:
  1. 2025-09-02-export-system-production-readiness-plan.md (1,304 words)
  2. docs/EXPORT_SYSTEM_PRODUCTION_READY.md (700 words)
  3. HEROKU-COMPLETE-GUIDE.md#export-system-deployment (relevant sections)
  Total: ~3,000 words
```

#### Implement Features
```yaml
SMS Alerts (1 hour):
  1. guides/quick/sms-alert-implementation-guide.md (1,156 words)
  2. 2025-08-28-sms-alert-enhanced-with-rails-guides.md (1,586 words)
  Total: ~2,750 words

Venue Leaderboard (2 hours):
  1. guides/quick/venue-leaderboard-implementation.md (1,631 words)
  Total: ~1,650 words

Export System:
  1. docs/export-system-implementation.md (3,667 words)
  2. 2025-09-02-export-system-production-readiness-plan.md (1,304 words)
  Total: ~5,000 words
  *Note: Legacy plans archived - use current implementation docs*
```

#### Navigate Codebase
```yaml
Rails Navigation:
  1. rails-mcp-server-usage-guide.md (1,204 words)
  2. rails-quick-reference-card.md (824 words)
  3. rails-architecture-deep-dive.md (1,262 words)
  Total: ~3,300 words

Understanding Architecture:
  1. rails-architecture-deep-dive.md (1,262 words)
  2. project-architecture-overview.md (123 words)
  3. AI-AGENT-PROJECT-CONTEXT.md (1,203 words)
  Total: ~2,600 words

Database & Runtime Inspection:
  1. rails-console-runtime-insights-2025-09-08.md (738 words)
  2. rails-quick-reference-card.md (824 words)
  Total: ~1,600 words
```

## ■ CONTEXT BUDGET RECOMMENDATIONS

### By Task Duration
| Duration | Token Budget | Files to Load | Strategy |
|----------|-------------|---------------|----------|
| <15 min | <3,000 | 1-2 files | Quick refs only |
| 15-30 min | <5,000 | 2-3 files | Quick + specific guide |
| 30-60 min | <10,000 | 3-5 files | Multiple focused guides |
| 1-2 hours | <15,000 | 5-8 files | Comprehensive guides |
| 2-4 hours | <25,000 | 8-12 files | Full category loading |
| >4 hours | No limit | Use continuation | Multi-session work |

### By Task Type
| Task Type | Typical Budget | Example Load |
|-----------|---------------|--------------|
| Emergency Fix | 4,000 tokens | EMERGENCY-PLAYBOOK + quick ref |
| Feature Implementation | 8,000 tokens | Guide + enhanced + architecture |
| Deployment | 3,000 tokens | Commands + checklist |
| Research/Analysis | 15,000 tokens | Multiple deep dives |
| Architecture Change | 25,000 tokens | All architecture docs |

### Practical Context Budget Examples

#### Example 1: Simple Bug Fix (<30 min)
**Task**: "Fix 500 error on export endpoint"
```yaml
Budget: 3,000 tokens (~2,250 words)
Load:
  - Tier 0: INDEX-SEMANTIC-CO2.md (this file) - 300 tokens
  - Tier 1: PROBLEM_SOLUTION_MAP_CO2.md (299 words) - 400 tokens
  - Tier 1: rails-quick-reference-card.md (824 words) - 1,100 tokens
  - Tier 2: docs/export-system-implementation.md (relevant sections) - 1,200 tokens
Total: ~3,000 tokens
Strategy: Stage 2 loading, focus on error handling sections
```

#### Example 2: Feature Addition (1-2 hours)
**Task**: "Add CSV export format support"
```yaml
Budget: 8,000 tokens (~6,000 words)
Load:
  - Tier 0: INDEX + CLAUDE.md - 800 tokens
  - Tier 2: docs/export-system-implementation.md (3,667 words) - 4,900 tokens
  - Tier 2: docs/export-system-analysis.md (2,613 words) - 3,500 tokens
  - Tier 1: rails-quick-reference-card.md (824 words) - 1,100 tokens
Total: ~10,300 tokens (over budget, adjust by skipping analysis or using relevant sections)
Strategy: Stage 3 loading, focus on implementation guide
Adjustment: Load export-implementation fully, use only relevant sections of analysis
```

#### Example 3: Export System Refactoring (2-4 hours)
**Task**: "Refactor token rate limiting for better performance"
```yaml
Budget: 15,000 tokens (~11,250 words)
Load:
  - Tier 0: INDEX + CLAUDE.md - 800 tokens
  - Tier 2: 2025-09-02-IMMEDIATE-ACTION-PLAN.md (1,302 words) - 1,750 tokens
  - Tier 2: docs/export-system-implementation.md (3,667 words) - 4,900 tokens
  - Tier 2: docs/export-system-analysis.md (2,613 words) - 3,500 tokens
  - Tier 3: 2025-09-02-export-system-ultrathink-improvements.md (2,419 words) - 3,225 tokens
  - Tier 2: REFACTOR_RISK_PATTERNS.md (675 words) - 900 tokens
  - Tier 2: rubocop-complexity-reduction-pattern.md (547 words) - 730 tokens
Total: ~15,805 tokens (slightly over, acceptable)
Strategy: Stage 4 loading, comprehensive understanding before refactoring
Warning: Launch verification subagent if changes exceed 50 lines
```

#### Example 4: Heroku Production Emergency (varies)
**Task**: "Site down, H10 error, memory spike"
```yaml
Budget: 5,000 tokens (~3,750 words)
Load:
  - Tier 0: INDEX-SEMANTIC-CO2.md (this file) - 300 tokens
  - Tier 3: EMERGENCY-PLAYBOOK-CO2.md (2,476 words) - 3,300 tokens
  - Tier 3: HEROKU-COMPLETE-GUIDE.md#emergency-commands (relevant sections) - 1,500 tokens
Total: ~5,100 tokens
Strategy: Stage 4 emergency loading, prioritize immediate action steps
Note: Skip comprehensive Heroku guide (12,186 words), use only emergency sections
```

#### Example 5: Database Schema Change (1-2 hours)
**Task**: "Add new table for user preferences with migration"
```yaml
Budget: 10,000 tokens (~7,500 words)
Load:
  - Tier 0: INDEX + CLAUDE.md - 800 tokens
  - Tier 1: rails-quick-reference-card.md (824 words) - 1,100 tokens
  - Tier 2: rails-architecture-deep-dive.md (1,262 words) - 1,700 tokens
  - Tier 2: RAILS_ANTI_PATTERNS.md (1,800 words) - 2,400 tokens
  - Tier 2: RAILS_DECISION_TREES.md (1,200 words) - 1,600 tokens
  - Tier 2: rails-console-runtime-insights-2025-09-08.md (738 words) - 985 tokens
Total: ~8,585 tokens
Strategy: Stage 3 loading, focus on Rails patterns and migration best practices
Reminder: Test with rails runner after migration, check for N+1 queries
```

#### Example 6: Git Hooks Setup (30-60 min)
**Task**: "Configure pre-commit hook with gitleaks and rubocop"
```yaml
Budget: 5,000 tokens (~3,750 words)
Load:
  - Tier 0: INDEX-SEMANTIC-CO2.md (this file) - 300 tokens
  - Tier 4: quality_infrastructure/README.md (~800 words estimated) - 1,100 tokens
  - Tier 4: scripts/git-hooks/pre-commit (script, ~200 lines) - 800 tokens
  - Tier 4: .lefthook.yml (config, ~100 lines) - 400 tokens
  - Tier 1: PROBLEM_SOLUTION_MAP_CO2.md (299 words) - 400 tokens
Total: ~3,000 tokens
Strategy: Stage 2 loading, focus on infrastructure and scripts
Note: Most of the work is reading scripts and config files, not docs
```

#### Example 7: Complex Architecture Investigation (>4 hours)
**Task**: "Understand entire export system flow from API to background jobs"
```yaml
Budget: 25,000+ tokens (~18,750+ words)
Load:
  - Tier 0: Full CLAUDE.md + INDEX - 1,500 tokens
  - Tier 2: All export system docs (4 files, ~10,000 words) - 13,400 tokens
  - Tier 2: rails-architecture-deep-dive.md (1,262 words) - 1,700 tokens
  - Tier 3: HEROKU-COMPLETE-GUIDE.md (relevant sections, ~3,000 words) - 4,000 tokens
  - Tier 2: RAILS_ANTI_PATTERNS.md (1,800 words) - 2,400 tokens
  - Tier 2: RAILS_DECISION_TREES.md (1,200 words) - 1,600 tokens
  - Code files: app/controllers/api/v1/export_controller.rb, services, models - 5,000 tokens
Total: ~29,600 tokens
Strategy: Stage 4 comprehensive loading, prepare for multi-session work
Warning: Approaching context limit, create continuation prompt at 80% capacity
Recommendation: Break into multiple sessions with specific focus areas
```

### Token Efficiency Tips

1. **Use relevant sections**: Don't load HEROKU-COMPLETE-GUIDE.md (12,186 words) entirely for a single command
2. **Leverage Tier 1 first**: Quick refs solve 60% of problems with <2,000 tokens
3. **Defer Tier 3**: Load comprehensive guides only when Tier 2 insufficient
4. **Skip archives**: Tier 5 archive contains 35,000 words - only load if investigating historical decisions
5. **Use scripts over docs**: `scripts/test-suite-quick.sh` is more efficient than reading testing documentation
6. **Progressive loading**: Start Stage 2, expand to Stage 3 only if needed
7. **Word-to-token ratio**: ~0.75 words per token (824 words ≈ 1,100 tokens)
8. **Context limit awareness**: At 150k tokens (~112k words loaded), start creating continuation prompts

## ▶ QUICK COMMANDS REFERENCE

### Heroku Emergency Commands
```bash
# Site down - immediate actions
heroku ps --app covid-co2-tracker
heroku restart --app covid-co2-tracker
heroku logs --tail --app covid-co2-tracker | grep ERROR

# Memory issues (R14)
heroku ps:scale web=0 --app covid-co2-tracker
heroku ps:scale web=1:standard-1x --app covid-co2-tracker

# Database locked
heroku pg:killall --app covid-co2-tracker
heroku run rails db:migrate --app covid-co2-tracker
```

### Development Commands
```bash
# Rails
rails console
rails db:migrate
rails db:seed
bundle exec rspec

# Export System
rails runner scripts/test_export.rb
curl http://localhost:3000/api/v1/export/measurements.csv

# Testing
bundle exec rspec spec/services/export/
bundle exec rspec spec/requests/api/v1/export_spec.rb
```

## ◇ FILE DEPENDENCIES MAP

### Critical Dependencies
```yaml
Export System:
  Required:
    - docs/export-system-implementation.md
    - 2025-09-02-IMMEDIATE-ACTION-PLAN.md (security fixes)
  Deployment needs:
    - HEROKU-COMPLETE-GUIDE.md#export-system-deployment
  Performance needs:
    - HEROKU-COMPLETE-GUIDE.md#memory-management

Emergency Response:
  Always load together:
    - EMERGENCY-PLAYBOOK-CO2.md
    - HEROKU-COMPLETE-GUIDE.md#emergency-commands
  For database issues add:
    - HEROKU-COMPLETE-GUIDE.md#database-management

Feature Implementation:
  SMS Alerts needs:
    - Rails job infrastructure
    - Twilio configuration
  Venue Leaderboard needs:
    - Place model understanding
    - Public controller patterns
```

## → HIGH-PRIORITY ACTIONS

### Immediate (Tonight)
1. **Security Fixes**: Load `2025-09-02-IMMEDIATE-ACTION-PLAN.md` (1,302 words)
2. **Export Deployment**: Load production readiness plan (1,304 words)
3. **Knowledge Cleanup**: Archive 40+ session files

### Quick Wins (<2 hours each)
From FEATURE-PRIORITY-MATRIX.md:
1. SMS Alerts - 1 hour
2. Venue Leaderboard - 2 hours
3. CSV Export - 1 hour
4. Traffic Light UI - 1 hour

## ★ NAVIGATION TIPS

### Finding Information Fast
1. **Use Ctrl+F on this index first** - Keywords are comprehensive
2. **Check word counts** - Avoid loading 3,000+ word files unless needed
3. **Follow dependencies** - Some files require others
4. **Emergency?** Start with EMERGENCY-PLAYBOOK-CO2.md

### Pattern Recognition
- Files starting with dates are session-specific (often archive candidates)
- Files in `guides/quick/` are 1-2 hour implementations
- Files with "enhanced" have Rails-specific patterns added
- Files with "ultrathink" are comprehensive analyses

## ↑ EFFICIENCY METRICS

Current State (Post-Archive):
- **Active Files**: 41 markdown files
- **Archived Files**: 25 files (~35,000 words)
- **Active Words**: ~40,000 words
- **Average File**: ~975 words
- **Largest Files**: HEROKU-COMPLETE-GUIDE.md (12,186), docs/export-system-implementation.md (3,667)
- **Quick Wins Available**: 5 features under 2 hours each

Completed Optimizations:
- ✓ Archive 25 session/context files → reduced to 41 active files
- ✓ Consolidate 8 Heroku files → 1 comprehensive guide
- ✓ Archive old templates → 1 current template
- ✓ Archive superseded plans → current implementation docs only

## ▪ ARCHIVED FILES

⚠ **Skip unless investigating historical decisions**

Files moved to `archived_claude_and_copilot_dont_bother_reading_these_normally/` on 2025-09-02:
- **25 files archived** (~35,000 words)
- Session contexts → `archived_claude_and_copilot_dont_bother_reading_these_normally/sessions/`
- Old continuation prompts → `archived_claude_and_copilot_dont_bother_reading_these_normally/continuation/`
- Superseded export plans → `archived_claude_and_copilot_dont_bother_reading_these_normally/superseded/`
- Exploration files → `archived_claude_and_copilot_dont_bother_reading_these_normally/exploratory/`
- Advanced concepts → `archived_claude_and_copilot_dont_bother_reading_these_normally/advanced-concepts/`
- Completed setup → `archived_claude_and_copilot_dont_bother_reading_these_normally/completed/`
- Heroku documentation → `archived_claude_and_copilot_dont_bother_reading_these_normally/heroku/`

All archived files remain accessible if needed, but are explicitly marked to skip during normal operations.

## ■ NEW ORGANIZATION STRUCTURE

### active-sessions/
**Purpose**: Current work in progress
**Usage**: Check first for ongoing efforts that may relate to your task
**Contents**: Live session files being actively updated

### work_reports/
**Purpose**: Completed session documentation
**Usage**: Historical context and learnings from past work
**Contents**: Comprehensive reports on finished projects (e.g., deedee_import_completion_2025-10-17.md)

### continuation_prompts/
**Purpose**: Session handoff prompts
**Usage**: Resume interrupted work or context-limited sessions
**Contents**: Structured prompts for seamless work continuation

### quality_infrastructure/
**Purpose**: CI/CD and testing documentation
**Usage**: Hook setup, linter configuration, test suite guides
**Related**: scripts/git-hooks/, .lefthook.yml, scripts/test-suite-*.sh

### subagent_notes/
**Purpose**: Phase-based subagent context preservation
**Usage**: Orchestrated multi-phase work coordination
**Contents**: Context files for phases 1-7 of complex imports/refactorings

## ⟳ WHEN CONTEXT FILLS

At 80% capacity:
1. Save state to: `copilot_notes/2025-09-02-session-[task]-preservation.md`
2. Include: Current task, completed steps, next steps, blocking issues
3. Generate continuation prompt with specific file references
4. Use `2025-09-02-ultra-compressed-context.md` (150 words) for minimal handoff

---
*Index Version: 4.0.0 | Last Updated: 2025-10-17 | Active Files: 41 | Archived: 25 | Words: ~40,000*
*✓ PHASE 5 COMPLETE: Tier system (0-5), Progressive loading (4 stages), OR-logic (16 patterns), Context budgets (7 examples)*
*✓ DeeDee patterns integrated: Emoji prefixes, Sophisticated routing, Token efficiency tips*
*✓ 779 lines (+398 from v3.0.0) | Highly sophisticated pattern matching for rapid context discovery*