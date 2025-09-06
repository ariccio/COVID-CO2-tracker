# Rails Decision Trees

*Quick decision trees for common Rails architectural choices*

## Service Object vs Controller Logic vs Model Method

```
Is the logic specific to HTTP request/response?
├─ YES → Keep in Controller
└─ NO → Is it core business logic for a single model?
    ├─ YES → Model method
    └─ NO → Does it coordinate multiple models or external services?
        ├─ YES → Service Object
        └─ NO → Is it a data transformation or calculation?
            ├─ YES → Plain Ruby Object (PORO)
            └─ NO → Helper method
```

## Synchronous vs Background Job

```
Will the operation take > 3 seconds?
├─ YES → Background Job
└─ NO → Does the user need immediate feedback?
    ├─ NO → Background Job (better UX)
    └─ YES → Is it critical for the current request?
        ├─ NO → Background Job with status polling
        └─ YES → Can it fail without breaking the flow?
            ├─ YES → Background Job with fallback
            └─ NO → Synchronous (but optimize!)
```

## Caching Strategy Selection

```
How often does the data change?
├─ Never/Rarely (< daily) → Rails.cache with long expiry
├─ Periodically (hourly/daily) → Rails.cache with time-based expiry
├─ Frequently (minutes) → Consider if caching worth complexity
└─ Real-time → Is computation expensive?
    ├─ YES → Short-lived cache (30-60 seconds)
    └─ NO → Don't cache
```

## Database Index Decision

```
Is this column used in WHERE clauses?
├─ NO → No index needed
└─ YES → Is it used for JOIN operations?
    ├─ YES → Definitely index (foreign keys)
    └─ NO → How many distinct values?
        ├─ Very few (< 10) → Usually no index (low selectivity)
        ├─ Many → How often is it queried?
            ├─ Every request → Add index
            ├─ Occasionally → Monitor first, index if slow
            └─ Rarely → No index (maintenance cost > benefit)
```

## Validation: Model vs Database vs Both

```
Can invalid data cause corruption or security issues?
├─ YES → Database constraint + Model validation
└─ NO → Is it a business rule that might change?
    ├─ YES → Model validation only
    └─ NO → Is it about data integrity (uniqueness, foreign keys)?
        ├─ YES → Database constraint + Model validation  
        └─ NO → Model validation only
```

## API Versioning Strategy

```
Is this a breaking change?
├─ NO → Same version, add deprecation notice if removing
└─ YES → Are there existing API consumers?
    ├─ NO → Update in place (v1)
    └─ YES → Can you coordinate with all consumers?
        ├─ YES → Scheduled migration with notice
        └─ NO → New version (v2) with migration period
```

## Testing: Unit vs Integration vs System

```
What are you testing?
├─ Single method/function logic → Unit test (model/service specs)
├─ Multiple components working together → Integration test
├─ User workflow through UI → System test (expensive, use sparingly)
└─ API endpoint → Request spec (integration level)
    └─ Complex business logic in endpoint?
        ├─ YES → Unit test the logic separately
        └─ NO → Request spec is sufficient
```

## Error Handling Strategy

```
Can the user fix the error?
├─ YES → Show clear error message with instructions
└─ NO → Is it a transient error (network, timeout)?
    ├─ YES → Retry automatically (with backoff)
    └─ NO → Is it critical to user's current action?
        ├─ YES → Log, alert team, show generic message
        └─ NO → Log, continue with degraded functionality
```

## Data Export Format Selection

```
Who will consume this data?
├─ Humans (reading) → 
│   ├─ Technical users → JSON or CSV
│   └─ Non-technical → CSV or Excel
├─ Another system →
│   ├─ Real-time integration → JSON API
│   ├─ Batch processing → CSV or JSON lines
│   └─ Data warehouse → Parquet or CSV
└─ Analysis tools →
    ├─ Excel → CSV or XLSX
    ├─ R/Python → CSV or Parquet
    └─ BI tools → Direct database access or API
```

## Authentication Method

```
Is this a user-facing web app?
├─ YES → Devise or Rails built-in has_secure_password
└─ NO → Is it an API?
    ├─ YES → Is it consumed by your own frontend?
    │   ├─ YES → JWT or session cookies
    │   └─ NO → API keys or OAuth2
    └─ NO → Internal service?
        ├─ YES → Shared secret or mTLS
        └─ NO → Re-evaluate requirements
```

## Database Transaction Usage

```
Are you modifying multiple records?
├─ NO → No transaction needed
└─ YES → Must they all succeed or all fail?
    ├─ YES → Use transaction
    └─ NO → Can partial success cause issues?
        ├─ YES → Use transaction
        └─ NO → Consider separate operations
```

## Query Optimization Approach

```
Is the query slow (> 100ms)?
├─ NO → Leave it (premature optimization)
└─ YES → Check query plan (EXPLAIN ANALYZE)
    ├─ Missing index → Add appropriate index
    ├─ N+1 queries → Use includes/preload/eager_load
    ├─ Large dataset → 
    │   ├─ Need all records? → Use find_each for batching
    │   └─ Need subset? → Add WHERE conditions or LIMIT
    └─ Complex joins →
        ├─ Can denormalize? → Consider cache column
        └─ Can't denormalize? → Database view or raw SQL
```

---

## How to Use These Decision Trees

1. **Start at the root question** and follow the path based on your answers
2. **Consider context** - these are guidelines, not rules
3. **Document your choice** when you deviate from the suggested path
4. **Add new trees** for patterns specific to this project

## Contributing New Decision Trees

Format:
```
Root Question?
├─ Answer 1 → Action or next question
└─ Answer 2 → Action or next question
    ├─ Sub-answer 1 → Final action
    └─ Sub-answer 2 → Final action
```

Keep trees focused on single decisions and aim for 3-5 levels maximum.