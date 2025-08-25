# Technical Upgrade Guide - Solving the Hard Problems

## 🔧 Rails 7.x Upgrade Path (From Rails 6.x)

### Pre-Flight Checklist
```bash
# 1. Check current Rails version
rails --version

# 2. Run deprecation warnings
RAILS_ENV=test rails app:update:deprecations

# 3. Update test suite first
bundle exec rspec
```

### Step-by-Step Rails Upgrade
```ruby
# Gemfile - Incremental approach
# Step 1: Update to latest 6.x first
gem 'rails', '~> 6.1.7'
bundle update rails

# Step 2: Fix all deprecation warnings
grep -r "DEPRECATION WARNING" log/

# Step 3: Update to Rails 7
gem 'rails', '~> 7.0.0'
bundle update rails

# Step 4: Run update task
rails app:update
# Choose 'd' to diff each file
# Be careful with:
# - config/application.rb (preserve custom settings)
# - config/environments/*.rb (keep your configs)
# - config/initializers/* (review each carefully)
```

### Common Rails 7 Breaking Changes & Fixes
```ruby
# 1. Button_to now defaults to POST (was GET)
# Before: <%= button_to "Delete", item_path(item), method: :delete %>
# After: <%= button_to "Delete", item_path(item), method: :delete, form: { data: { turbo_confirm: "Sure?" } } %>

# 2. ActiveRecord encryption
# config/application.rb
config.active_record.encryption.primary_key = ENV['ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY']
config.active_record.encryption.deterministic_key = ENV['ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY']
config.active_record.encryption.key_derivation_salt = ENV['ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT']

# 3. Zeitwerk autoloader issues
# Fix: Rename files to match class names exactly
# WrongFileName.rb -> wrong_file_name.rb
```

## 📱 React Native / Expo Upgrade Strategy

### Current State Analysis
```bash
cd co2_native_client
expo doctor
npm outdated
```

### Expo SDK Upgrade Path
```javascript
// package.json - Gradual upgrade
// Step 1: Update Expo CLI globally
npm install -g expo-cli@latest

// Step 2: Upgrade incrementally (never skip major versions)
expo upgrade 47  // If on 46
expo upgrade 48  // Then to 48
expo upgrade 49  // Then to 49
expo upgrade 50  // Finally to latest

// Step 3: Fix breaking changes per SDK
// SDK 47->48: AsyncStorage moved
npm uninstall @react-native-community/async-storage
npm install @react-native-async-storage/async-storage

// SDK 49->50: Navigation changes
// Check react-navigation upgrade guide
```

### React Native Paper to Native Base Migration
```javascript
// If considering UI library change
// Old (React Native Paper):
import { Button } from 'react-native-paper';
<Button mode="contained" onPress={handlePress}>
  Click me
</Button>

// New (Native Base):
import { Button } from 'native-base';
<Button onPress={handlePress} colorScheme="primary">
  Click me
</Button>

// Migration script for bulk updates:
// utils/migrate-ui.js
const replacements = [
  [/import.*react-native-paper/g, "import { Button, Box, Text } from 'native-base'"],
  [/<Button mode="contained"/g, '<Button colorScheme="primary"'],
  // Add more patterns
];
```

## 🗄️ Database Performance Optimization

### Critical Indexes for Scale
```ruby
# db/migrate/add_performance_indexes.rb
class AddPerformanceIndexes < ActiveRecord::Migration[7.0]
  def change
    # Composite index for most common query
    add_index :measurements, [:place_id, :created_at], 
              name: 'idx_measurements_place_time'
    
    # Partial index for active records only
    add_index :measurements, :co2_ppm, 
              where: "deleted_at IS NULL",
              name: 'idx_measurements_co2_active'
    
    # GIN index for full-text search
    enable_extension 'pg_trgm'
    add_index :places, :name, using: :gin, opclass: :gin_trgm_ops
    
    # BRIN index for time-series data
    add_index :measurements, :created_at, using: :brin
  end
end
```

### Query Optimization Patterns
```ruby
# app/models/measurement.rb
class Measurement < ApplicationRecord
  # Bad: N+1 query
  # places.each { |p| p.measurements.average(:co2_ppm) }
  
  # Good: Single query with includes
  scope :with_average_co2, -> {
    select('places.*, AVG(measurements.co2_ppm) as avg_co2')
    .joins(:measurements)
    .group('places.id')
  }
  
  # Better: Materialized view for real-time stats
  # CREATE MATERIALIZED VIEW place_stats AS
  # SELECT place_id, 
  #        AVG(co2_ppm) as avg_co2,
  #        COUNT(*) as measurement_count,
  #        MAX(created_at) as last_measurement
  # FROM measurements
  # GROUP BY place_id;
  
  # Best: Redis caching for hot data
  def self.current_co2_for(place_id)
    Rails.cache.fetch("place_#{place_id}_current_co2", expires_in: 1.minute) do
      where(place_id: place_id)
        .where('created_at > ?', 5.minutes.ago)
        .average(:co2_ppm) || 0
    end
  end
end
```

## 🚀 Zero-Downtime Deployment Setup

### Heroku to Modern Platform Migration
```yaml
# render.yaml - Modern alternative to Heroku
services:
  - type: web
    name: co2-tracker
    env: ruby
    buildCommand: bundle install; bundle exec rake assets:precompile
    startCommand: bundle exec puma -C config/puma.rb
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: co2-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: co2-redis
          type: redis
          property: connectionString

databases:
  - name: co2-db
    databaseName: co2_production
    user: co2_app
    plan: starter

services:
  - type: redis
    name: co2-redis
    plan: starter
```

### GitHub Actions CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test
          RAILS_ENV: test
        run: |
          bundle exec rails db:create
          bundle exec rails db:schema:load
          bundle exec rspec
      
      - name: Run security checks
        run: |
          bundle exec brakeman -q -w2
          bundle audit check --update

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
            -H "Authorization: Bearer ${RENDER_API_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": false}'
```

## 🔒 Security Hardening Checklist

### Immediate Security Fixes
```ruby
# config/application.rb
class Application < Rails::Application
  # Force SSL in production
  config.force_ssl = true if Rails.env.production?
  
  # Content Security Policy
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src    :self, :https, :data
    policy.img_src     :self, :https, :data
    policy.object_src  :none
    policy.script_src  :self, :https
    policy.style_src   :self, :https, :unsafe_inline
  end
  
  # Rate limiting
  config.middleware.use Rack::Attack
end

# config/initializers/rack_attack.rb
Rack::Attack.throttle('api/ip', limit: 100, period: 1.minute) do |req|
  req.ip if req.path.start_with?('/api')
end
```

### API Security
```ruby
# app/controllers/api/base_controller.rb
class Api::BaseController < ApplicationController
  before_action :authenticate_api_user!
  before_action :check_rate_limit
  
  private
  
  def authenticate_api_user!
    token = request.headers['Authorization']&.split(' ')&.last
    @current_user = User.find_by_api_token(token)
    
    render json: { error: 'Unauthorized' }, status: 401 unless @current_user
  end
  
  def check_rate_limit
    key = "rate_limit:#{@current_user.id}:#{Time.current.to_i / 60}"
    count = Rails.cache.increment(key, 1, expires_in: 1.minute)
    
    if count > 100
      render json: { error: 'Rate limit exceeded' }, status: 429
    end
  end
end
```

## 📊 Monitoring & Observability Setup

### Essential Monitoring Stack
```ruby
# Gemfile
group :production do
  gem 'sentry-ruby'
  gem 'sentry-rails'
  gem 'newrelic_rpm'
  gem 'skylight'
end

# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.1
  config.profiles_sample_rate = 0.1
end

# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  before_action :set_sentry_context
  
  private
  
  def set_sentry_context
    Sentry.set_user(id: current_user&.id)
    Sentry.set_context('request', {
      url: request.url,
      user_agent: request.user_agent
    })
  end
end
```

## 🏎️ Performance Optimization Recipes

### Frontend Bundle Size Reduction
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    },
    usedExports: true,
    sideEffects: false
  }
};

// Use dynamic imports for code splitting
// Before: import HeavyComponent from './HeavyComponent';
// After: const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Backend Response Caching
```ruby
# app/controllers/api/measurements_controller.rb
class Api::MeasurementsController < Api::BaseController
  def index
    @measurements = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      Measurement.includes(:place, :user)
                 .where(place_id: params[:place_id])
                 .order(created_at: :desc)
                 .limit(100)
                 .as_json(include: [:place, :user])
    end
    
    render json: @measurements
  end
  
  private
  
  def cache_key
    "measurements/#{params[:place_id]}/#{Measurement.maximum(:updated_at)}"
  end
end
```

## 🆘 Troubleshooting Common Issues

### Issue: "Can't find generator 'X'"
```bash
# Solution: Spring is caching old gems
spring stop
bundle exec spring binstub --all
```

### Issue: "PG::ConnectionBad"
```bash
# Solution: PostgreSQL not running
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### Issue: "ExecJS::ProgramError"
```bash
# Solution: Missing JS runtime
# Option 1: Install Node.js
brew install node

# Option 2: Add mini_racer to Gemfile
gem 'mini_racer', platforms: :ruby
```

### Issue: "Expo SDK version mismatch"
```bash
# Solution: Clear all caches
cd co2_native_client
rm -rf node_modules
npm cache clean --force
watchman watch-del-all
expo start -c
```

Remember: Most "impossible" bugs are just missing dependencies or version mismatches. When in doubt, nuke node_modules and try again.