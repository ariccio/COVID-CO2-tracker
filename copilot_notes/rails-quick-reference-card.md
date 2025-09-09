# ▪ Rails Quick Reference Card - COVID CO2 Tracker
*Instant lookup for common Rails tasks*

## ⚡ Essential Commands

### Server & Console
```bash
rails server                    # Start dev server on :3000
rails console                   # Interactive Ruby console
rails console --sandbox         # Console with rollback
rails db                       # Database console
```

### Database
```bash
rails db:migrate               # Run pending migrations
rails db:rollback             # Undo last migration
rails db:seed                 # Load seed data
rails db:reset                # Drop, create, migrate, seed
rails db:schema:load         # Load schema (faster than migrate)
```

### Generators
```bash
rails g migration AddPhoneToUsers phone:string
rails g model AlertLog user:references message:text
rails g controller api/v1/alerts
rails g job SendAlertJob
```

### Testing
```bash
bundle exec rspec              # Run all tests
bundle exec rspec spec/models  # Run model tests
rails test                     # Run minitest suite
```

## ▪ Key Models & Locations

### Core Models
| Model | File | Key Fields | Purpose |
|-------|------|------------|---------|
| Measurement | app/models/measurement.rb | co2ppm, measurementtime | CO2 readings |
| Place | app/models/place.rb | google_place_id, lat/lng | Venues |
| User | app/models/user.rb | email, sub_google_uid | Device owners |
| Device | app/models/device.rb | serial, model_id | CO2 sensors |
| SubLocation | app/models/sub_location.rb | description, place_id | Areas in venues |

### Controllers
| Controller | Path | Purpose |
|------------|------|---------|
| MeasurementController | app/controllers/api/v1/ | CO2 data API |
| PlacesController | app/controllers/api/v1/ | Venue API |
| AuthController | app/controllers/api/v1/ | JWT auth |
| UsersController | app/controllers/api/v1/ | User management |

## ◆ CO2 Thresholds (Built into Validations)

```ruby
# From app/models/measurement.rb
400-799    # ✓ Good ventilation
800-999    # • Acceptable
1000-1499  # ○ Mask recommended  
1500-1999  # ■ Poor - leave if possible
2000+      # ✗ Dangerous - leave immediately!
30,000     # ⚠ Industrial threshold warning
40,000     # ⚠ Immediately dangerous
50,000+    # ✗ Check your meter!
```

## ■ Authentication Pattern

```ruby
# In controllers
class ApiController < ApplicationController
  before_action :authorized
  
  def authorized
    render json: { message: 'Please log in' }, status: :unauthorized unless logged_in?
  end
end

# Skip auth for public endpoints
skip_before_action :authorized, only: [:show]
```

## ◆ API Response Formats

### Success
```ruby
render json: {
  data: SerializedData,
  meta: { count: 10 }
}, status: :ok
```

### Error
```ruby
render json: {
  errors: [{
    message: "Human readable",
    detail: "Technical detail"
  }]
}, status: :bad_request
```

## ▪ Database Queries

### Common ActiveRecord Patterns
```ruby
# Find or create pattern (used heavily)
place.sub_location.find_or_create_by!(description: "main room")

# Geospatial queries (via geokit)
Place.within(5, origin: [lat, lng])

# Recent measurements
user.measurement.order(measurementtime: :desc).limit(10)

# Includes to prevent N+1
Place.includes(:sub_location, :measurement)
```

## ▶ Quick Deployment

```bash
# Development
./scripts/setup-development.sh
rails server

# Production deploy
./scripts/quick-deploy.sh
git push heroku main
heroku run rails db:migrate

# Check logs
heroku logs --tail
```

## ◆ Debugging Tools

### Rails Console Helpers
```ruby
# Reload console code
reload!

# Pretty print
pp User.first

# Check routes
Rails.application.routes.url_helpers

# View SQL
ActiveRecord::Base.logger = Logger.new(STDOUT)

# Last created record
Measurement.last

# Validation errors
m = Measurement.new
m.valid?  # => false
m.errors.full_messages
```

### Finding Things
```ruby
# By ID
User.find(123)

# By attribute  
User.find_by(email: "test@example.com")

# Multiple
Measurement.where(co2ppm: 1000..2000)

# Associated
user.devices.count
place.measurement.average(:co2ppm)
```

## ⚡ Service Object Pattern

```ruby
# app/services/alert_service.rb pattern
class AlertService
  def self.call(measurement)
    new(measurement).call
  end
  
  def initialize(measurement)
    @measurement = measurement
  end
  
  def call
    # Service logic here
  end
end

# Usage
AlertService.call(measurement)
```

## ▪ Gem Helpers

### Key Gems in Use
```ruby
# JSON serialization
gem 'jsonapi-serializer'

# CORS handling  
gem 'rack-cors'

# Admin panel
gem 'activeadmin'

# Auth
gem 'devise'  # For admin
gem 'bcrypt'  # For JWT

# Error tracking
gem 'sentry-ruby'

# Geospatial
gem 'geokit-rails'

# Time validation
gem 'validates_timeliness'
```

## ● ActiveAdmin Customization

```ruby
# app/admin/measurements.rb
ActiveAdmin.register Measurement do
  permit_params :co2ppm, :device_id
  
  filter :co2ppm
  filter :created_at
  
  index do
    selectable_column
    id_column
    column :co2ppm
    column :measurementtime
    column :device
    actions
  end
end
```

## ⚡ Performance Tips

```ruby
# Use select for specific columns
User.select(:id, :email)

# Batch processing
User.find_each(batch_size: 100) do |user|
  # Process user
end

# Counter cache
# belongs_to :place, counter_cache: true

# Indexes (in migration)
add_index :measurements, :measurementtime
add_index :places, [:place_lat, :place_lng]
```

## ⚠ Emergency Fixes

### Server Won't Start
```bash
bundle install
rails db:migrate
rails assets:precompile  # If needed
```

### Database Issues
```bash
rails db:drop
rails db:create  
rails db:schema:load
rails db:seed
```

### Clear Cache
```ruby
Rails.cache.clear
```

### Reset Credentials
```bash
EDITOR="nano" rails credentials:edit
```

## ※ File Creation Templates

### New Service
```ruby
# app/services/venue_analyzer.rb
class VenueAnalyzer
  attr_reader :place
  
  def initialize(place)
    @place = place
  end
  
  def average_co2
    place.measurement.average(:co2ppm)
  end
end
```

### New API Endpoint
```ruby
# app/controllers/api/v1/stats_controller.rb
module Api
  module V1
    class StatsController < ApiController
      def show
        render json: { stats: "data" }
      end
    end
  end
end
```

### New Migration
```ruby
class AddIndexToMeasurements < ActiveRecord::Migration[7.1]
  def change
    add_index :measurements, [:device_id, :measurementtime]
  end
end
```

---

*Keep this card handy for quick Rails development reference*