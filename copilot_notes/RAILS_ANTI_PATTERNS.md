# Rails Anti-Patterns to Avoid

*This document captures patterns that have caused issues in this codebase and should be avoided.*

## ⚠️ CRITICAL: Time.zone in Initialization Files

### THE PATTERN THAT KEEPS COMING BACK
**NEVER use `Time.zone.now` in these files:**
- `config/boot.rb`
- `config/application.rb`  
- `config/environment.rb`
- `config/environments/*.rb`

**Why:** These files run BEFORE Rails initializes. Time.zone doesn't exist yet!
**Error:** `NoMethodError: undefined method 'zone' for Time:Class`
**History:** This has been "fixed" and reverted MULTIPLE times. See: `copilot_notes/time-zone-ping-pong-analysis.md`

**ALWAYS use:** `Time.now` in initialization files
**Can use Time.zone.now:** In models, controllers, views, and any code that runs AFTER Rails boots

## Database Query Anti-Patterns

### N+1 Queries
**NEVER:**
```ruby
Post.all.each { |post| 
  puts post.comments.count  # Triggers query for EACH post
}
```

**ALWAYS:**
```ruby
Post.includes(:comments).each { |post|
  puts post.comments.size   # Uses preloaded data
}
```

### Memory-Intensive Operations
**NEVER:**
```ruby
User.all.map(&:email)  # Loads ALL users into memory at once
```

**ALWAYS:**
```ruby
User.pluck(:email)     # Returns just the emails as array
# OR for batching:
User.find_each { |user| process(user.email) }
```

## Service Object Anti-Patterns

### Silent Failures
**NEVER:**
```ruby
def perform
  update_record
  send_notification
rescue => e
  Rails.logger.error(e)  # User never knows it failed!
end
```

**ALWAYS:**
```ruby
def perform
  update_record
  send_notification
rescue => e
  Rails.logger.error(e)
  raise ServiceError, "Failed to process: #{e.message}"
end
```

## Background Job Anti-Patterns

### Unverified State Assumptions
**NEVER:**
```ruby
class ProcessDataJob < ApplicationJob
  def perform(record_id)
    record = Record.find(record_id)
    record.process!  # Assumes record exists and is processable
  end
end
```

**ALWAYS:**
```ruby
class ProcessDataJob < ApplicationJob
  def perform(record_id)
    record = Record.find_by(id: record_id)
    return unless record&.processable?
    
    record.process!
  rescue => e
    Rails.logger.error("Failed to process record #{record_id}: #{e.message}")
    raise # Re-raise for retry mechanism
  end
end
```

## Controller Anti-Patterns

### Complex Logic in Controllers
**NEVER:**
```ruby
def export
  data = []
  User.find_each do |user|
    if user.active? && user.created_at > 30.days.ago
      readings = user.co2_readings.where(...)
      # 50 more lines of complex logic
    end
  end
  send_data data.to_csv
end
```

**ALWAYS:**
```ruby
def export
  result = ExportService.new(export_params).perform
  
  if result.success?
    send_data result.csv_data, filename: result.filename
  else
    redirect_to exports_path, alert: result.error_message
  end
end
```

## Testing Anti-Patterns

### Over-Mocking External Services
**NEVER:**
```ruby
it "sends notification" do
  allow(NotificationService).to receive(:send)
  # Test passes even if NotificationService.send doesn't exist!
end
```

**ALWAYS:**
```ruby
it "sends notification" do
  expect(NotificationService).to receive(:send).with(
    user: user,
    message: "Expected message"
  ).and_return(true)
  
  subject.perform
end
```

## Migration Anti-Patterns

### Irreversible Migrations Without Down Method
**NEVER:**
```ruby
def change
  execute "ALTER TABLE users ADD CONSTRAINT ...;"
end
```

**ALWAYS:**
```ruby
def up
  execute "ALTER TABLE users ADD CONSTRAINT ...;"
end

def down
  execute "ALTER TABLE users DROP CONSTRAINT ...;"
end
```

## Configuration Anti-Patterns

### Hard-Coded Credentials
**NEVER:**
```ruby
config.api_key = "sk_live_abc123def456"
```

**ALWAYS:**
```ruby
config.api_key = Rails.application.credentials.api_key
# OR
config.api_key = ENV.fetch('API_KEY')
```

## Performance Anti-Patterns

### Synchronous External API Calls in Request Cycle
**NEVER:**
```ruby
def show
  @weather = WeatherAPI.fetch(params[:location])  # Can timeout, block request
  @co2_data = Co2Reading.find(params[:id])
end
```

**ALWAYS:**
```ruby
def show
  @co2_data = Co2Reading.find(params[:id])
  @weather = Rails.cache.fetch("weather_#{params[:location]}", expires_in: 10.minutes) do
    WeatherFetchJob.perform_later(params[:location])
    { status: "loading" }
  end
end
```

## Common Rubocop Violations to Avoid

### ABC Complexity
**AVOID:** Methods with Assignment, Branch, Condition complexity > 20
**SOLUTION:** Extract helper methods, use service objects

### Line Length
**AVOID:** Lines longer than 120 characters
**SOLUTION:** Break into multiple lines, extract complex expressions to variables

### Method Length  
**AVOID:** Methods longer than 25 lines
**SOLUTION:** Extract private methods, delegate to service objects

---

## How to Use This Document

1. **Before implementing:** Check if your approach matches any anti-pattern
2. **During code review:** Reference specific anti-patterns when suggesting changes
3. **After bugs:** Add new anti-patterns discovered through debugging

## Contributing

When adding new anti-patterns:
1. Include the error message or symptom
2. Show both NEVER and ALWAYS examples
3. Explain WHY it's an anti-pattern
4. Link to relevant issues or commits if applicable