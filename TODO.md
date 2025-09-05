# TODO List - COVID CO2 Tracker

## Previously Completed
- DONE: Rack Attack values increased 10x for worst-case React patterns (125k/15min, 5k/min burst) with privacy-focused 15-minute windows
- RESOLVED: Claude removed redundant presence validations on belongs_to (Rails 5+ makes them required by default - validations still work!)
- DONE: Export day limit removed - users can now export any period length (limited only by memory/record count)

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
