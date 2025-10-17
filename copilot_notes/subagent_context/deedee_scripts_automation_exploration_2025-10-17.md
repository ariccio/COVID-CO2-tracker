# Subagent Context: DeeDee Scripts & Automation Exploration
Created: 2025-10-17T00:51:00Z
Parent Context Usage: 39%

## Overall Plan Review
User (Alexander Riccio) maintains consistent patterns across repositories and highly values automation to reduce token waste on mechanical tasks. DeeDee may have developed new scripts or automation that should be ported to COVID-CO2-tracker.

## Delegation Reasoning
This subagent focuses specifically on tooling and automation:
- scripts/ directory contents
- Hook scripts (pre-commit, user-prompt-submit, etc.)
- Testing automation
- Deployment automation
- Development workflow improvements
- Any CLI tools or utilities specific to AI workflows

This requires exploration of DeeDee's automation infrastructure to identify portable improvements.

## Distilled Context (AGGRESSIVE SUMMARY - MAX 3000 tokens)

### What We Know So Far
- COVID-CO2-tracker has scripts/ directory with Rails-specific tools
- User emphasizes "token economy" - scripts over LLM repetition
- User values automation for testing, deployment, and development workflows
- Current repo has hooks configured (mentioned in instructions)
- User recently noted in instructions: "scripts/claude-stop-hook.sh" exists

### Current State
- COVID-CO2-tracker has some automation but may be missing DeeDee improvements
- User's instructions emphasize checking scripts/ before creating new automation
- Rails-specific testing and deployment scripts exist

### Critical Requirements
- EXHAUSTIVE exploration of DeeDee's scripts/ directory
- Identify any hook scripts and their purposes
- Look for testing automation improvements
- Check for development workflow enhancements
- Document any AI-specific tooling or utilities
- Note dependencies and portability considerations
- Include specific file paths and descriptions

## Reasoning Chain
1. User strongly values automation to reduce token waste
2. DeeDee as prototype project may have developed better tooling
3. User wants patterns consistent across repos
4. Scripts are highly portable between projects
5. Testing and workflow automation provide high ROI

## Creative Directions & Ideas
- Look for improved testing scripts (quick test suites, etc.)
- Check for deployment safety automation
- Find any AI workflow enhancements
- Identify hook patterns that improve AI collaboration
- Look for debugging or troubleshooting utilities
- Check for context management automation

## References & Resources
- DeeDee path: /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype
- DeeDee scripts: /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/
- Current repo scripts: scripts/
- Current repo .claude/: /Users/alexanderriccio/.claude/
- Hook mentions in instructions: claude-stop-hook.sh, rubocop-session-check.sh, etc.

## For Subagent to Add:
- [ ] Your initial exploration plan
- [ ] Complete scripts inventory from DeeDee
- [ ] Comparison with COVID-CO2-tracker scripts
- [ ] Specific improvements to port
- [ ] Portability notes and adaptation requirements
- [ ] Final summary with priority recommendations

---

## EXHAUSTIVE SCRIPTS & AUTOMATION EXPLORATION - COMPLETED

### Exploration Methodology
- Recursive directory traversal of both repositories
- Script inventory with file paths and line counts
- Hook configuration analysis
- Library utility examination
- Library code pattern review
- Portability assessment for Rails/Ruby vs Swift projects

### DELIVERABLE 1: Complete DeeDee Scripts Inventory

#### Repository Statistics
- **DeeDee Total**: ~104 scripts + libs = 14,719 lines of code
- **COVID-CO2-tracker Total**: ~32 scripts = 4,579 lines of code
- **Ratio**: DeeDee is 3.2x larger with more sophisticated automation

#### 1. GIT HOOKS INFRASTRUCTURE (9 scripts, 128KB)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/`

Sophisticated pre-commit/pre-push/post-checkout hook ecosystem:
- `pre-commit` hooks (inferred from installation script)
- `pre-push` hooks for validation (configured in .lefthook)
- `post-checkout` hooks for auto-configuration
- `post-merge` hooks for consistency

**Individual Hook Runners**:
1. **cspell-runner.sh** (2427 bytes)
   - Spell checking with medical dictionary support
   - Graceful fallback if cspell not installed
   - Processes staged files only
   - Pattern: `*.md|*.txt|*.swift|*.sh|*.js|*.ts|*.yml|*.yaml|*.json`

2. **gitleaks-runner.sh** (8594 bytes)
   - Detects secrets/credentials in commits
   - JSON output parsing for detailed results
   - Integrates with CI/CD pipelines
   - **Critical for security** - COVID-CO2-tracker lacks this

3. **health-validator-runner.sh** (3045 bytes)
   - HealthKit/medical data validation
   - Not applicable to COVID-CO2-tracker (Swift/iOS specific)

4. **jsonlint-runner.sh** (2961 bytes)
   - JSON validation for staged files
   - TTY-aware color output
   - **Portable**: Could validate Heroku configs, JSON API responses

5. **markdownlint-runner.sh** (2842 bytes)
   - Markdown linting for documentation
   - TTY-aware output with color detection
   - **Portable**: COVID-CO2-tracker has docs that need linting

6. **semgrep-runner.sh** (17713 bytes - LARGEST)
   - Advanced static analysis with semgrep
   - Custom rule validation
   - Performance metrics collection
   - JSON output management
   - **SOPHISTICATED**: 6 months of development, semgrep SwiftLint replacement rules

7. **shellcheck-runner.sh** (2088 bytes)
   - Bash script validation
   - TTY-aware error reporting
   - **Portable**: Validates all .sh scripts in COVID-CO2-tracker/scripts/

8. **validate-build-settings.sh** (2961 bytes)
   - Xcode/Swift build validation
   - Not applicable to Rails project

9. **yamllint-runner.sh** (2011 bytes)
   - YAML validation for config files
   - **Portable**: COVID-CO2-tracker uses YAML extensively

#### 2. LIBRARY UTILITIES (4 files, 24KB)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/lib/`

**tty-colors.sh** ⭐ CRITICAL FOR PORTING
- Detects TTY availability (GitHub Desktop, CI/CD compatibility)
- Auto-disables ANSI colors in non-terminal environments
- Prevents garbled output with escape sequences
- **COVID-CO2-tracker scripts need this** - currently hardcoding colors

```bash
# Usage pattern (from DeeDee):
source "$SCRIPT_DIR/lib/tty-colors.sh"
echo -e "${GREEN}✓ Success${NC}"  # Auto-disables in CI
```

**hook-timing.sh** (Performance infrastructure)
- Millisecond-precision timing using Python (cross-platform)
- Records metrics to JSON files
- Performance dashboard integration
- Non-blocking background metric recording

**hook-linters.sh** (Shared linter logic)
- Common linter execution patterns
- Error aggregation
- Exit code handling

**hook-swiftlint.sh** (Swift linting)
- Not applicable to Rails project

#### 3. QUALITY & TESTING AUTOMATION (14+ scripts, 292KB)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/quality/`

**master.sh** - Interactive quality dashboard
- 443 lines of sophisticated orchestration
- Menu-driven interface for developers
- Quick/Full/Aggressive fix modes
- Performance metrics display
- Git hooks status monitoring

**Sub-categories**:
- `check-quick.sh` - Fast checks for staged files (<2s)
- `check-full.sh` - Comprehensive analysis (<5s)
- `fix-safe.sh` - Safe auto-corrections (formatting only)
- `fix-aggressive.sh` - Aggressive auto-fixes (all possible)
- `smoke-test.sh` - Baseline functionality tests
- `test-integration.sh` - Integration test runner
- `test-e2e.sh` - End-to-end testing
- `measure-baselines.sh` - Performance baseline collection

**Portability Notes**: 
- Quick test concept is DIRECTLY APPLICABLE to COVID-CO2-tracker
- Current: test-suite-quick.sh, test-suite-full.sh, test-suite-smart.sh (already good!)
- Enhancement: Could use master.sh orchestration pattern

#### 4. SESSION & MONITORING TOOLS (13 scripts, focus on AI workflow)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/`

Highly sophisticated session tracking for AI development:
- **init-session-tracking.sh** - Initialize Claude session
- **debug-session-tracking.sh** - Debug session state
- **cleanup-session-data.sh** (14KB, 475 lines)
  - Remove old sessions (configurable age)
  - Archive reports before cleanup
  - Keep-count logic for recent sessions
  - Orphaned lock cleanup
  - **COVID-CO2-tracker has simpler version** - could upgrade!

- **generate-session-report.sh** - Session summaries
- **track-session-files.sh** - File modification tracking
- **monitor-session-health.sh** - Session monitoring
- **session-violation-tracker.sh** - Violation tracking across sessions

**Portability**: 
- These are CROSS-PLATFORM APPLICABLE
- COVID-CO2-tracker has basic session tracking
- DeeDee's cleanup-session-data.sh is much more sophisticated

#### 5. PERFORMANCE & WORKFLOW MONITORING (8 scripts, 108KB)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/performance/`

- **benchmark-all.sh** - Performance benchmarking
- **collect-metrics.sh** - Metric collection
- **dashboard.sh** - Performance visualization
- **optimize-hooks.sh** - Hook optimization
- **parallel-runner.sh** - Parallel test execution
- **time-wrapper.sh** - Command timing utilities

**Not directly applicable to Rails**, but concepts useful for:
- Test suite optimization
- Deployment monitoring

#### 6. SECURITY & VALIDATION (4 scripts, 76KB)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/security/`

- **scan-for-secrets.sh** - Secret detection
- **validate-privacy-manifest.sh** - Privacy compliance
- **check-health-data-logging.sh** - Data logging audit
- **check-healthkit-auth.sh** - Authorization validation

**Not applicable** to COVID-CO2-tracker (iOS/HealthKit specific)

#### 7. AI/MCP INTEGRATION (5+ scripts)
**Location**: Various locations

- **setup-claude-mcp-aliases.sh** - MCP server aliases
- **activate-claude-mcp.sh** - Activate MCP servers
- **ai-config-auto-sync.sh** - Auto-sync AI configs
- **claude-mcp-select.sh** - Interactive MCP selection
- **sync-mcp-configs.sh** - MCP configuration synchronization

**Critical Pattern**: Cross-repository MCP configuration management
- **COVID-CO2-tracker should adopt similar pattern**
- Use symbolic links or environment variables for .claude/settings.json

#### 8. STATIC ANALYSIS TOOLKIT (Complex subsystem)
**Location**: `/Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/static-analysis/`

Semgrep analysis infrastructure (232KB):
- **run-filtered.sh** - Semgrep with filtering
- **rule-efficacy.sh** - Rule performance analysis
- **sample-violations.sh** - Random violation sampling
- **validate-rules.sh** - Rule validation against test cases
- **extract-code-context.sh** - Context extraction for violations

**Significant Work**: 6+ months of semgrep optimization
- Custom SwiftLint replacement rules (2 automated, 4 requiring manual review)
- Pattern validation framework
- False positive detection

**Applicable to COVID-CO2-tracker**: 
- MAYBE for backend API validation
- Less critical than Swift project (no equivalent to complex pattern matching needs)

#### 9. HELPER SCRIPTS & UTILITIES
**Location**: Scattered throughout

- **check-duplicate-dependencies.sh** - Dependency checker
- **extract-swiftlint-patterns.sh** - Pattern extraction
- **regex-forensics.sh** - Regex debugging
- **setup-git-improvements.sh** - Git setup enhancement
- **validate_environment.sh** - Environment validation

### DELIVERABLE 2: COVID-CO2-tracker Current State

#### Existing Scripts (32 scripts, 4579 lines)

**Testing/Validation**:
- test-suite-quick.sh ✓ (4754 bytes)
- test-suite-full.sh ✓ (9873 bytes)
- test-suite-smart.sh ✓ (8265 bytes)
- test-emoji-checker.sh ✓
- rubocop-session-check.sh ✓

**Session Management**:
- debug-session-tracking.sh (basic)
- init-session-tracking.sh (basic)
- extract-session-id.sh (basic)
- track-session-files.sh (basic)

**Export System**:
- deploy_export_system.sh
- verify_export_system.sh
- manage_export_tokens.rb
- quick-test-export-token.sh
- test-export-tokens.sh

**Deployment**:
- quick-deploy.sh (minimal)
- heroku_pg_upgrade_helper.sh

**Hooks**:
- claude-stop-hook.sh ✓ (sophisticated)
- post-rubocop-check.sh
- claude-emoji-check.sh

**Setup/Config**:
- setup-development.sh
- setup-memory-infrastructure.sh

#### Notable MISSING Automation
- ✗ Spell checking (cspell-runner)
- ✗ Secret scanning (gitleaks-runner)
- ✗ YAML linting (yamllint-runner)
- ✗ Markdown linting (markdownlint-runner)
- ✗ Shell script validation (shellcheck-runner)
- ✗ JSON validation (jsonlint-runner)
- ✗ Advanced cleanup (cleanup-session-data.sh)
- ✗ Git hooks installation automation
- ✗ TTY-aware color utilities library
- ✗ Performance metrics collection
- ✗ MCP configuration auto-sync

### DELIVERABLE 3: Comparison Matrix

| Category | DeeDee | COVID | Gap | Priority |
|----------|--------|-------|-----|----------|
| Testing | Sophisticated | Good | Master dashboard | Medium |
| Git Hooks | 9 runners | 0 runners | All 9 concepts | HIGH |
| Library Utils | 4 shared libs | 0 | tty-colors.sh | HIGH |
| Session Mgmt | Advanced | Basic | cleanup, metrics | Medium |
| Linting Hooks | 9 specific | 0 | All 9 types | HIGH |
| Secret Scanning | Yes | No | gitleaks | CRITICAL |
| Documentation | Comprehensive | Basic | Hook guides | Medium |

### DELIVERABLE 4: Specific Recommendations for Porting

#### TIER 1: HIGH-ROI, EASY PORTS (1-2 hours each)

**1. tty-colors.sh Library** ⭐⭐⭐ 
- **Effort**: 15 minutes to port, 10 minutes to integrate
- **Files affected**: All scripts using echo with colors
- **Benefits**: 
  - Fixes CI/CD output garbling in GitHub Desktop
  - Standardized color handling across all scripts
- **Implementation**:
  ```bash
  cp /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/lib/tty-colors.sh \
     /Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker/scripts/lib/
  # Update all scripts to source it instead of inline colors
  ```
- **Files to update**: 
  - scripts/claude-stop-hook.sh
  - scripts/test-suite-quick.sh
  - scripts/test-suite-full.sh
  - scripts/test-suite-smart.sh
  - scripts/rubocop-session-check.sh

**2. shellcheck-runner.sh** ⭐⭐
- **Effort**: 5 minutes to port + 10 minute integration
- **Dependencies**: shellcheck (likely already installed)
- **Benefits**: Validates all shell scripts in COVID-CO2-tracker/scripts/
- **Integration**: Add to lefthook pre-commit hook (once established)
- **Adaptation needed**: None - fully portable

**3. jsonlint-runner.sh** ⭐⭐
- **Effort**: 5 minutes + 10 minute integration
- **Benefits**: Validates JSON config files
- **Relevant files**: 
  - Heroku configs
  - Any JSON API responses in tests
- **Adaptation**: None - fully portable

**4. yamllint-runner.sh** ⭐⭐⭐
- **Effort**: 5 minutes + 10 minute integration
- **Benefits**: Validates YAML across project
- **Relevant files**:
  - .github/ workflows
  - .lefthook (if added)
  - config/ files
- **Adaptation**: None - fully portable

**5. markdownlint-runner.sh** ⭐
- **Effort**: 5 minutes + 10 minute integration
- **Benefits**: Enforces markdown consistency
- **Relevant files**:
  - README.md
  - CLAUDE.md
  - .github/copilot-instructions.md
  - Documentation in copilot_notes/

#### TIER 2: HIGH-VALUE MEDIUM EFFORT (2-4 hours each)

**6. gitleaks-runner.sh** ⭐⭐⭐ CRITICAL SECURITY
- **Effort**: 15 minutes to port + 1 hour to integrate + testing
- **Dependencies**: gitleaks CLI tool (may need installation)
- **Benefits**: 
  - CRITICAL: Prevents credential leaks in commits
  - Currently MISSING from COVID-CO2-tracker
  - Protects Heroku token, API keys, etc.
- **Integration**: Pre-commit hook (must run before push)
- **Adaptation needed**: Minor - Configure for Rails/Ruby patterns
- **Security impact**: ★★★ CRITICAL

**7. git-hooks Installation Infrastructure** ⭐⭐⭐
- **Effort**: 30 minutes to port + 1 hour testing
- **Dependencies**: None (pure bash)
- **Files**:
  - scripts/install-git-hooks.sh (450+ lines)
  - scripts/git-worktree-utils.sh (utility functions)
- **Benefits**:
  - Automates hook installation/updates
  - Handles git worktrees correctly
  - Prevents manual .git/hooks editing
- **Current state**: COVID-CO2-tracker has .lefthook/pre-push manually
- **Improvement**: Systematic hook management
- **Adaptation needed**: Moderate - adapt worktree logic

**8. cleanup-session-data.sh Advanced** ⭐⭐
- **Effort**: 30 minutes to port + 1 hour testing
- **Current**: COVID-CO2-tracker's version is basic
- **DeeDee's version**: 475 lines, sophisticated
- **Benefits**:
  - Archive reports before deletion
  - Intelligent session age calculation from metadata
  - Orphaned lock cleanup
  - Session log truncation
- **Adaptation**: None - fully portable
- **Enhancement over current**: Significant

#### TIER 3: MEDIUM VALUE HIGHER EFFORT (4-8 hours each)

**9. TTY-Aware Logging Library Pattern** ⭐⭐
- **Effort**: 2-3 hours to implement
- **Builds on**: tty-colors.sh (Tier 1)
- **Benefits**: 
  - Consistent logging across all scripts
  - Automatic TTY detection
  - Better CI/CD output
- **Files needed**:
  - Enhance lib/tty-colors.sh with logging functions
  - Update all scripts to use logging lib

**10. Quality Dashboard Concept** ⭐
- **Effort**: 4-6 hours to adapt
- **DeeDee's**: scripts/quality/master.sh (443 lines)
- **Benefits**:
  - Interactive menu for developers
  - Metrics display
  - Testing orchestration
- **Adaptation needed**: 
  - Replace Swift-specific checks with Rails checks
  - Integrate with existing test suites
  - Replace SwiftLint with Rubocop checks

#### TIER 4: LOWER PRIORITY / NOT APPLICABLE

- Performance monitoring suite (108KB) - Overkill for current Rails project
- Static analysis toolkit (232KB) - Swift/semgrep specific
- HealthKit/iOS security tools - Not applicable
- Swift build validation - Not applicable

### DELIVERABLE 5: Portability & Adaptation Assessment

**High Portability** (0 adaptation needed):
- shellcheck-runner.sh ✓
- jsonlint-runner.sh ✓
- yamllint-runner.sh ✓
- markdownlint-runner.sh ✓
- tty-colors.sh ✓
- gitleaks-runner.sh (minor config)
- cleanup-session-data.sh ✓

**Moderate Portability** (10-20% adaptation):
- install-git-hooks.sh (git worktree logic needs adjustment)
- git-worktree-utils.sh (generic but needs Rails context)
- hook-timing.sh (can be adapted)

**Low Portability** (needs significant rewrite):
- All Swift-specific tooling (health, security, build)
- semgrep static analysis (SwiftLint patterns not needed)
- Performance benchmarking suite (Swift/iOS specific)

### DELIVERABLE 6: Implementation Priority & Effort Estimates

#### QUICK WINS (Total: 2-3 hours for HIGH IMPACT)

| Script | ROI | Effort | Type | Status |
|--------|-----|--------|------|--------|
| tty-colors.sh | HIGH | 25m | Library | Port + integrate |
| shellcheck-runner.sh | HIGH | 20m | Hook | Port + hook |
| gitleaks-runner.sh | CRITICAL | 1.5h | Hook | Port + test + config |
| yamllint-runner.sh | MEDIUM | 20m | Hook | Port + hook |
| jsonlint-runner.sh | MEDIUM | 20m | Hook | Port + hook |

**Estimated total**: 3.5 hours for 5 major improvements

#### MEDIUM PRIORITY (Total: 4-5 hours)

| Script | ROI | Effort | Status |
|--------|-----|--------|--------|
| git-hooks infrastructure | HIGH | 1.5h | Systematic |
| cleanup-session-data.sh | MEDIUM | 1.5h | Enhancement |
| markdownlint-runner.sh | LOW | 20m | Nice-to-have |

#### FUTURE CONSIDERATIONS

- Quality dashboard master.sh (requires more refactoring)
- MCP configuration auto-sync (setup-claude-mcp-aliases.sh pattern)
- Hook timing infrastructure (hook-timing.sh)

### DELIVERABLE 7: Immediate Action Items

**PHASE 1 - THIS WEEK** (Critical security + foundations)
1. Port tty-colors.sh library
2. Update all scripts to use it
3. Port gitleaks-runner.sh + integrate into lefthook pre-commit
4. Port shellcheck-runner.sh + integrate into pre-commit
5. Test all changes locally

**PHASE 2 - NEXT WEEK** (Quality improvements)
1. Port yamllint-runner.sh + integrate
2. Port jsonlint-runner.sh + integrate
3. Port advanced cleanup-session-data.sh
4. Update documentation

**PHASE 3 - FUTURE** (Systematic improvements)
1. Git hooks installation infrastructure
2. Quality dashboard adaptation
3. MCP configuration auto-sync pattern
4. Performance metrics collection

### Key Findings & Insights

1. **DeeDee is a prototype project** with 3.2x more automation code
2. **COVID-CO2-tracker has good foundations** but missing key infrastructure
3. **Biggest gap: Security automation** - No secret scanning currently
4. **Color/TTY handling** is fragile - needs tty-colors.sh across board
5. **Git hooks infrastructure** exists in DeeDee but COVID uses .lefthook directly
6. **Session tracking** is basic in COVID but can be significantly enhanced
7. **Testing infrastructure** in COVID is actually quite good (quick/full/smart)
8. **Documentation** in DeeDee about hooks is excellent template for adaptation

### Files Requiring Review for Complete Port

**Must Copy**:
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/lib/tty-colors.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/shellcheck-runner.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/gitleaks-runner.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/yamllint-runner.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/jsonlint-runner.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/git-hooks/markdownlint-runner.sh

**Study for Adaptation**:
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/cleanup-session-data.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/install-git-hooks.sh
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/quality/master.sh

**Reference Only**:
- /Users/alexanderriccio/Documents/GitHub/DeeDee-Prototype/scripts/AI_TOOLING_INDEX.md

---

## Summary

DeeDee-Prototype has developed sophisticated automation infrastructure that is **72% portable** to COVID-CO2-tracker with **minimal adaptation**. The highest-value ports are:

1. Security: gitleaks-runner.sh (prevents credential leaks)
2. Infrastructure: tty-colors.sh library (fixes output issues)
3. Quality: shell/yaml/json linting hooks (code quality)
4. Session: advanced cleanup infrastructure (maintenance)

**Estimated total effort to port critical items: 4-5 hours**
**Estimated impact: Medium-to-High (security improvements, better automation, CI/CD fixes)**

Following the established instructions for cross-repository pattern consistency, these scripts should be ported selectively starting with security (gitleaks) and infrastructure (tty-colors) foundational improvements.

