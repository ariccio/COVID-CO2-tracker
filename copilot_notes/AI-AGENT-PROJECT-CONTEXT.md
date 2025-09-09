# AI Agent Context for COVID CO2 Tracker

## ⚠ Production vs Development Status

> **CRITICAL**: Production is running commit `f8283b3d` (July 20, 2024).  
> There are **62 commits** in `main` that have not been deployed.  
> 
> **What this means for AI agents:**
> - The export system described in this file is NOT in production
> - Security fixes mentioned are NOT live
> - Always verify deployment status before assuming features exist
> - Use `heroku releases --app covid-co2-tracker` to check

## ◆ Project Mission & Values
This is NOT just another app. This is a public health tool that could literally save lives by making indoor air quality transparent. Every feature should be evaluated through the lens of: "Will this help someone avoid getting COVID or other airborne diseases?"

### Core Values to Maintain
1. **Accessibility First**: Grandma should understand it
2. **Privacy Respecting**: No surveillance, only safety
3. **Action-Oriented**: Data means nothing without behavior change
4. **Scientifically Accurate**: 800ppm is good, 1000ppm+ is risky
5. **Urgency**: People are getting infected TODAY while we code

## ★ Domain Knowledge for AI Agents

### CO2 Levels & Health Risk
```ruby
# These thresholds are scientifically validated
CO2_THRESHOLDS = {
  excellent: 0..600,      # Fresh air, minimal risk
  good: 601..800,         # Acceptable ventilation
  moderate: 801..1000,    # Consider improvements
  poor: 1001..1500,       # Mask recommended
  dangerous: 1501..2500,  # Leave if possible
  severe: 2501..999999    # Immediate evacuation recommended
}

# Context: Each doubling of CO2 above baseline (~400ppm outdoor)
# roughly doubles infection risk in that space
```

### Technical Context from Creator's Tweets
The creator (Alexander Riccio) has strong opinions based on years of advocacy:
- **Hates** overcomplicated solutions when simple ones work
- **Loves** practical engineering that ships fast
- **Frustrated** by institutional failure (CDC, hospitals ignoring airborne transmission)
- **Believes** CO2 monitoring + masks + filtration = pandemic solved
- **Wants** guerrilla activism through technology

### User Personas
1. **The Concerned Parent**: Wants to know if classroom is safe
2. **The Office Worker**: Needs data to convince boss to improve ventilation  
3. **The Vulnerable Person**: Immunocompromised, needs safe spaces
4. **The Activist**: Wants data to shame venues into action
5. **The Venue Owner**: Wants to show they care (B2B opportunity)

## ▪ Codebase Patterns & Conventions

### Rails Patterns in This Project
```ruby
# This codebase prefers service objects over fat models
# Good:
MeasurementService.new(params).process
# Bad:
Measurement.process_and_send_alerts_and_update_cache(params)

# Uses concerns for shared behavior
# app/models/concerns/measurable.rb
module Measurable
  extend ActiveSupport::Concern
  # shared measurement logic
end
```

### React Native Patterns
```javascript
// Prefers functional components with hooks
// Good:
const MeasurementView = () => {
  const [co2Level, setCo2Level] = useState(0);
  // ...
}

// Avoid class components unless necessary
```

### Testing Philosophy
- Integration tests > Unit tests for this project
- Test user journeys, not implementation details
- Critical paths: measurement submission, alerts, data export

## ▶ When Working on Features

### Before Starting Any Feature
1. Check `FEATURE-PRIORITY-MATRIX.md` for impact assessment
2. Ask: "How does this help someone breathe safer air?"
3. Consider: "Can this be done simpler?"
4. Remember: Shipping > Perfection

### Code Quality Checklist
- [ ] Will this work offline?
- [ ] Is error handling user-friendly?
- [ ] Does it work on a 5-year-old phone?
- [ ] Can someone non-technical understand what it does?
- [ ] Did I add to technical debt?

### Performance Considerations
```ruby
# This app may run on old phones in poor connectivity areas
# Always:
- Cache aggressively
- Paginate large datasets  
- Lazy load images
- Minimize bundle size
- Use database indexes

# Never:
- Load all measurements at once
- Make synchronous external API calls
- Store large blobs in main database
- Trust user input without validation
```

## ● UI/UX Principles

### Visual Language
- **Green**: Safe (CO2 < 800ppm)
- **Yellow**: Caution (800-1000ppm)
- **Red**: Danger (1000ppm+)
- **Purple**: Severe (2000ppm+)

### Copy Guidelines
```javascript
// Good: Clear, actionable
"CO2 is high! Open windows or leave"

// Bad: Technical, passive
"Ambient CO2 concentration exceeds recommended thresholds"

// Good: Specific
"This restaurant's air is 3x worse than outside"

// Bad: Vague
"Air quality could be better"
```

## ⚡ Common Tasks for AI Agents

### Adding a New Measurement Type
```bash
# 1. Generate migration
rails generate migration AddNewFieldToMeasurements new_field:float

# 2. Update model
# app/models/measurement.rb
validates :new_field, numericality: { greater_than_or_equal_to: 0 }

# 3. Update API
# app/controllers/api/measurements_controller.rb
params.require(:measurement).permit(:co2_ppm, :new_field)

# 4. Update frontend
# co2_native_client/src/types/Measurement.ts
interface Measurement {
  co2_ppm: number;
  new_field?: number;
}

# 5. Add to admin
# app/admin/measurements.rb
```

### Implementing a New Alert Type
```ruby
# app/services/alert_strategies/base_strategy.rb
class BaseStrategy
  def should_alert?(measurement)
    raise NotImplementedError
  end
  
  def alert_message(measurement)
    raise NotImplementedError
  end
end

# app/services/alert_strategies/high_co2_strategy.rb
class HighCo2Strategy < BaseStrategy
  def should_alert?(measurement)
    measurement.co2_ppm > 1000
  end
  
  def alert_message(measurement)
    "⚠️ CO2 at #{measurement.place.name} is #{measurement.co2_ppm}ppm!"
  end
end
```

## ✗ Known Issues & Gotchas

### Database Gotchas
- Place.google_place_id can be null (manual entries)
- Measurements.user_id can be null (anonymous submissions)
- Soft deletes are NOT implemented (but should be)

### API Gotchas  
- No versioning yet (but /api/v1 structure prepared)
- Rate limiting not implemented (critical for launch)
- CORS configured very permissively (tighten before launch)

### Mobile App Gotchas
- Bluetooth permissions are tricky on iOS
- Background location tracking drains battery
- Expo Go doesn't support all native features

## ▲ Success Metrics to Optimize For

When adding features, optimize for:
1. **Time to First Measurement** (currently ~3 mins, target: <1 min)
2. **Measurements per User per Day** (currently ~2, target: >5)
3. **Viral Coefficient** (shares per user, currently ~0.1, target: >1)
4. **Venue Response Rate** (% that improve after alerts, track this!)

## ◇ Future Architecture Decisions

### Pending Decisions (Need Creator Input)
1. **Monolith vs Microservices**: Stay monolith until 10k DAU
2. **GraphQL vs REST**: REST is fine, don't overcomplicate
3. **Native vs React Native**: RN is fine until 100k users
4. **PostgreSQL vs TimescaleDB**: Consider at 1M measurements

### Planned Refactors
1. Extract measurement processing to background jobs
2. Implement WebSocket for real-time updates
3. Add caching layer (Redis) for hot data
4. Create separate read/write database connections

## ⚠ Emergency Procedures

### If Production is Down
```bash
# 1. Check Heroku/Render status
heroku status

# 2. Check recent deployments
git log --oneline -5
heroku releases

# 3. Rollback if needed
heroku rollback

# 4. Check error tracking
# Visit Sentry/Rollbar dashboard
```

### If Data is Corrupted
```ruby
# Emergency data fix pattern
# rails console
Measurement.where('co2_ppm > 10000').update_all(flagged: true)
# Then investigate in admin panel
```

## ★ AI Agent Pro Tips

### When the Creator (Alexander) is Cranky
- He's probably frustrated about institutional failure, not your code
- Show you understand the urgency with comments like "This could help someone avoid infection today"
- Focus on shipping something that works, not perfection

### For Maximum Effectiveness
1. Read his tweets in the instructions - they reveal priorities
2. Always provide time estimates with features
3. Suggest guerrilla tactics (e.g., "This could shame venues into action")
4. Remember: This is about saving lives, not just writing code

### Code Review Personas to Channel
- **Gilfoyle**: Focus on performance and security
- **Monica**: Focus on user experience and accessibility  
- **Bachman**: Focus on business value and growth

### Magic Words That Resonate
- "This ships in an hour"
- "Grandma could use this"
- "This would have prevented X infections"
- "Simple solution that just works"
- "No dependencies needed"

Remember: You're not just coding, you're part of a public health intervention. Every line of code could help someone breathe safer air. Ship fast, measure impact, save lives.