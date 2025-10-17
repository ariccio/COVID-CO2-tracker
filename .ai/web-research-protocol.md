# Web Research Protocol - When and How to Research Effectively

Universal protocol for when and how to research effectively. Load this when encountering unfamiliar libraries, API changes, or needing external documentation.

## When to Research

### Immediate Research Needed
Research **before implementing** when:

✓ **Unfamiliar library or gem**
  - Never used before
  - Complex API surface
  - Multiple approaches possible
  - Example: New CSV streaming gem, unfamiliar S3 upload library

✓ **API deprecation warnings**
  - Rails upgrade changed API
  - Gem version changed behavior
  - Example: "DEPRECATED: This method will be removed in Rails 8"

✓ **Framework version changes**
  - Rails 7 → Rails 8 patterns changed
  - Ruby 3.1 → 3.3 new features available
  - Example: Wondering if Rails 7 has built-in streaming

✓ **Conflicting information**
  - Stack Overflow says one thing, docs say another
  - Multiple gems solve same problem
  - Example: "Should I use Sidekiq, delayed_job, or GoodJob?"

✓ **Security concerns**
  - Potential vulnerability
  - Best practices unclear
  - Example: "Is this parameter sanitization sufficient?"

✓ **Performance optimization**
  - Unsure which approach is faster
  - Benchmarking needed
  - Example: "includes vs preload vs eager_load for this query?"

### Defer Research (Try First, Research If Issues)
Research **after attempting** when:

○ **Standard Rails patterns**
  - Well-documented in RailsGuides
  - Common patterns in this codebase
  - Example: Basic ActiveRecord associations

○ **Simple gem usage**
  - Straightforward API
  - Good README
  - Example: Using CSV.generate

○ **Minor syntax questions**
  - Can experiment in rails console
  - Low risk
  - Example: "Does .first return nil or raise?"

### No Research Needed
**Don't research** when:

✗ **Already know the pattern**
  - Used in this codebase already
  - Standard Rails idiom
  - Example: Strong parameters in controllers

✗ **Simple experimentation sufficient**
  - Can test in rails console quickly
  - Example: "Does .blank? work on integers?"

✗ **Clear error messages**
  - Error message explains issue
  - Stack trace shows exact problem
  - Example: "NoMethodError: undefined method `name' for nil:NilClass"

## How to Formulate Research Queries

### For AI Web Research (Claude, ChatGPT)

**Structure**: `[Technology] [Version] [Specific Question] [Context]`

**Good examples**:
```
"Rails 7 ActiveRecord streaming large result sets without memory issues"

"Ruby 3.3 best practices for CSV generation with 100k+ rows performance"

"Sidekiq retry strategies for failed export jobs with exponential backoff"

"PostgreSQL N+1 query optimization includes vs preload vs joins Rails 7"
```

**Bad examples** (too vague):
```
"How to use Rails?" → Too broad
"CSV performance" → Missing context
"Fix slow query" → No specifics
"Sidekiq errors" → Not specific enough
```

**Include context**:
- Framework versions (Rails 7, Ruby 3.3)
- Scale (100k rows, 10GB file, 1000 concurrent users)
- Current approach (if trying to optimize)
- Specific error messages (if debugging)

### For Google/Stack Overflow

**Structure**: `[Error message] OR [Specific API] [Technology] [Version]`

**Good examples**:
```
"NoMethodError undefined method zone for Time Rails 7"

"ActiveRecord find_each batch_size memory optimization Rails 7"

"Heroku R14 memory quota exceeded Rails background jobs"

"CSV generate streaming large files Ruby 3.3"
```

**Search operators**:
- `"exact phrase"` - Exact match
- `site:stackoverflow.com` - Specific site
- `-word` - Exclude word
- `2024..2025` - Date range

**Example with operators**:
```
"Rails 7" "includes" "preload" site:stackoverflow.com 2024..2025
```

### For Official Documentation

**Check in this order**:
1. **RailsGuides** (https://guides.rubyonrails.org/) - Rails patterns
2. **Ruby docs** (https://ruby-doc.org/) - Ruby standard library
3. **APIdock** (https://apidock.com/) - Rails API with examples
4. **Gem README** - Specific gem usage
5. **Gem docs** (rubydoc.info) - Full gem API reference

**Don't start with Stack Overflow** - Verify with official docs first

## Rails/Ruby-Specific Resources

### Primary Resources

**RailsGuides** (start here for Rails patterns):
- Active Record Query Interface
- Active Record Associations
- Rails Routing
- Action Controller Overview
- Active Support Core Extensions

**Ruby Standard Library**:
- CSV - CSV generation and parsing
- JSON - JSON generation and parsing
- Time - Time and date handling
- File - File operations
- Net::HTTP - HTTP requests

### Gem-Specific Resources

**For gems in this project** (check Gemfile):

**Sidekiq**:
- Docs: https://github.com/sidekiq/sidekiq/wiki
- Patterns: Retry logic, job priorities, error handling

**RSpec**:
- Docs: https://rspec.info/documentation/
- Patterns: let blocks, factories, shared examples

**Rubocop**:
- Docs: https://docs.rubocop.org/
- Config: .rubocop.yml in this project

**Devise** (if used):
- Docs: https://github.com/heartcombo/devise
- Patterns: Authentication, sessions, tokens

### Stack Overflow Best Practices

**Evaluate answers**:
✓ Upvotes >50
✓ Accepted answer (green checkmark)
✓ Recent (within 2 years)
✓ Matches your Rails/Ruby version
✓ Code example provided
✓ Explanation included

✗ No upvotes
✗ Very old (>5 years for Rails)
✗ Different Rails version
✗ No explanation
✗ Deprecated APIs

**Don't blindly copy** - Understand the solution first

### GitHub Issues as Research

**Good for**:
- Gem-specific issues
- Bug reports and workarounds
- Feature requests and discussions
- Version-specific problems

**Search pattern**:
```
site:github.com [gem-name] [issue-keyword] is:issue
```

**Example**:
```
site:github.com sidekiq "memory leak" is:issue
```

## Integration Workflow

### Research → Implementation → Verification

**Step 1: Research**
- Formulate specific query
- Check official docs first
- Verify multiple sources agree
- Note Rails/Ruby version compatibility

**Step 2: Implementation**
- Test approach in rails console first (if possible)
- Implement in code
- Add comments explaining approach (especially if non-obvious)
- Reference docs in comments if pattern is unusual

**Step 3: Verification**
- Run tests
- Check for warnings
- Verify performance (if performance-related)
- Check Rubocop (if style-related)

### Example: Research → Implementation

**Scenario**: Need to optimize export memory usage

**Step 1: Research**
```
Query: "Rails 7 ActiveRecord find_each batch_size memory optimization"

Sources checked:
1. RailsGuides - Active Record Query Interface (find_each section)
2. APIdock - find_each examples
3. Stack Overflow - "find_each vs find_in_batches Rails 7" (2024)

Findings:
- find_each yields one record at a time (memory efficient)
- find_in_batches yields array of records (use for batch operations)
- Default batch_size is 1000 (can tune)
- GC can be forced between batches if needed
```

**Step 2: Implementation**
```ruby
# app/services/export_service.rb

# Using find_each for memory-efficient iteration
# Based on Rails Guides: https://guides.rubyonrails.org/active_record_querying.html#find-each
# Yields one record at a time, loads 500 at a time from DB
measurements.find_each(batch_size: 500) do |measurement|
  csv << format_measurement(measurement)

  # Force GC every 5000 records to prevent memory bloat
  GC.start if (measurement.id % 5000).zero?
end
```

**Step 3: Verification**
```bash
# Test memory usage
bundle exec rspec spec/services/export_service_spec.rb

# Check for memory issues with large dataset
heroku run rails runner "ExportService.process(Export.find(123))" --app covid-co2-tracker

# Monitor memory (should stay under 200MB)
heroku logs --ps worker.1 --tail | grep "Memory"
```

## Deep Research Mode (Claude Web, ChatGPT Deep Research)

### When to Use Deep Research

**Use deep research for**:
- Complex architectural decisions
- Comparing multiple approaches
- Best practices for new patterns
- Comprehensive library evaluation
- Performance optimization strategies

**Deep research prompt structure**:
```
Context: [Describe your project and current situation]

Problem: [Specific problem to solve]

Constraints: [Version requirements, performance needs, etc.]

Question: [Specific question]

Request: Please research [topic] and provide:
1. Current best practices (2024-2025)
2. Code examples for Rails 7 / Ruby 3.3
3. Performance considerations
4. Common pitfalls to avoid
5. Recommended approach with justification

This research will be consumed by an AI agent implementing the solution,
so please provide structured, actionable guidance with code examples.
```

**Example deep research prompt**:
```
Context: Rails 7 application with COVID CO2 tracking, exporting large datasets
(100k+ measurements) to CSV/JSON. Currently experiencing memory issues (R14 on Heroku).

Problem: Need to stream exports efficiently without loading all data into memory.

Constraints:
- Rails 7.0, Ruby 3.3
- Heroku standard-2x dynos (1GB memory)
- CSV and JSON formats required
- Background job processing with Sidekiq
- Must maintain current API interface

Question: What are the best practices for streaming large ActiveRecord query
results to CSV/JSON in Rails 7, considering memory constraints and background
job context?

Request: Please research Rails 7 streaming patterns for large exports and provide:
1. Current best practices (2024-2025)
2. Code examples for streaming CSV/JSON generation
3. Memory optimization techniques (GC, batch sizes, buffering)
4. Sidekiq-specific considerations
5. Common pitfalls to avoid
6. Recommended approach with justification and code examples

This research will be consumed by an AI agent implementing the solution,
so please provide structured, actionable guidance.
```

### Incorporating Research Results

**After receiving deep research results**:

1. **Launch subagent with "ultrathink"** to incorporate findings
2. **Create or update documentation** in copilot_notes/
3. **Distill key insights** for future reference
4. **Update .ai/ files** if patterns broadly applicable

**Example subagent prompt after research**:
```
I've received deep research results on Rails 7 streaming patterns for large exports.

Please ultrathink about incorporating these findings into our export system:

1. Review research findings (attached)
2. Identify applicable patterns for our codebase
3. Create implementation plan with specific file changes
4. Document new patterns in copilot_notes/export-streaming-patterns.md
5. Update .ai/export-system-deep-dive.md with streaming section

Research results:
[Paste research results here]

Context files to review first:
- .ai/export-system-deep-dive.md (current patterns)
- app/services/export_service.rb (current implementation)
- copilot_notes/export-system-implementation.md (architecture)
```

## COVID/Public Health Research (Project-Specific)

### CO2 Threshold Research

**Authoritative sources**:
- CDC guidelines on indoor air quality
- ASHRAE standards (American Society of Heating, Refrigerating and Air-Conditioning Engineers)
- WHO (World Health Organization) air quality guidelines
- Academic papers on CO2 and viral transmission

**Search pattern**:
```
"CO2 ppm" "indoor air quality" "ventilation" site:.gov OR site:.edu 2020..2025
```

### Sensor Specification Research

**For integrating new CO2 sensors**:
- Manufacturer specifications
- Accuracy ranges
- Calibration requirements
- API documentation (if networked)

**Check**:
- NDIR (Non-Dispersive Infrared) vs other technologies
- Measurement range (0-5000 ppm typical)
- Accuracy (±50 ppm typical)
- Response time

## Summary: Research Decision Tree

```
Encountering unfamiliar pattern/API?
├─→ Is it standard Rails idiom?
│   ├─→ YES: Check RailsGuides, implement
│   └─→ NO: Continue
│
├─→ Can I test quickly in rails console?
│   ├─→ YES: Test first, research if issues
│   └─→ NO: Continue
│
├─→ Is it security or performance critical?
│   ├─→ YES: Research before implementing
│   └─→ NO: Continue
│
├─→ Is documentation clear?
│   ├─→ YES: Follow docs
│   └─→ NO: Research for examples
│
└─→ Complex architectural decision?
    └─→ YES: Use deep research mode
```

**When in doubt**: Research first, especially for security, performance, or unfamiliar patterns.

---

✓ Following research best practices and structured inquiry patterns.
