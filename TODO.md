# TODO List - COVID CO2 Tracker

## Previously Completed
- DONE: Rack Attack values increased 10x for worst-case React patterns (125k/15min, 5k/min burst) with privacy-focused 15-minute windows
- RESOLVED: Claude removed redundant presence validations on belongs_to (Rails 5+ makes them required by default - validations still work!)
- DONE: Export day limit removed - users can now export any period length (limited only by memory/record count)
- VERIFIED: DatabaseCleaner transaction conflict properly handled - export tests use truncation strategy, BaseService skips check in test env

## 🚨 Critical Security Issues (Immediate)
- [ ] **CRITICAL**: Patch 26 security vulnerabilities - Update Rails to 7.1.5.2+, Nokogiri to 1.18.9+, rails-html-sanitizer to 1.6.1+
- [ ] **CRITICAL**: Fix ZIP streaming memory bomb - Stream directly to response instead of StringIO buffer
- [ ] **CRITICAL**: Add missing /health endpoint for deployment verification

## 🔴 High Priority Issues (This Week)
- [ ] Add UTF-8 BOM to CSV exports for Excel international compatibility
- [ ] Fix streaming client disconnect detection bug (incorrect boolean check)
- [ ] Fix memory calculation silent failure in Export::BaseService
- [ ] Add error handling to StreamingCsvService (violates no-silent-failures principle)
- [ ] Implement APM and error tracking (Sentry or NewRelic)
- [ ] Create proper README for human developers (current is only 7 lines)

## 🟡 Architecture & Technical Debt (Next Sprint)
- [ ] Refactor ExportsController - 498 lines with 11+ responsibilities, violates SRP
- [ ] Unify authentication systems - JWT for legacy vs Bearer tokens for exports
- [ ] Refactor export service hierarchy from inheritance to composition
- [ ] Add missing database indexes: [device_id, measurementtime] and [sub_location_id, measurementtime]
- [ ] Fix pre-commit hook Rubocop issues (effing_rubocop_breaking_precommit)
- [ ] Extract controller concerns into separate modules
- [ ] **Performance**: Implement async job processing (Sidekiq recommended) for exports >50k records - see copilot_notes/async-export-implementation-plan.md

## 📚 Documentation & Discoverability Improvements
- [ ] Add rubocop reference comment to successfully fixed files: `# For ABC complexity violations, see: copilot_notes/rubocop-complexity-reduction-pattern.md`
- [ ] Add pattern reference to .rubocop.yml config near Metrics/AbcSize section
- [ ] Add Rubocop ABC complexity entry to PROBLEM_SOLUTION_MAP_CO2.md: `Rubocop ABC Complexity → copilot_notes/rubocop-complexity-reduction-pattern.md`

## 🟢 Medium Priority (Next Month)
- [ ] Add internationalization support for error messages (all hardcoded English)
- [ ] Create OpenAPI/Swagger documentation for API
- [ ] Implement secret rotation automation for export tokens
- [ ] Add developer onboarding documentation
- [ ] Implement connection pool monitoring
- [ ] Implement blue-green deployment for irreversible migrations
- [ ] Add strong parameters to ExportsController

## Existing TODOs
- [ ] a query builder *seems* like the wrong approach for rails exports, but IDK
- [ ] Heroku needs us to upgrade the postgres version. This is a high priority and must be done this month. Guide: https://devcenter.heroku.com/articles/upgrading-heroku-postgres-databases#upgrading-with-pg-upgrade
- [ ] (at some point) need to work out rails deprecations

## Notes from Code Review (Commits 96de597...22b447b)
- Export system shows sophisticated implementation but has critical operational gaps
- Security testing is enterprise-grade with 1,600+ lines of tests
- Documentation for AI agents is world-class, but human developer docs are minimal
- Performance optimizations are excellent (indexing, streaming, batching)
- Rate limiting is well-designed with privacy-conscious 15-minute windows
- Emergency procedures documentation is outstanding

- Replace code examples in instructions with flexible prose descriptions (generally get better results from agentic LLMs with concise prose rather than verbose examples)

## 🔧 Export::MultiCsvService Issues (Found in Code Review)

### Missing Method Dependencies on BaseService
- [ ] Verify/implement `measurements_query(filters)` method in BaseService
- [ ] Verify/implement `format_timestamp(time)` method in BaseService  
- [ ] Verify/implement `sanitize_for_export(value)` method in BaseService
- [ ] Verify/implement `log_export_start(type)` method in BaseService
- [ ] Verify/implement `log_export_complete(type, count, duration)` method in BaseService
- [ ] Verify/implement `log_export_error(type, exception)` method in BaseService

### Inconsistencies & Improvements
- [ ] **Fix manifest file naming inconsistency**: Stream ZIP uses 'metadata.json' while directory export uses 'manifest.json' - pick one
- [ ] **Extract CSV headers to constants** for better maintainability (currently hardcoded in multiple places)
- [ ] **Add UTF-8 encoding specification** to CSV operations for international character safety
- [ ] **Consider forcing UTF-8 encoding** on stream writes to prevent encoding failures
- [ ] **Document BaseService interface** - MultiCsvService depends heavily on inherited methods that aren't visible in the file

## 🔧 Export::QueryBuilder Issues (Found in Code Review)

### Code Quality & Consistency Issues
- [ ] **Inconsistent query syntax**: Mixed use of Rails range syntax and SQL strings (lines 27 vs 33) - standardize to Rails query interface
- [ ] **Complex place_id logic** (lines 56-75): Extract numeric detection and branching to separate methods for clarity
- [ ] **Inefficient includes logic** (lines 92-119): Optimize with Set operations instead of regex matching on every call
- [ ] **Extract complex conditionals**: Lines 62-74 violate instruction to extract complex navigation chains (per copilot-instructions.md)
- [ ] **Break up apply_location_filters**: Method doing multiple distinct things - split into smaller focused methods

### Missing Validations
- [ ] **Add CO2 threshold validation**: No checks for negative above_ppm/below_ppm values
- [ ] **Add logical consistency check**: No validation that above_ppm > below_ppm (nonsensical filter combination)
- [ ] **Consider value range limits**: Should there be maximum acceptable CO2 values (e.g., 10000 ppm)?

### Performance Optimizations
- [ ] **Cache includes determination**: Avoid repeated field checking with regex
- [ ] **Use Set for field matching**: More efficient than multiple regex operations
- [ ] **Consider memoizing date parsing**: For repeated date filter operations

### Code Organization Improvements
- [ ] **Extract validation logic**: Consider separate validator class for filter parameters
- [ ] **Simplify date parsing**: Use Rails date parsing helpers instead of manual regex/strptime
- [ ] **Consider filter builder pattern**: For complex multi-parameter filter construction

## 🧪 Test Suite Improvements (From Comprehensive Test Review)

### Critical Test Architecture Issues
- [ ] **Split mega-specs**: Break 1,306-line export_system_security_spec.rb into focused files by concern
- [ ] **Fix test isolation**: Replace before(:context) with factories/fixtures to prevent test pollution
- [ ] **Make tests deterministic**: Replace rand() in factories with fixed seeds for reproducibility
- [ ] **Reduce test setup overhead**: 100 test records in before(:context) slows CI - use more targeted data

### Missing Test Coverage
- [ ] **Add authorization bypass tests**: Verify users can't access other users' export data
- [ ] **Add XXE (XML External Entity) tests**: For XML export format security
- [ ] **Add SSRF tests**: If export URLs are user-controllable
- [ ] **Add concurrent export tests**: Race conditions and locking behavior
- [ ] **Add export resumption tests**: Handling of interrupted/failed exports
- [ ] **Add encoding tests**: Unicode/UTF-8 edge cases in exports
- [ ] **Add malformed date input tests**: Edge cases beyond basic validation

### Test Infrastructure Enhancements
- [ ] **Add performance benchmarking helpers**: Track export speed regressions
- [ ] **Create shared contexts**: For common test scenarios (authenticated user, rate limited, etc.)
- [ ] **Implement factory linting**: Catch N+1 queries and unused associations
- [ ] **Add edge-case factory traits**: nil values, extremes, boundary conditions
- [ ] **Create test data seeding strategy**: For large dataset testing

### Test Quality Improvements
- [ ] **Standardize spec style**: Consistent use of describe vs RSpec.describe
- [ ] **Fix string style inconsistencies**: Pick single or double quotes project-wide
- [ ] **Replace instance variables**: Use let/let! consistently instead of @variables
- [ ] **Add integration tests**: Full export workflow end-to-end with Capybara
- [ ] **Add contract tests**: API schema validation using JSON Schema
- [ ] **Consider mutation testing**: Use mutant gem to verify test effectiveness

### Test Documentation
- [ ] **Document test context setup rationale**: Why certain approaches were chosen
- [ ] **Add test coverage reports**: Track coverage metrics over time
- [ ] **Create test writing guidelines**: Ensure consistency across contributors
- [ ] **Document performance test thresholds**: What constitutes acceptable performance
