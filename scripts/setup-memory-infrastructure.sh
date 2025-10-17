#!/bin/bash
# COVID CO2 Tracker - Memory Infrastructure Setup Script
# This script initializes the AI memory and context management system
# Based on patterns from DeeDee-Prototype, adapted for CO2 monitoring

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source tty-colors library for TTY-aware output
source "${SCRIPT_DIR}/lib/tty-colors.sh"

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="Memory Infrastructure Setup"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Function: Print colored output
print_status() {
    echo -e "${BLUE}[${SCRIPT_NAME}]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function: Create directory structure
create_directory_structure() {
    print_status "Creating memory infrastructure directories..."
    
    # Core directories
    directories=(
        "copilot_notes/continuation-templates"
        "copilot_notes/memory"
        "copilot_notes/guides/quick"
        "copilot_notes/guides/focused"
        "copilot_notes/guides/comprehensive"
        "copilot_notes/problem-solutions"
        "copilot_notes/public-health"
        "copilot_notes/domain-knowledge"
        ".claude"
    )
    
    for dir in "${directories[@]}"; do
        if mkdir -p "$dir"; then
            print_success "Created: $dir"
        else
            print_warning "Directory already exists: $dir"
        fi
    done
}

# Function: Create initial index files
create_index_files() {
    print_status "Creating semantic index files..."
    
    # Create main README for copilot_notes
    cat > copilot_notes/README.md << 'EOF'
# COVID CO2 Tracker - AI Memory System

## 🎯 Start Here
1. **First**: Always check `INDEX-SEMANTIC-CO2.md` for task pattern matching
2. **Second**: Load only matched files based on task complexity
3. **Third**: Respect context budget (<20k tokens for most tasks)

## 📂 Directory Structure
- `continuation-templates/` - Templates for multi-session work
- `memory/` - Preserved context from previous sessions
- `guides/` - Tiered documentation (quick/focused/comprehensive)
- `problem-solutions/` - Debugging patterns and solutions
- `public-health/` - Domain knowledge about CO2 and infection
- `domain-knowledge/` - Scientific references and research

## 🔍 File Naming Convention
Pattern: `YYYY-MM-DD-component-issue-resolution.md`
Example: `2025-08-25-rails-api-n-plus-one-optimization.md`

## 💡 Contributing
When discovering new patterns:
1. Create descriptively-named file
2. Update INDEX-SEMANTIC-CO2.md
3. Add word count for context budgeting
EOF
    print_success "Created README.md"
    
    # Create problem-solution map template
    cat > copilot_notes/PROBLEM_SOLUTION_MAP_CO2.md << 'EOF'
# Problem → Solution Mapping for COVID CO2 Tracker

## Common Issues and Solutions

### Measurement Issues
```yaml
"Measurements not saving":
  symptoms: Form submits but no data in database
  check: 
    - Database connection
    - Redis queue status
    - Validation errors in logs
  solution: Check app/models/measurement.rb validations
  reference: measurement-persistence-debugging.md

"CO2 readings seem wrong":
  symptoms: Impossible values (>10000ppm, negative)
  check:
    - Sensor calibration
    - Unit conversion
    - Data type casting
  solution: Validate at model level, add bounds checking
```

### Alert Delivery
```yaml
"SMS alerts not sending":
  symptoms: Measurements exceed threshold but no notifications
  check:
    - Twilio credentials in ENV
    - Phone number format
    - Rate limiting
  solution: app/services/alert_service.rb debugging
  reference: alert-delivery-debugging.md

"Alert fatigue complaints":
  symptoms: Users disabling notifications
  check:
    - Threshold settings
    - Frequency of alerts
    - Time-based suppression
  solution: Implement cooldown period between alerts
```

### Mobile App Issues
```yaml
"Bluetooth won't connect":
  symptoms: Can't find or connect to CO2 sensor
  check:
    - iOS/Android permissions
    - Bluetooth enabled
    - Device compatibility
  solution: co2_native_client/src/features/bluetooth/
  reference: bluetooth-troubleshooting-guide.md

"App crashes on launch":
  symptoms: Immediate crash, white screen
  check:
    - expo start --clear
    - Native dependencies
    - AsyncStorage corruption
  solution: Clear cache and reinstall
  debug_command: expo start --ios --clear
```

### Deployment Problems
```yaml
"Deploy fails on Heroku":
  symptoms: Build succeeds locally but fails on Heroku
  check:
    - Buildpack versions
    - ENV variables set
    - Database migrations
  solution: heroku logs --tail
  reference: deployment-troubleshooting.md
```

## Quick Debug Commands
```bash
# Rails/Backend
rails console                    # Interactive debugging
tail -f log/development.log     # Watch logs
bundle exec rspec --fail-fast   # Quick test run

# Mobile
expo doctor                      # Check environment
expo start --clear              # Clear cache
adb logcat | grep -i erro      # Android logs

# Production
heroku logs --tail              # Live logs
heroku run rails console        # Production console
heroku pg:psql                  # Database access
```
EOF
    print_success "Created PROBLEM_SOLUTION_MAP_CO2.md"
}

# Function: Create initial guide files
create_starter_guides() {
    print_status "Creating starter guide files..."
    
    # Quick guide: SMS alerts in 1 hour
    cat > copilot_notes/guides/quick/alert-implementation-1-hour.md << 'EOF'
# SMS Alerts in 1 Hour - Quick Implementation Guide

## Prerequisites (5 minutes)
1. Twilio account (free trial works)
2. Get credentials from Twilio console
3. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=xxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## Step 1: Add Twilio Gem (5 minutes)
```ruby
# Gemfile
gem 'twilio-ruby', '~> 5.74.0'
```
Run: `bundle install`

## Step 2: Create Alert Service (20 minutes)
```ruby
# app/services/alert_service.rb
class AlertService
  def self.check_and_alert(measurement)
    return unless measurement.co2_ppm > 1000
    return if recently_alerted?(measurement.place_id)
    
    send_sms_alert(measurement)
    mark_as_alerted(measurement.place_id)
  end
  
  private
  
  def self.send_sms_alert(measurement)
    client = Twilio::REST::Client.new(
      ENV['TWILIO_ACCOUNT_SID'],
      ENV['TWILIO_AUTH_TOKEN']
    )
    
    message = "⚠️ HIGH CO2 ALERT: #{measurement.place.name} is at #{measurement.co2_ppm}ppm! Consider leaving or opening windows."
    
    measurement.place.subscribers.each do |subscriber|
      client.messages.create(
        from: ENV['TWILIO_PHONE_NUMBER'],
        to: subscriber.phone,
        body: message
      )
    end
  rescue => e
    Rails.logger.error "SMS failed: #{e.message}"
  end
  
  def self.recently_alerted?(place_id)
    Rails.cache.read("alert_sent_#{place_id}").present?
  end
  
  def self.mark_as_alerted(place_id)
    Rails.cache.write("alert_sent_#{place_id}", true, expires_in: 30.minutes)
  end
end
```

## Step 3: Hook Into Measurement Creation (10 minutes)
```ruby
# app/models/measurement.rb
after_create :check_for_alerts

private

def check_for_alerts
  AlertService.check_and_alert(self)
end
```

## Step 4: Test It (10 minutes)
```ruby
# rails console
m = Measurement.create!(
  place: Place.first,
  co2_ppm: 1500,
  user: User.first
)
# Should trigger SMS if configured correctly
```

## Step 5: Add Subscriber Model (10 minutes)
```bash
rails g model AlertSubscriber place:references phone:string active:boolean
rails db:migrate
```

## Total Time: ~60 minutes
Impact: 🔥🔥🔥🔥🔥 (Saves lives)
EOF
    print_success "Created alert-implementation-1-hour.md"
    
    # Create venue leaderboard guide
    cat > copilot_notes/guides/quick/venue-leaderboard-2-hours.md << 'EOF'
# Public Venue Leaderboard - 2 Hour Implementation

## The Goal
Create a public page showing which venues have the best/worst air quality.
This creates social pressure for improvement.

## Quick Implementation

### Step 1: Create Controller (20 minutes)
```ruby
# app/controllers/leaderboard_controller.rb
class LeaderboardController < ApplicationController
  def index
    @best_venues = Place.joins(:measurements)
      .where('measurements.created_at > ?', 24.hours.ago)
      .group('places.id')
      .having('AVG(measurements.co2_ppm) < ?', 800)
      .order('AVG(measurements.co2_ppm) ASC')
      .limit(10)
      .select('places.*, AVG(measurements.co2_ppm) as avg_co2')
    
    @worst_venues = Place.joins(:measurements)
      .where('measurements.created_at > ?', 24.hours.ago)
      .group('places.id')
      .having('AVG(measurements.co2_ppm) > ?', 1000)
      .order('AVG(measurements.co2_ppm) DESC')
      .limit(10)
      .select('places.*, AVG(measurements.co2_ppm) as avg_co2')
  end
end
```

### Step 2: Create View (30 minutes)
```erb
<!-- app/views/leaderboard/index.html.erb -->
<div class="leaderboard">
  <h1>🏆 Venue Air Quality Leaderboard</h1>
  
  <div class="best-venues">
    <h2>✅ Safest Venues (Last 24 Hours)</h2>
    <% @best_venues.each_with_index do |venue, index| %>
      <div class="venue-card safe">
        <span class="rank">#<%= index + 1 %></span>
        <h3><%= venue.name %></h3>
        <p class="co2">Avg: <%= venue.avg_co2.round %>ppm</p>
      </div>
    <% end %>
  </div>
  
  <div class="worst-venues">
    <h2>⚠️ Venues Needing Improvement</h2>
    <% @worst_venues.each_with_index do |venue, index| %>
      <div class="venue-card danger">
        <span class="rank">#<%= index + 1 %></span>
        <h3><%= venue.name %></h3>
        <p class="co2">Avg: <%= venue.avg_co2.round %>ppm</p>
      </div>
    <% end %>
  </div>
</div>
```

### Step 3: Add Route (5 minutes)
```ruby
# config/routes.rb
get 'leaderboard', to: 'leaderboard#index'
root 'leaderboard#index' # Make it the homepage!
```

### Step 4: Cache for Performance (15 minutes)
```ruby
# app/controllers/leaderboard_controller.rb
def index
  @best_venues = Rails.cache.fetch("best_venues", expires_in: 5.minutes) do
    # ... query ...
  end
  
  @worst_venues = Rails.cache.fetch("worst_venues", expires_in: 5.minutes) do
    # ... query ...
  end
end
```

### Step 5: Make It Shareable (20 minutes)
Add social meta tags for sharing

### Step 6: Deploy (30 minutes)
Push to production and share everywhere!

## Impact
- Venues will improve to get off the "worst" list
- Good venues get free marketing
- Public health win!
EOF
    print_success "Created venue-leaderboard-2-hours.md"
}

# Function: Create automation helper scripts
create_helper_scripts() {
    print_status "Creating helper scripts..."
    
    # Create quick deploy script
    cat > scripts/quick-deploy.sh << 'EOF'
#!/bin/bash
# Quick deployment script for COVID CO2 Tracker

set -e

echo "🚀 Starting quick deployment..."

# Run tests
echo "Running tests..."
bundle exec rspec --fail-fast || {
    echo "❌ Tests failed! Fix before deploying."
    exit 1
}

# Check for security issues
echo "Checking security..."
bundle audit check || echo "⚠️  Security warnings found"

# Deploy
echo "Deploying to production..."
git push heroku main

# Run migrations
echo "Running migrations..."
heroku run rails db:migrate

# Verify deployment
echo "Verifying deployment..."
curl -s https://your-app.herokuapp.com/api/v1/health || echo "⚠️  Health check failed"

echo "✅ Deployment complete!"
EOF
    chmod +x scripts/quick-deploy.sh
    print_success "Created quick-deploy.sh"
    
    # Create development setup script
    cat > scripts/setup-development.sh << 'EOF'
#!/bin/bash
# Development environment setup for COVID CO2 Tracker

set -e

echo "🔧 Setting up development environment..."

# Ruby dependencies
bundle install

# JavaScript dependencies
npm install
cd co2_native_client && npm install && cd ..
cd co2_client && npm install && cd ..

# Database setup
rails db:create db:migrate db:seed

# Create .env file if missing
if [ ! -f .env ]; then
    cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://localhost/co2_tracker_development
REDIS_URL=redis://localhost:6379
RAILS_ENV=development
ENVFILE
    echo "✅ Created .env file"
fi

echo "✅ Development environment ready!"
echo "Run 'rails s' to start the API"
echo "Run 'cd co2_native_client && npm start' for mobile"
EOF
    chmod +x scripts/setup-development.sh
    print_success "Created setup-development.sh"
}

# Function: Update CLAUDE.md
update_claude_md() {
    print_status "Updating CLAUDE.md with new patterns..."
    
    # Append new instructions to CLAUDE.md
    cat >> CLAUDE.md << 'EOF'

## 🧠 Memory Infrastructure Active
The COVID CO2 Tracker now uses an advanced memory and context management system.

### Quick Start for AI Agents
1. **ALWAYS** check `copilot_notes/INDEX-SEMANTIC-CO2.md` first
2. Load files based on task pattern matching
3. Respect context budgets (see index for guidelines)
4. Create continuation prompts if approaching limits

### Key Infrastructure Files
- `INDEX-SEMANTIC-CO2.md` - Task pattern matcher (START HERE)
- `PROBLEM_SOLUTION_MAP_CO2.md` - Debugging patterns
- `guides/quick/` - 1-hour implementation guides
- `continuation-templates/` - Multi-session work patterns

### Context Budget Management
- Simple tasks: <3,000 tokens
- Medium tasks: <10,000 tokens  
- Complex tasks: <25,000 tokens
- Architecture: No limit (use continuation prompts)

### When You Discover New Patterns
1. Create descriptive filename in copilot_notes/
2. Update INDEX-SEMANTIC-CO2.md with word count
3. Consider creating a script if repeatable
EOF
    print_success "Updated CLAUDE.md"
}

# Function: Create initial Claude settings
create_claude_settings() {
    print_status "Creating Claude settings..."
    
    cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "WebFetch(domain:docs.anthropic.com)",
      "Bash(bundle:*)",
      "Bash(rails:*)",
      "Bash(npm:*)",
      "Bash(./scripts/*:*)",
      "Bash(heroku:*)",
      "Bash(git:*)",
      "Bash(expo:*)",
      "Bash(rspec:*)",
      "mcp__ide__getDiagnostics",
      "mcp__ide__executeCode"
    ],
    "deny": []
  }
}
EOF
    print_success "Created Claude settings"
}

# Function: Create summary report
create_summary() {
    print_status "Creating setup summary..."
    
    cat > copilot_notes/memory-infrastructure-setup-summary.md << EOF
# Memory Infrastructure Setup Complete
Generated: $TIMESTAMP

## ✅ Created Structure
- Directory structure for tiered guides
- Semantic index (INDEX-SEMANTIC-CO2.md)
- Problem → Solution mapping
- Quick implementation guides
- Helper scripts for automation
- Claude configuration

## 📚 Key Files Created
1. copilot_notes/INDEX-SEMANTIC-CO2.md - Task pattern matching
2. copilot_notes/PROBLEM_SOLUTION_MAP_CO2.md - Debugging guide
3. copilot_notes/guides/quick/alert-implementation-1-hour.md
4. copilot_notes/guides/quick/venue-leaderboard-2-hours.md
5. scripts/quick-deploy.sh
6. scripts/setup-development.sh

## 🚀 Next Steps
1. Review INDEX-SEMANTIC-CO2.md for task patterns
2. Implement high-priority features from FEATURE-PRIORITY-MATRIX.md
3. Create more guides as patterns emerge
4. Use continuation templates for complex tasks

## 💡 Tips for AI Agents
- Always start with the semantic index
- Create descriptive filenames for future discovery
- Update indices when finding new patterns
- Use scripts to avoid repetitive commands

Remember: Every optimization here has HIGH ROI on future development speed!
EOF
    print_success "Created setup summary"
}

# Main execution
main() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}     COVID CO2 Tracker - Memory Infrastructure Setup       ${NC}"
    echo -e "${BLUE}     Version: ${SCRIPT_VERSION}                            ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo
    
    create_directory_structure
    create_index_files
    create_starter_guides
    create_helper_scripts
    update_claude_md
    create_claude_settings
    create_summary
    
    echo
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Memory Infrastructure Setup Complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo
    print_status "Next steps:"
    echo "  1. Review copilot_notes/INDEX-SEMANTIC-CO2.md"
    echo "  2. Check copilot_notes/memory-infrastructure-setup-summary.md"
    echo "  3. Start using pattern matching for context loading"
    echo "  4. Create new guides as you discover patterns"
    echo
    print_status "Quick test: Try 'I need to add SMS alerts' and watch the pattern matching work!"
}

# Run main function
main "$@"