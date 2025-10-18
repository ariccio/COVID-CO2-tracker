# CLAUDE.md Restructuring Plan
## Implementing DeeDee's Conditional Loading Pattern

**Date**: 2025-10-17
**Goal**: Distill COVID-CO2-tracker's CLAUDE.md (667 lines) using ALL 5 DeeDee conditional loading techniques
**Expected Result**: Optimized instruction file with 49-87% context savings through section tags and overflow files

---

## Current State Analysis

**Current CLAUDE.md**: 667 lines total

### Section Inventory with Token Estimates

| Section | Lines | Est. Tokens | Current State | Recommendation |
|---------|-------|-------------|---------------|----------------|
| Header/Intro | 1-13 | 50 | No wrapping | Keep as-is |
| Cognitive Router | 14-64 | 50 | Partial impl | ✓ Wrap in `<cognitive-router>` |
| Mandatory Checkpoints | 66-121 | 150 | No wrapping | ✓ Wrap in `<checkpoint-gates>` |
| Anti-Degeneration | 123-145 | 100 | No wrapping | ✓ Wrap in `<degeneration-detector>` |
| Context Budget Table | 147-169 | 100 | Plain markdown | ✓ Wrap in `<context-budget-manager>` |
| Project Goals | 175-180 | 100 | No activation | ✓ Section wrapper (LOW) |
| Context Management | 182-213 | 500 | No activation | ✓ Section wrapper (MEDIUM) |
| Extended Instructions | 215-250 | 800 | Good refs | Keep (gateway to overflow) |
| Rails Critical | 252-275 | 1500 | No activation | ✓ Section wrapper (HIGH) |
| **Pattern Detection** | 277-349 | **1000** | No wrapping | **➜ OVERFLOW to .ai/** |
| Architecture | 351-371 | 800 | No activation | ✓ Section wrapper (HIGH) |
| **Syntax Preferences** | 373-465 | **600** | No wrapping | **➜ OVERFLOW to .ai/** |
| Unicode Guidelines | Embedded | 400 | Refs .ai/ file | Keep inline, enhance ref |
| Error Handling | 467-474 | 500 | No activation | ✓ Section wrapper (CRITICAL) |
| Automation | 476-493 | 400 | No activation | ✓ Section wrapper (MEDIUM) |
| Documentation | 495-506 | 200 | No activation | ✓ Section wrapper (LOW) |
| Decision Trees | 508-514 | 300 | No activation | ✓ Section wrapper (MEDIUM) |
| File Reference Format | 516-519 | 50 | Inline | Keep as-is (too small) |
| Verify by Building | 521-522 | 100 | No activation | ✓ Section wrapper (HIGH) |
| Subagent Protocol | 524-534 | 400 | No activation | ✓ Section wrapper (HIGH) |
| MCP Servers | 536-539 | 300 | No activation | ✓ Section wrapper (MEDIUM) |
| Meta Instructions | 541-575 | 400 | Mixed content | ✓ Section wrapper (MEDIUM) |
| Agent Config | 576-596 | 200 | No activation | ✓ Section wrapper (LOW) |
| **Twitter/Grok Context** | 598-662 | **~2000** | Inline | **➜ OVERFLOW to .ai/** |

**Total Current Load**: ~10,000 tokens (entire file always loaded)
**Total After Optimization**: 1,000-2,500 tokens (depending on task type)

---

## Phase 1: Move Overflow Content to .ai/ Files

### 1.1 Public Health Advocacy Context
**Source**: Lines 598-662 (~2000 tokens)
**Destination**: `.ai/public-health-advocacy-context.md`
**Why**: Domain-specific, infrequently needed, large
**Activation**: "co2|advocacy|public health|grok context"

**Content**:
- Project Goals (Twitter perspective)
- General Thoughts and Ideas
- Useful Context (domain knowledge, historical timeline)
- Anything Else Helpful for Agentic AI

### 1.2 Rails Pattern Detection Protocol
**Source**: Lines 277-349 (~1000 tokens)
**Destination**: `.ai/rails-pattern-detection-protocol.md`
**Why**: Important but specialized, only needed for refactoring/debugging
**Activation**: "refactor|linter|suspicious|pattern detection|initialization"

**Content**:
- Suspicious Pattern Recognition
- Before "Fixing" Anything That Looks Wrong
- Framework Initialization Awareness
- When Linters/Analyzers Suggest Changes
- Refactoring Safety Protocol
- Cross-Session Learning Protocol
- Verification Requirements

### 1.3 Rails Syntax Style Guide
**Source**: Lines 373-465 (~600 tokens)
**Destination**: `.ai/rails-syntax-style-guide.md`
**Why**: Style details, only needed during active coding
**Activation**: "syntax|style|formatting|parentheses|unicode"

**Content**:
- Syntax Preferences and Formatting
- Unicode and Emoji Guidelines (comprehensive lists)
- Cool unicode blocks reference

---

## Phase 2: Section Wrapper Implementation

### 2.1 Top-Level Infrastructure Wrappers

**Cognitive Router** (lines 14-64):
```markdown
<cognitive-router priority="MAXIMUM" process-first="true" tokens="50">
## ⚡ Cognitive Entry Router
[existing content]
</cognitive-router>
```

**Checkpoint Gates** (lines 66-121):
```markdown
<checkpoint-gates enforce="ALWAYS" tokens="150">
## ⚔ Mandatory Checkpoints
[existing content]
</checkpoint-gates>
```

**Degeneration Detector** (lines 123-145):
```markdown
<degeneration-detector threshold="3" auto-intervene="true" tokens="100">
## 🚨 Anti-Degeneration System
[existing content]
</degeneration-detector>
```

**Context Budget Manager** (lines 147-169):
```markdown
<context-budget-manager tokens="100">
## 📊 Context Budget Allocation
[existing content]
</context-budget-manager>
```

### 2.2 Content Section Wrappers

**Priority Levels**:
- CRITICAL: Load for any bug/error/crash (fail-fast protocols)
- HIGH: Load for common tasks (features, refactoring, testing)
- MEDIUM: Load for specific domains (automation, MCP, meta)
- LOW: Load rarely (project overview, agent config)

| Section ID | Activate On | Priority | Budget |
|-----------|-------------|----------|---------|
| `project-goals` | `planning\|overview\|goals\|context` | LOW | 100 |
| `context-management` | `complex\|multi-phase\|continuation` | MEDIUM | 500 |
| `rails-critical` | `rails\|model\|migration\|test` | HIGH | 800 |
| `architecture` | `feature\|add\|implement\|refactor` | HIGH | 800 |
| `error-handling` | `bug\|fix\|crash\|error\|broken` | CRITICAL | 500 |
| `automation` | `script\|automate\|repetitive\|token` | MEDIUM | 400 |
| `documentation` | `document\|readme\|md\|file creation` | LOW | 200 |
| `decision-trees` | `decision\|pattern\|choice\|when to` | MEDIUM | 300 |
| `verification` | `test\|build\|verify\|validate` | HIGH | 100 |
| `subagents` | `subagent\|task\|delegate\|orchestrate` | HIGH | 400 |
| `mcp-servers` | `mcp\|rails-mcp\|flaky` | MEDIUM | 300 |
| `meta` | `improve\|creativity\|innovation\|skynet` | MEDIUM | 400 |
| `agent-config` | `copilot\|cursor\|configuration` | LOW | 200 |

### 2.3 Inline Enforcement Tags

**Rails Architecture (in architecture section)**:
```markdown
<enforce mode="strict" domain="rails-architecture">
**MANDATE**: Module methods over instance methods. Explicit parameters over hidden state.
- Functions: Module-level, multi-parameter (8+ acceptable)
- Classes: Thin orchestrators only
- State: Explicit via parameters, never implicit via self
- Refactoring: Extract to module methods, NEVER helper instance methods
</enforce>
```

**Error Handling (in error-handling section)**:
```markdown
<mandate type="fail-fast" severity="critical">
**MANDATE**: Bubble all errors. No silent failures. No default-as-error.
- Prefer to bubble all errors up to user-visible handlers
- Never return seemingly valid default values on error
- Break multi-step nil checks into separate validations with specific error messages
</mandate>
```

**Forbidden Patterns (in multiple sections)**:
```markdown
<never severity="error">
  Emojis in output (✅❌⚠️ℹ️) - use unicode textual codepoints (✓✗⚠ℹ) instead
  Helper instance methods when refactoring
  Silent error suppression with default values
  Trailing whitespace
  Complex bash commands requiring manual approval
</never>
```

---

## Phase 3: Enhanced Cognitive Router

**Current router** has basic classification. **Enhanced router** needs:

1. **More precise routing** to specific sections
2. **Budget tracking** - show token cost of each route
3. **Chained loading** - load multiple sections for complex tasks
4. **Overflow references** - direct to .ai/ files when needed

**Enhanced Router Structure**:
```markdown
<cognitive-router priority="MAXIMUM" process-first="true" tokens="50">
## ⚡ Cognitive Entry Router
**Process this FIRST in <50 tokens**

**INSTANT CLASSIFICATION:**

IF contains("bug" | "fix" | "crash" | "error" | "broken"):
  → JUMP_TO: #error-handling [500 tokens]
  → LOAD: #rails-critical [800 tokens]
  → SKIP: #architecture, #documentation, #meta
  → ENFORCE: read_before_edit, fail_fast
  → REFERENCE: .ai/rails-specific-patterns.md (if needed)

IF contains("add" | "implement" | "feature" | "new"):
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

IF contains("co2" | "measurement" | "sensor" | "air quality" | "public health"):
  → LOAD: .ai/public-health-advocacy-context.md [2000 tokens]
  → LOAD: #project-goals [100 tokens]
  → REFERENCE: copilot_notes/domain-knowledge/

IF contains("syntax" | "style" | "formatting" | "parentheses"):
  → REFERENCE: .ai/rails-syntax-style-guide.md [600 tokens]
  → LOAD: #architecture (for context) [800 tokens]

IF contains("research" | "explore" | "why" | "investigate"):
  → MODE: discovery_creativity
  → LOAD: minimal_rules [~200 tokens: checkpoints + error-handling only]
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
</cognitive-router>
```

---

## Phase 4: Testing & Validation

### 4.1 Routing Test Cases

Test that cognitive router correctly directs to minimal sections:

| User Request | Expected Sections Loaded | Expected Tokens | Sections Skipped |
|--------------|-------------------------|-----------------|------------------|
| "Fix export bug" | error-handling (500) + rails-critical (800) | 1300 | architecture, documentation, meta |
| "Add CO2 sensor feature" | architecture (800) + rails-critical (800) + verification (100) | 1700 | error-handling (unless triggers), documentation |
| "Refactor controller complexity" | architecture (800) + .ai/pattern-detection (1000) | 1800 | error-handling, documentation |
| "Explore codebase structure" | checkpoints (150) + error-handling (500) | 650 | architecture, rails-critical, everything else |
| "Why does export system work this way?" | minimal_rules (200) | 200 | Skip almost everything |
| "Create commit for changes" | verification (100) + system git protocols | 100 | architecture, error-handling |

### 4.2 Content Preservation Checklist

Verify ALL content from original CLAUDE.md is preserved:

- ✓ All 13 sections accounted for
- ✓ All enforcement rules preserved
- ✓ All Rails-specific gotchas preserved
- ✓ All checkpoint gates preserved
- ✓ All git/commit protocols preserved
- ✓ All references to .ai/ files updated
- ✓ All activation keywords tested

### 4.3 Overflow File Validation

Verify overflow files:
1. `.ai/public-health-advocacy-context.md` created with Twitter/Grok content
2. `.ai/rails-pattern-detection-protocol.md` created with pattern detection content
3. `.ai/rails-syntax-style-guide.md` created with syntax preferences
4. All three files added to `.ai/README.md` with proper tier assignments
5. Cognitive router references all three appropriately

---

## Expected Outcomes

### Token Savings Examples

**Current State** (load entire file):
- All tasks: 10,000 tokens

**After Optimization**:
- Bug fix: 1,300 tokens (87% savings)
- Feature add: 1,700 tokens (83% savings)
- Refactor: 1,800 tokens (82% savings)
- Research/explore: 650 tokens (93.5% savings)
- Complex multi-phase: 2,500-5,000 tokens (50-75% savings, progressive loading)

### File Size Impact

**Current CLAUDE.md**: 667 lines
**Optimized CLAUDE.md**: ~450-500 lines (after moving 3 overflow sections)
**New .ai/ files**: 3 files (~200-400 lines each)

**Total content**: Same (fully preserved)
**Typical load**: 20-30% of total (vs 100% currently)

---

## Implementation Order

1. ✓ Create this plan document
2. Create 3 overflow files in .ai/ directory
3. Update .ai/README.md with new files
4. Rewrite CLAUDE.md with all section wrappers
5. Add inline enforcement tags throughout
6. Enhance cognitive router with complete routing table
7. Test routing with sample queries
8. Validate all content preserved

---

## Success Criteria

✓ **Context Efficiency**: Tasks load only relevant sections (measured by token budgets)
✓ **Content Preservation**: All original content accessible (either inline or via overflow)
✓ **Routing Accuracy**: Cognitive router correctly maps keywords to sections
✓ **Enforcement Clarity**: All rules wrapped in appropriate tags with severity levels
✓ **Maintainability**: Structure makes it easy to add/update instructions without dilution
✓ **Compatibility**: Works for all agents (Claude Code, Copilot, Cursor)

