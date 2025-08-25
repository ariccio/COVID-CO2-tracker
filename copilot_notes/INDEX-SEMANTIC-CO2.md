# 🧠 COVID CO2 Tracker Semantic Knowledge Index
*AI-optimized task pattern matching for rapid context loading*
*Last updated: 2025-08-25*

## 🚨 ALWAYS START HERE
This index maps task keywords → relevant files with word counts for context budget management.
**Goal**: Load <20k tokens for 80% of tasks, maintain laser focus on public health mission.

## 🎯 TASK PATTERN MATCHER

### Core CO2 Monitoring
```yaml
"measurement" | "reading" | "co2" | "ppm":
  quick: QUICK-REFERENCE-CARD.md#co2-thresholds (100 words)
  model: app/models/measurement.rb
  api: app/controllers/api/measurements_controller.rb
  focused: measurement-processing-guide.md (2000 words)
  comprehensive: sensor-integration-complete.md (8000 words)

"sensor" | "bluetooth" | "aranet" | "device":
  quick: sensor-connection-checklist.md (500 words)
  code: co2_native_client/src/features/bluetooth/
  focused: bluetooth-troubleshooting-guide.md (3000 words)
  comprehensive: sensor-ecosystem-integration.md (10000 words)
```

### Alerts & Notifications
```yaml
"alert" | "notification" | "sms" | "email" | "1000ppm":
  🔥urgent: FEATURE-PRIORITY-MATRIX.md#tier-1 (500 words)
  quick: alert-implementation-1-hour.md (800 words)
  service: app/services/alert_service.rb
  focused: multi-channel-alerting.md (3500 words)

"threshold" | "danger" | "warning" | "safe":
  science: co2-thresholds-scientific-basis.md (1500 words)
  quick: QUICK-REFERENCE-CARD.md#co2-thresholds (100 words)
  implementation: app/models/measurement.rb#CO2_THRESHOLDS
```

### Venues & Places
```yaml
"venue" | "place" | "location" | "restaurant" | "bar":
  quick: venue-feature-quickstart.md (500 words)
  model: app/models/place.rb
  admin: app/admin/places.rb
  focused: google-places-integration.md (3000 words)
  comprehensive: venue-accountability-system.md (12000 words)

"leaderboard" | "ranking" | "shame" | "public":
  🔥urgent: FEATURE-PRIORITY-MATRIX.md#public-venue-leaderboard (300 words)
  implementation: venue-leaderboard-2-hours.md (1500 words)
  activism: public-shaming-effectiveness.md (2000 words)
```

### Mobile App (React Native)
```yaml
"mobile" | "react native" | "expo" | "ios" | "android":
  quick: mobile-quickstart.md (600 words)
  dir: co2_native_client/
  focused: react-native-upgrade-guide.md (4000 words)
  comprehensive: mobile-architecture-patterns.md (15000 words)

"navigation" | "screen" | "view" | "ui":
  components: co2_native_client/src/components/
  screens: co2_native_client/src/screens/
  patterns: react-native-ui-patterns.md (2500 words)
```

### Backend (Rails)
```yaml
"api" | "endpoint" | "rails" | "backend":
  quick: QUICK-REFERENCE-CARD.md#key-files (200 words)
  routes: config/routes.rb
  focused: rails-api-patterns.md (3000 words)
  comprehensive: TECHNICAL-UPGRADE-GUIDE.md (8000 words)

"database" | "migration" | "postgres" | "query":
  quick: database-queries-quickref.md (400 words)
  schema: db/schema.rb
  focused: database-optimization-guide.md (3500 words)
  indexes: performance-indexes.md (1500 words)

"admin" | "activeadmin" | "dashboard":
  quick: admin-panel-guide.md (500 words)
  dir: app/admin/
  focused: activeadmin-customization.md (2000 words)
```

### Deployment & DevOps
```yaml
"deploy" | "production" | "heroku" | "render":
  🚀script: scripts/deploy-production.sh
  quick: deployment-checklist.md (500 words)
  focused: TECHNICAL-UPGRADE-GUIDE.md#deployment (2000 words)
  comprehensive: zero-downtime-deployment.md (5000 words)

"error" | "crash" | "bug" | "500" | "exception":
  emergency: QUICK-REFERENCE-CARD.md#emergency-fixes (200 words)
  logs: heroku logs --tail
  monitoring: sentry-error-tracking-setup.md (1500 words)
  debugging: production-debugging-guide.md (3000 words)
```

### Testing & Quality
```yaml
"test" | "rspec" | "jest" | "coverage":
  quick: QUICK-REFERENCE-CARD.md#test-commands (100 words)
  script: scripts/run-all-tests.sh
  focused: testing-strategy-guide.md (2500 words)
  comprehensive: end-to-end-testing-setup.md (8000 words)

"security" | "vulnerability" | "audit" | "cve":
  🚨urgent: bundle audit && npm audit
  quick: security-checklist.md (800 words)
  focused: security-hardening-guide.md (3500 words)
```

### Public Health & Science
```yaml
"infection" | "transmission" | "risk" | "covid":
  science: infection-risk-co2-correlation.md (2500 words)
  advocacy: public-health-talking-points.md (1500 words)
  implementation: risk-calculation-algorithms.md (2000 words)

"ventilation" | "hvac" | "air quality" | "filtration":
  science: ventilation-improvement-guide.md (3000 words)
  venue-guide: venue-owner-improvement-guide.md (2000 words)
  advocacy: institutional-accountability.md (2500 words)

"research" | "study" | "paper" | "evidence":
  bibliography: scientific-references.md (5000 words)
  data-export: research-data-export-guide.md (1500 words)
  collaboration: research-partnership-guide.md (2000 words)
```

## 📊 CONTEXT BUDGET GUIDELINES

### Task Complexity → Maximum Context Load
| Duration | Keywords | Strategy | Token Budget |
|----------|----------|----------|-------------|
| <15 min | 1 keyword | Quick refs only | <1,000 |
| 15-30 min | 1-2 keywords | Quick + code refs | <3,000 |
| 30-60 min | 2-3 keywords | Quick + 1 focused | <6,000 |
| 1-2 hours | 3-4 keywords | Multiple focused | <12,000 |
| 2-4 hours | Complex | Focused + comprehensive | <25,000 |
| >4 hours | Architecture | All relevant + continuation | No limit |

## 🔍 SMART LOADING LOGIC

### Component-Specific Loading
```javascript
// MEASUREMENTS ONLY
if (task.includes("measurement") && !task.includes("venue")) {
  load([
    "QUICK-REFERENCE-CARD.md#co2-thresholds",     // 100 words
    "app/models/measurement.rb",                   // Review code
    "measurement-processing-guide.md"              // 2000 words
  ])
}

// ALERTS URGENT
if (task.includes("alert") || task.includes("sms")) {
  load([
    "FEATURE-PRIORITY-MATRIX.md#tier-1",          // 500 words FIRST
    "app/services/alert_service.rb",              // Review implementation
    "alert-implementation-1-hour.md"              // 800 words
  ])
}

// DEPLOYMENT CRITICAL
if (task.includes("deploy") || task.includes("production")) {
  run("./scripts/pre-deploy-check.sh")            // Validate first
  load([
    "deployment-checklist.md",                    // 500 words
    "QUICK-REFERENCE-CARD.md#before-deploying"    // 100 words
  ])
}
```

## 🎯 HIGH-PRIORITY QUICK WINS

These are from FEATURE-PRIORITY-MATRIX.md Tier 1 - massive impact in <2 hours:

1. **SMS Alerts** (1 hour): `alert-implementation-1-hour.md`
2. **Venue Leaderboard** (2 hours): `venue-leaderboard-2-hours.md`
3. **Social Sharing** (30 min): `social-sharing-quick.md`
4. **CSV Export** (1 hour): `data-export-implementation.md`
5. **Traffic Light UI** (1 hour): `simple-ui-safety-indicators.md`

## 🚀 COMMON TASK PATTERNS

### "Add SMS alerts when CO2 exceeds 1000ppm"
```yaml
Load:
  1. FEATURE-PRIORITY-MATRIX.md#sms-alerts (200 words)
  2. app/services/alert_service.rb (review existing)
  3. Gemfile (check for twilio-ruby)
  4. alert-implementation-1-hour.md (800 words)
Total: ~1,200 words + code review
```

### "Deploy to production"
```yaml
Execute:
  1. ./scripts/pre-deploy-check.sh
  2. bundle exec rspec (if not in script)
Load:
  3. deployment-checklist.md (500 words)
  4. TECHNICAL-UPGRADE-GUIDE.md#deployment (2000 words) [if issues]
```

### "Fix bluetooth connection issues"
```yaml
Load:
  1. co2_native_client/src/features/bluetooth/Bluetooth.tsx
  2. bluetooth-troubleshooting-guide.md (3000 words)
  3. sensor-connection-checklist.md (500 words)
Debug:
  4. expo start --ios (test on device)
  5. Check device permissions
```

## 📈 PROGRESSIVE LOADING STAGES

### Stage 1: Reconnaissance (0 tokens)
1. Read this INDEX-SEMANTIC-CO2.md
2. Identify task keywords
3. Determine complexity
4. Calculate context budget

### Stage 2: Quick Reference (<1,000 tokens)
- QUICK-REFERENCE-CARD.md sections
- Code location references
- Script availability check

### Stage 3: Focused Guides (2,000-5,000 tokens)
- Task-specific implementation guides
- Troubleshooting documents
- Integration patterns

### Stage 4: Comprehensive (10,000+ tokens)
- Full architecture documents
- Complete upgrade guides
- End-to-end implementation

### Stage 5: Continuation Setup (At 80% capacity)
- Create context preservation file
- Generate continuation prompt
- Save state to copilot_notes/memory/

## 🧪 EFFICIENCY METRICS

Track these to improve the index:
- **Hit Rate**: % of tasks that find relevant guide immediately
- **Context Efficiency**: Average tokens used vs task complexity
- **Continuation Frequency**: How often we hit context limits
- **Guide Usefulness**: Which guides actually help vs distract

## 💡 SELF-IMPROVEMENT PROTOCOL

When you discover something new:
1. Create descriptive file: `2025-08-25-[component]-[issue]-[solution].md`
2. Add to this index with word count
3. Update PROBLEM_SOLUTION_MAP if debugging
4. Create script if repeatable
5. Mark with 🔥 if high-impact

## 🎓 PUBLIC HEALTH CONTEXT

Remember the mission with every task:
- **800ppm**: Good ventilation, low risk
- **1000ppm**: Mask recommended
- **1500ppm**: Leave if possible
- **2000ppm+**: Immediate health hazard

Every feature should answer: "Does this help someone avoid infection TODAY?"

---
*Index Version: 1.0.0 | Based on DeeDee-Prototype patterns | Optimized for COVID CO2 Tracker*