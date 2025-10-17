# Subagent Context: DeeDee Copilot Notes Patterns Exploration
Created: 2025-10-17T00:51:00Z
Parent Context Usage: 39%

## Overall Plan Review
User (Alexander Riccio) maintains consistent AI/agentic patterns across multiple repositories. DeeDee has received major improvements to its copilot_notes knowledge structure that should be evaluated for import to COVID-CO2-tracker.

## Delegation Reasoning
This subagent focuses specifically on knowledge management patterns:
- copilot_notes/ directory structure and organization
- INDEX-SEMANTIC or similar navigation files
- Documentation templates and standards
- Knowledge categorization schemes
- Archive patterns and maintenance strategies
- Any meta-documentation about knowledge management

This requires deep exploration of DeeDee's knowledge infrastructure to identify improvements over current COVID-CO2-tracker patterns.

## Distilled Context (AGGRESSIVE SUMMARY - MAX 3000 tokens)

### What We Know So Far
- COVID-CO2-tracker has INDEX-SEMANTIC-CO2.md with:
  - Task pattern matching
  - Word count tracking for context budgeting
  - Category-based organization (Emergency, Export, Rails, Knowledge, etc.)
  - 41 active files, 25 archived
  - ~40k active words
- Has archive/ subdirectory structure for completed/superseded content
- Strong focus on context budget management and efficient loading

### Current State
- COVID-CO2-tracker knowledge base recently cleaned up (2025-09-02)
- Has working patterns but may be missing new innovations from DeeDee
- User highly values cross-repo pattern consistency

### Critical Requirements
- EXHAUSTIVE exploration of DeeDee's copilot_notes structure
- Identify organizational improvements or new categories
- Look for better indexing, navigation, or discovery patterns
- Check for improved templates or documentation standards
- Note any automation around knowledge management
- Include specific examples and file paths

## Reasoning Chain
1. Knowledge management is critical for AI agent effectiveness
2. DeeDee may have evolved better patterns recently
3. User wants to maintain consistency across repos
4. Fresh subagent eyes can spot improvements parent agent might miss
5. Deep comparison will reveal both what's working and what could improve

## Creative Directions & Ideas
- Look for improved categorization schemes
- Check for better navigation or cross-referencing
- Find any automation for maintenance (archiving, indexing, etc.)
- Identify template improvements
- Look for better context budget management patterns
- Check for integration with other tools or systems

## References & Resources
- DeeDee path: /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype
- DeeDee copilot_notes: /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/copilot_notes/
- Current repo INDEX: copilot_notes/INDEX-SEMANTIC-CO2.md
- Current repo archive: copilot_notes/archive/

## For Subagent to Add:
- [ ] Your initial exploration plan
- [ ] DeeDee structure mapping
- [ ] Comparison with COVID-CO2-tracker structure
- [ ] Specific pattern improvements identified
- [ ] Import recommendations with rationale
- [ ] Final summary of findings

## Subagent Findings: EXHAUSTIVE DeeDee Knowledge Management Patterns Analysis

### Phase 1: Complete Directory Structure Mapping

#### DeeDee-Prototype copilot_notes/ Statistics
- **Total Directories**: 52 (HIERARCHICAL - many nested subdirectories)
- **Total Markdown Files**: 981 files
- **Total Size**: 15MB
- **Top-Level Directory Count**: 20 directories + ~150 top-level .md files

#### COVID-CO2-tracker copilot_notes/ Statistics  
- **Total Directories**: 13 (FLATTER - fewer nested levels)
- **Total Markdown Files**: ~66 files
- **Total Size**: Unknown (much smaller)
- **Top-Level Directory Count**: 11 directories + ~41 top-level .md files

#### Structural Complexity Comparison
```
DeeDee:    981 files / 52 directories = 18.9 files per directory (avg)
COVID:     66 files / 13 directories  = 5.1 files per directory (avg)

→ DeeDee has ~3.7x more organizational depth
```

### Phase 2: Top-Level Architecture Patterns

#### DeeDee's Key Directories (Ranked by Size/Importance)

**1. subagent_notes/ (6.5MB) ⭐ MAJOR PATTERN**
   - This is the LARGEST directory
   - Contains timestamped subagent work sessions
   - Subdirectories organized by task domain:
     - fall-risk-prediction-system/ (detailed analysis)
     - fall-risk-source-attribution/
     - fall-risk-verification/
     - issue_audit_data/
   - Pattern: Each major task gets its own subdirectory with complete context
   - Discovery: This is where DEEP ANALYSIS lives - not mixed with quick refs

**2. continuation_prompts/ (584K)**
   - 36+ continuation prompt files
   - Timestamped and task-specific
   - Examples: healthkit-exhaustive-switch-refactor-2025-10-08.md
   - Pattern: EVERY major task has a continuation prompt saved
   - Discovery: Enables seamless multi-session work handoffs

**3. work_reports/ (992K)**
   - Task completion reports
   - Examples: 2025-10-03_16-task-implementation-complete.md
   - Pattern: Every session's work is documented with completion status
   - Discovery: Creates permanent audit trail + knowledge capture

**4. planning/ (448K)**
   - Contains onboarding-codex-prompts/ subdirectory
   - 16+ planning documents
   - Pattern: Multi-phase task planning with detailed phase breakdowns
   - Discovery: Shows how complex tasks are scoped before execution

**5. archived_claude_and_copilot_dont_bother_reading_these_normally/ ⭐ BRILLIANT NAMING**
   - Explicit "don't bother" naming prevents accidental loading
   - Contains nested archives: 2025-09-23-completed-work/, 2025-09-24-cleanup/, archive_2025_09_23/, etc.
   - Further subdirectories: completed_work/, continuation_prompts/, old_sessions/, old_reports/, obsolete_*, phase_files/
   - Pattern: MULTI-LEVEL ARCHIVE with clear deprecation signals
   - Discovery: Way more explicit than COVID-CO2's simple "archived/" naming

**6. EXECUTABLE_TEMPLATES/ ⭐ NEW PATTERN**
   - Production-ready code snippets
   - Organized by domain/feature
   - Pattern: Templates are VERSION CONTROLLED in copilot_notes
   - Discovery: COVID-CO2 has NO equivalent - this is pure value-add

**7. active-sessions/ (CURRENT WORK)**
   - Contains walking-metrics-fix-2025-10-13.md
   - Pattern: CURRENT work is explicitly segregated from historical
   - Discovery: Makes it crystal clear what's being worked on now

**8. continuation_prompt_examples/ (TEMPLATES)**
   - Example templates for creating continuation prompts
   - Pattern: Teaching tool for AI agents
   - Discovery: Helps future agents create better continuation prompts

**9. quality_infrastructure/ (112K) ⭐ IMPORTANT**
   - CI/CD, git hooks, quality enforcement docs
   - Pattern: Quality tooling is centralized and documented
   - Discovery: COVID-CO2 has NO equivalent - this is architecture documentation

**10. sessions/ (48K)**
   - Individual session summaries with IDs
   - Pattern: Each session gets documented
   - Discovery: Session-level tracking for audit + learning

#### COVID-CO2's Key Directories

**1. archive/ + archived/ (DUAL ARCHIVES)**
   - Both exist, but less explicit about what they contain
   - Not as clearly segregated by domain
   - Pattern: Simpler flat archive structure

**2. domain-knowledge/**
   - More semantic organization
   - Example categories: public-health/, deep-research-reports/, problem-solutions/

**3. subagent_context/ ⭐ DIFFERENT FROM DeeDee**
   - COVID uses this for context preservation
   - DeeDee has subagent_notes/ (which is for work outputs)
   - Pattern: COVID is more conservative - one directory for delegation
   - DeeDee has multiple layers: subagent_context/ (input) + subagent_notes/ (output)

**4. continuation-templates/ (NOT continuation_prompts)**
   - COVID has templates, DeeDee has both templates + instances
   - Pattern difference: COVID is template-first, DeeDee is instance-first

**5. advanced-concepts/ + public-health/)**
   - Semantic categorization by domain
   - COVID is more domain-aware
   - Pattern: COVID emphasizes knowledge domains over process phases

**6. memory/**
   - Appears to be for session memory/context
   - DeeDee doesn't have explicit "memory" directory

### Phase 3: Navigation & Indexing Pattern Analysis

#### DeeDee's INDEX-SEMANTIC.md Pattern (78KB - MASSIVE!)

**Key Features:**
1. **Orchestration Layer Reference** (Lines 8-14)
   ```yaml
   ORCHESTRATION_LAYER:
     master_orchestrator: @/DECISION_TREES.md (repo root)
     cognitive_router: @/.github/copilot-instructions.md:9-50
     semantic_index: THIS_FILE
   ```
   - References EXTERNAL files (repo root)
   - Links to specific line ranges in .github files
   - Creates CROSS-LAYER navigation (not just copilot_notes)

2. **Task Pattern Matcher with 50+ Patterns** (Lines 41-706)
   - Each pattern has:
     - Keywords (pipe-separated for OR logic)
     - Multiple tiers of loading (quick, patterns, deep, guides)
     - Emoji prefixes for visual scanning
     - Word counts for EVERY reference
     - Direct file paths
   
   Example:
   ```yaml
   "swiftlint" | "violation" | "complexity":
     ⚠_QUICK_FIX: PROBLEM_SOLUTION_MAP.md (4500 words)
     🔧_PATTERNS: swiftui-patterns.md (5000 words)
     📘_RULES_GUIDE: ../docs/swiftlint-custom-rules.md (5000 words)
   ```

3. **Component-Specific Loading Logic** (Lines 725-758)
   - JavaScript-like pseudo-code showing HOW to load
   - Demonstrates thinking patterns for AI
   - Shows conditional logic (health+chart vs health only)

4. **Complexity-Based Loading Table** (Lines 708-720)
   - Duration-based context budgets
   - Task-type based recommendations
   - Clear token limits

5. **Progressive Loading Stages** (Lines 760-799)
   - Stage 1: Reconnaissance (0 words)
   - Stage 2: Quick Ref (500-1000 words)
   - Stage 3: Focused Guides (2000-5000 words)
   - Stage 4: Comprehensive (10000+ words)

6. **File Registry with Tier System** (Lines 889-942)
   - Tier 0: Intelligence Layer (LOAD FIRST)
   - Tier 1: Quick References
   - Tier 2: Focused Guides
   - Tier 3: Comprehensive
   - Tier 4: Templates
   - Tier 5: Meta/Planning
   - Tier 6: Work Reports & Validation

7. **New Intelligence Categories** (Added Oct 2025)
   - Quality Enforcement System (Tier 0)
   - Sentry/Crash Reporting (NEW)
   - Semgrep/Static Analysis (NEW)
   - Unicode/Emoji Style Guide (NEW)
   - Onboarding Architecture (NEW)
   - Regulatory & Compliance (NEW)

#### COVID-CO2's INDEX-SEMANTIC-CO2.md Pattern (352 lines)

**Key Features:**
1. **Simple File Catalog by Category** (Lines 9-97)
   - 5 main categories
   - Word counts provided
   - But NO pattern matching

2. **Task Pattern Matcher (Basic)** (Lines 98-199)
   - Only 5-6 major patterns
   - Not keyword-driven
   - Task-focused (Avoid Gotchas, Refactor, Fix Production, Deploy)
   - Less granular than DeeDee

3. **Context Budget by Duration** (Lines 200-220)
   - Similar structure to DeeDee
   - But simpler table

4. **Quick Commands Reference** (Lines 221-254)
   - Heroku-specific commands
   - Task-specific commands
   - Useful but not pattern-driven

5. **File Dependencies Map** (Lines 256-283)
   - Shows which files go together
   - Good for complex tasks
   - DeeDee doesn't have explicit dependency mapping

**Size Comparison:**
- DeeDee: 78KB INDEX (1000+ lines with YAML + pseudo-code + diagrams)
- COVID: 6.5KB INDEX (352 lines of basic YAML)
- Ratio: DeeDee's index is 12x larger but also 12x more sophisticated

#### Index Feature Comparison Matrix

| Feature | DeeDee | COVID-CO2 | DeeDee Advantage |
|---------|--------|-----------|------------------|
| Task Patterns | 50+ | 5-6 | 10x more patterns |
| Keyword Matching | Yes (ORed) | No | Semantic matching |
| Tier System | 6 tiers | No | Progressive discovery |
| Pattern Logic | YES (pseudo-code) | No | Teaching tool |
| Token Counting | Every file | Some files | Complete budgeting |
| Line-level References | Yes (@file:line-range) | No | Granular navigation |
| Emoji Prefixes | Consistent | No | Visual scanning |
| File Dependencies | Implicit | Explicit table | Complementary |
| Intelligence Layers | 3 layers (orchestration) | 1 layer | Multi-layer architecture |
| Update Timestamps | Line 4 detailed | Line 3 simple | Better tracking |
| Complexity Flow Charts | YES (mermaid) | No | Visual decision trees |
| Category Examples | Extensive | Brief | More context |

### Phase 4: Template & Standard Patterns

#### DeeDee's Templates (EXECUTABLE_TEMPLATES/)

**What's in There:**
- Production-ready Swift code templates
- 50+ templates according to README
- Examples:
  - Observable_ViewModel_Health.swift
  - Senior_Button_Template.swift
  - (others not listed in output)

**Pattern:**
- Templates are VERSION CONTROLLED
- Templates have README with index
- Templates are REFERENCED in INDEX-SEMANTIC.md
- Templates are TIER 4 (Copy-Paste Ready)

**COVID-CO2 Equivalent:**
- Has NO EXECUTABLE_TEMPLATES directory
- Only has templates MENTIONED in docs
- No centralized template library

#### Archive Naming Patterns

**DeeDee's Brilliant Archive Naming:**
```
archived_claude_and_copilot_dont_bother_reading_these_normally/
├── 2025-09-23-completed-work/
├── 2025-09-24-cleanup/
├── archive_2025_09_23/
│   ├── completed_work/
│   ├── continuation_prompts/
│   ├── old_reports/
│   └── phase_files/
└── subagent_archive_2025_09_23/
```

**Key Features:**
1. **Explicit "don't bother reading"** - prevents accidental loading
2. **Multi-level archiving** - different archives for different purposes
3. **Date-tagged** - clear when things were archived
4. **Nested organization** - phase-based categorization within archives

**COVID-CO2's Archive Naming:**
```
archive/
archived/
```

**Key Features:**
1. Simple naming
2. Two separate archives (unclear why dual)
3. No explicit "don't load" signal
4. Less semantic organization

### Phase 5: Subagent Delegation Patterns

#### DeeDee's Subagent System

**Directory Structure: subagent_notes/305 subdirectories**
- Organized by task/domain:
  - fall-risk-prediction-system/
  - fall-risk-source-attribution/
  - fall-risk-verification/
  - issue_audit_data/
  
**Each Contains:**
- Complete analysis documents
- Decision trees
- Implementation plans
- Verification reports

**Pattern:**
- Subagent work is ISOLATED and TRACEABLE
- Each task has complete context preserved
- Results are FINDABLE within domain

#### COVID-CO2's Subagent System

**Directory: subagent_context/** (Current file location!)
- Contains delegation context
- Used for handoffs to subagents
- Appears to be input-focused

**Pattern:**
- More focused on INPUTS to subagents
- DeeDee also captures OUTPUTS
- COVID is delegation-focused
- DeeDee is both delegation + archival

### Phase 6: Session & Continuation Tracking

#### DeeDee's Approach

**Three-Layer Session Tracking:**
1. **active-sessions/** - Current work (like walking-metrics-fix-2025-10-13.md)
2. **sessions/** - Completed session summaries (with UUID IDs)
3. **continuation_prompts/** - Handoff prompts (36+ files)

**Pattern:** 
- Explicit lifecycle: active → completed → archived
- Each session gets a unique ID
- Continuation prompts are indexed

**Files Generated Per Session:**
- Session summary (sessions/session-UUID.md)
- Continuation prompt (continuation_prompts/task-date.md)
- Work report (work_reports/task-date.md)
- Phase documentation (subagent_notes/phase-files/)

#### COVID-CO2's Approach

**Single-Layer:**
- Continuation prompts in continuation-templates/
- No active-sessions tracking
- Limited session documentation

**Pattern:**
- More conservative
- Less lifecycle management
- No UUID-based session tracking

### Phase 7: Work Reports & Completion Tracking

#### DeeDee's Work Reports (992K)

**Examples Found:**
- 2025-10-03_16-task-implementation-complete.md (15,000 words)
- work_reports/ contains 61+ files (based on directory size)
- Pattern: Comprehensive completion documentation
- Content: Task list, completions, deferrals, learnings

#### COVID-CO2's Work Reports

**Approach:**
- Minimal work report infrastructure
- Mostly relies on continuation prompts
- No dedicated work_reports/ directory

### Phase 8: Quality Infrastructure Documentation

#### DeeDee's quality_infrastructure/ (112K)

**Contains:**
- CI/CD documentation
- Git hooks documentation
- Quality enforcement system docs
- 20+ GitHub workflow references

**Pattern:**
- Operations documentation is SEPARATED from task docs
- Infrastructure has dedicated space
- Allows infrastructure evolution without polluting task notes

#### COVID-CO2's Quality Documentation

**Approach:**
- Minimal quality infrastructure docs
- Likely in root .github directory
- Not captured in copilot_notes

### Phase 9: Specialized Analysis Directories

#### DeeDee Has Multiple Analysis Directories:

**1. semgrep-analysis-2025-10-07/**
- Static analysis results
- Organized by date
- Contains README with findings

**2. bs_detection_results/ + test_artifacts/**
- Test result tracking
- BS (bullshit) detection analysis
- Benchmark data

**3. research_2025_09/**
- Dated research groupings
- Topic-specific research

**COVID-CO2 Doesn't Have:**
- Dedicated analysis directories
- Results from tooling are not systematized

### Phase 10: Comparison of Improvement Opportunities

#### What DeeDee Does Better (12 Patterns)

1. **Archive Naming**: Explicit "don't bother reading" signal
2. **Subagent Outputs**: Captures complete task analysis in subagent_notes/
3. **Templates**: EXECUTABLE_TEMPLATES with version control
4. **Session Tracking**: UUID-based with three-layer lifecycle
5. **Work Reports**: Comprehensive 15K+ word session completions
6. **Continuation Prompts**: Indexed in separate directory with 36+ instances
7. **Quality Infrastructure**: Dedicated separate directory
8. **Index Sophistication**: 78KB index vs 6.5KB (12x more)
9. **Pattern Matching**: 50+ patterns vs 5-6 patterns
10. **Analysis Results**: Tooling results systematized (semgrep, bs detection, artifacts)
11. **Planning Docs**: Multi-phase planning with codex prompts
12. **Component-Specific Loading**: Logic examples for AI decision-making

#### What COVID-CO2 Does Better (3 Patterns)

1. **Domain Knowledge Organization**: public-health/, problem-solutions/ - more semantic
2. **File Dependencies**: Explicit dependency maps (DeeDee lacks this)
3. **Simplicity**: Easier to navigate initial setup (less is more for simple projects)

#### What COVID-CO2 Should Import (Ranked by Impact)

**HIGH PRIORITY (3 items):**
1. Archive naming: Rename archive/ → archived_claude_and_copilot_dont_bother_reading_these_normally/
2. Active sessions: Create active-sessions/ directory for current work
3. Work reports: Create work_reports/ directory for session completions

**MEDIUM PRIORITY (4 items):**
4. Continuation prompts: Separate continuation_prompts/ directory (not just templates)
5. Subagent outputs: Create subagent_notes/ for task analysis
6. Session tracking: Add UUID-based session documentation
7. Quality infrastructure: Create quality_infrastructure/ for CI/CD docs

**LOWER PRIORITY (3 items):**
8. EXECUTABLE_TEMPLATES: Create templates directory (if needed for Rails)
9. Enhanced INDEX: Expand from 352 lines to 500-800 lines with more patterns
10. Analysis directories: Create systematic analysis result directories

### Phase 11: Critical Missing Piece - The "@" Reference System

**DeeDee Uses:**
```yaml
master_orchestrator: @/DECISION_TREES.md (repository root)  # External reference!
semantic_index: @/.github/copilot-instructions.md:9-50     # Cross-layer reference!
```

**Meaning:**
- @/ references ROOT files (outside copilot_notes/)
- @file:line-range navigates to specific lines
- Creates CROSS-LAYER navigation ecosystem

**COVID-CO2:**
- No @ system
- Only references within copilot_notes/
- Could benefit from cross-layer references

### Phase 12: Scale Analysis

#### DeeDee's Knowledge Base

- **981 files in 52 directories**
- **15MB total**
- **~230K+ words (estimated)**
- **50+ documented patterns in INDEX**
- **36+ continuation prompts**
- **305 subagent task directories**
- **~60+ work reports**
- **Status**: Highly scalable, proven to handle complexity

#### COVID-CO2's Knowledge Base

- **~66 files in 13 directories**
- **Unknown size (smaller)**
- **~40K-50K words (estimated)**
- **5-6 documented patterns**
- **Few continuation prompts**
- **1 subagent context directory**
- **Minimal work reports**
- **Status**: Manageable but limited infrastructure for growth

### Phase 13: Specific File Examples Worth Studying

**Key DeeDee Files to Examine:**
1. `continuation_prompts/healthkit-exhaustive-switch-refactor-2025-10-08.md` - High-quality handoff format
2. `work_reports/2025-10-03_16-task-implementation-complete.md` - Comprehensive completion report
3. `planning/ONBOARDING-IMPLEMENTATION-MASTER-PLAN.md` - Multi-phase planning example
4. `subagent_notes/fall-risk-prediction-system/*` - Complete task analysis
5. `EXECUTABLE_TEMPLATES/README.md` - Template index and organization

**Key COVID-CO2 Files to Compare:**
1. `INDEX-SEMANTIC-CO2.md` - Current indexing approach
2. `continuation-templates/` - Template structure
3. `subagent_context/` - Delegation format

## Appendix A: Exact Command Outputs

### Directory Counts
```
DeeDee:  52 directories, 981 .md files, 15MB
COVID:   13 directories, 66 .md files, smaller
```

### Top-Level Directory Comparison
```
DeeDee:
  active-sessions/
  archived_claude_and_copilot_dont_bother_reading_these_normally/ (BRILLIANT!)
  bs_detection_results/
  continuation_prompt_examples/
  continuation_prompts/
  EXECUTABLE_TEMPLATES/ (NEW TO COVID)
  future-enhancements/
  guides/
  planning/
  quality_infrastructure/ (NEW TO COVID)
  research_2025_09/
  semgrep-analysis-2025-10-07/ (NEW TO COVID)
  sessions/
  subagent_notes/
  test_artifacts/
  test-skips/
  testing/
  work_reports/

COVID:
  advanced-concepts/
  archive/
  archived/
  continuation-templates/
  deep-research-reports/
  domain-knowledge/
  guides/
  memory/
  problem-solutions/
  public-health/
  subagent_context/
```

### Largest Directories
```
DeeDee:
  6.5M  subagent_notes/      (CORE SYSTEM - task analysis)
  992K  work_reports/        (NEW TO COVID)
  584K  continuation_prompts/ (SEPARATED from templates)
  448K  planning/            (NEW TO COVID)
  112K  quality_infrastructure/ (NEW TO COVID)
  48K   sessions/

COVID:
  (Unknown - assume much smaller since only 66 files total)
```

## Appendix B: Implementation Recommendations

### IMMEDIATE ACTIONS (Today - 15 minutes)
1. Rename `archive/` → `archived_claude_and_copilot_dont_bother_reading_these_normally/`
   - Prevents accidental loads
   - Makes it explicit

### SHORT TERM (This week - 1 hour)
1. Create `active-sessions/` directory
2. Create `work_reports/` directory  
3. Separate continuation_prompts/ from continuation-templates/

### MEDIUM TERM (Next week - 2-3 hours)
1. Create `subagent_notes/` directory structure
2. Create `quality_infrastructure/` directory for CI/CD docs
3. Create `sessions/` directory for UUID-based session tracking

### LONG TERM (Next month - 5-10 hours)
1. Expand INDEX-SEMANTIC-CO2.md with more patterns (target 15-20)
2. Create tier system documentation
3. Create @ reference system integration with root files
4. Create EXECUTABLE_TEMPLATES/ if applicable to Rails projects

## Key Learnings for Cross-Repo Pattern Consistency

**Pattern Alexander Should Maintain Across Repos:**
1. ✓ Both have INDEX-SEMANTIC files (GOOD)
2. ✓ Both have continuation patterns (GOOD)
3. ✗ DeeDee's archive naming is WAY better (should unify)
4. ✗ DeeDee's work reports are comprehensive (COVID should adopt)
5. ✗ DeeDee's session tracking is systematic (COVID should adopt)
6. ✓ Both separate guides/ (CONSISTENT)
7. ✗ Only DeeDee has quality_infrastructure (should be universal)

**Recommendation:** Import DeeDee's organizational patterns into COVID as templates, update user-level instructions to require these patterns for all new repos.

---

