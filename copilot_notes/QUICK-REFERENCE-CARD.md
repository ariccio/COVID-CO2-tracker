# 🎯 COVID CO2 Tracker - Quick Reference Card

## 🚀 Start Here Commands
```bash
# Setup everything (10 mins)
chmod +x copilot_notes/QUICK-START-SCRIPT.sh
./copilot_notes/QUICK-START-SCRIPT.sh

# Just run it
rails s                           # API on :3000
cd co2_native_client && npm start # Mobile
cd co2_client && npm start        # Web on :3001
```

## 📍 Key Files & Locations
```
app/models/measurement.rb        # Core data model
app/controllers/api/             # API endpoints
app/admin/                       # Admin panel configs
co2_native_client/               # React Native app
co2_client/                      # Web React app
config/routes.rb                 # URL mappings
db/schema.rb                     # Database structure
```

## ⚡ One-Hour Quick Wins
| Task | Command/Location | Impact |
|------|-----------------|--------|
| Add SMS alerts | `app/services/alert_service.rb` + Twilio | 🔥🔥🔥 |
| Public leaderboard | `app/controllers/venues_controller.rb` | 🔥🔥🔥 |
| CSV export | `respond_to :csv` in controllers | 🔥🔥 |
| Social sharing | Add meta tags to `app/views/layouts` | 🔥🔥🔥 |

## 🎨 CO2 Thresholds
```ruby
case co2_ppm
when 0..600    then "🟢 Excellent"
when 601..800  then "🟢 Good"  
when 801..1000 then "🟡 Moderate"
when 1001..1500 then "🔴 Poor"
when 1501..2500 then "🟣 Dangerous"
else "☠️ Evacuate"
end
```

## 🔥 Hot Database Queries
```ruby
# Current CO2 at venue
Measurement.where(place_id: X).order(:created_at).last

# Average last hour
Measurement.where(place_id: X)
  .where('created_at > ?', 1.hour.ago)
  .average(:co2_ppm)

# Worst venues today
Place.joins(:measurements)
  .where('measurements.created_at > ?', Date.today)
  .group('places.id')
  .order('AVG(measurements.co2_ppm) DESC')
  .limit(10)
```

## 🛠️ Common Rails Commands
```bash
rails c                    # Console
rails db:migrate          # Run migrations
rails db:rollback         # Undo last migration
rails g model Thing       # Generate model
rails g controller Things # Generate controller
bundle                    # Install gems
```

## 📱 React Native Common Tasks
```bash
cd co2_native_client
expo start --ios         # Run on iOS simulator
expo start --android     # Run on Android
expo build:ios          # Build IPA
expo build:android      # Build APK
npm test                # Run tests
```

## 🚨 Emergency Fixes
```bash
# Everything is broken
spring stop
rm -rf tmp/cache
bundle
rails db:migrate
rails assets:precompile

# JavaScript broken  
rm -rf node_modules
rm package-lock.json
npm install

# Database broken
rails db:drop db:create db:schema:load db:seed

# Git mistake
git reset --hard HEAD~1  # Undo last commit
git clean -fd            # Remove untracked files
```

## 📊 Key Metrics Queries
```sql
-- Daily active users
SELECT COUNT(DISTINCT user_id) 
FROM measurements 
WHERE created_at > NOW() - INTERVAL '1 day';

-- Venue coverage
SELECT COUNT(DISTINCT place_id) as venues_monitored,
       COUNT(*) as total_measurements
FROM measurements
WHERE created_at > NOW() - INTERVAL '7 days';

-- Alert effectiveness  
SELECT COUNT(*) as alerts_sent,
       SUM(CASE WHEN acknowledged THEN 1 ELSE 0 END) as alerts_acked
FROM alerts
WHERE created_at > NOW() - INTERVAL '1 day';
```

## 🎯 Business Logic Locations
| Feature | File | Method/Function |
|---------|------|----------------|
| CO2 Alerts | `app/services/alert_service.rb` | `check_thresholds` |
| User Auth | `app/controllers/application_controller.rb` | `authenticate_user!` |
| API Auth | `app/controllers/api/base_controller.rb` | `authenticate_api!` |
| Measurements | `app/models/measurement.rb` | `validations` block |
| Admin Panel | `app/admin/*.rb` | ActiveAdmin DSL |

## 💰 Revenue Code Sections
```ruby
# app/models/user.rb
enum subscription_tier: {
  free: 0,
  pro: 1,      # $5/month
  business: 2  # $50/month
}

# app/models/place.rb  
belongs_to :owner, class_name: 'User', optional: true
# Venues can be "claimed" by business users
```

## 🔗 External Services
| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| Google Places | Venue data | `GOOGLE_PLACES_API_KEY` |
| Twilio | SMS alerts | `TWILIO_*` vars |
| SendGrid | Email | `SENDGRID_API_KEY` |
| Sentry | Errors | `SENTRY_DSN` |
| S3 | File storage | `AWS_*` vars |

## 🧪 Test Commands
```bash
# Run all tests
bundle exec rspec

# Run specific test
bundle exec rspec spec/models/measurement_spec.rb

# Run with coverage
COVERAGE=true bundle exec rspec

# JavaScript tests
cd co2_native_client && npm test
cd co2_client && npm test
```

## 📝 Git Workflow
```bash
git checkout -b feature/issue-number/description
# Make changes
git add -A
git commit -m "Clear description of change"
git push -u origin feature/issue-number/description
# Open PR on GitHub
```

## ⚠️ Before Deploying
- [ ] Run tests: `bundle exec rspec`
- [ ] Check security: `bundle audit`  
- [ ] Check code quality: `rubocop`
- [ ] Test locally: `rails s`
- [ ] Check migrations: `rails db:migrate:status`
- [ ] Update changelog
- [ ] Tag version: `git tag -a v1.0.0 -m "Release 1.0.0"`

## 🎓 Learning Resources
- [Rails Guides](https://guides.rubyonrails.org)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev)
- CO2 & Ventilation: 800ppm = good, 1000ppm+ = mask up

## 💭 Remember
**"COVID is airborne. CO2 correlates with infection risk. Simple engineering could have saved 80k lives. We're building the tool that makes air quality impossible to ignore."** - The Mission

Ship fast. Save lives. 🚀