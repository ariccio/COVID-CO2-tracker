# 🚨 SMS Alert Implementation Guide - 1 Hour
*Based on Rails architecture analysis - Ready for copy-paste implementation*

## Prerequisites Check (2 min)
```bash
# Verify you're in the project root
pwd  # Should show /Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker

# Check Rails console works
rails console
exit
```

## Step 1: Add Twilio Gem (3 min)

```bash
# Add Twilio to Gemfile
bundle add twilio-ruby

# Verify it was added
grep twilio Gemfile
```

## Step 2: Create Database Migration (5 min)

```bash
# Generate migration for user phone numbers and alert preferences
rails generate migration AddAlertFieldsToUsers phone_number:string alert_enabled:boolean alert_threshold:integer
```

Edit the generated migration:
```ruby
# db/migrate/[timestamp]_add_alert_fields_to_users.rb
class AddAlertFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :phone_number, :string
    add_column :users, :alert_enabled, :boolean, default: false
    add_column :users, :alert_threshold, :integer, default: 1000
    
    add_index :users, :phone_number
    add_index :users, :alert_enabled
  end
end
```

Run migration:
```bash
rails db:migrate
```

## Step 3: Update User Model (3 min)

```ruby
# app/models/user.rb
# Add after existing validations (around line 10)

  # Alert preferences
  validates :phone_number, format: { 
    with: /\A\+?[1-9]\d{1,14}\z/, 
    message: "must be a valid phone number"
  }, allow_blank: true
  
  validates :alert_threshold, 
    numericality: { 
      greater_than_or_equal_to: 400, 
      less_than_or_equal_to: 10000 
    }, 
    allow_nil: true

  def should_alert_for_co2?(co2_level)
    alert_enabled? && 
    phone_number.present? && 
    co2_level >= (alert_threshold || 1000)
  end
```

## Step 4: Create Alert Service (10 min)

```bash
# Create services directory
mkdir -p app/services
```

```ruby
# app/services/alert_service.rb
class AlertService
  def self.check_and_send(measurement)
    new(measurement).check_and_send
  end
  
  def initialize(measurement)
    @measurement = measurement
    @device = measurement.device
    @user = @device.user
    @place = measurement.sub_location.place
  end
  
  def check_and_send
    return unless should_send_alert?
    
    send_sms_alert
    log_alert
  rescue StandardError => e
    Rails.logger.error "Alert failed: #{e.message}"
    Sentry.capture_exception(e) if defined?(Sentry)
  end
  
  private
  
  def should_send_alert?
    @user.should_alert_for_co2?(@measurement.co2ppm) && 
    !recently_alerted?
  end
  
  def recently_alerted?
    # Prevent alert spam - one per venue per hour
    key = "alert:#{@user.id}:#{@place.id}"
    
    if Rails.cache.exist?(key)
      true
    else
      Rails.cache.write(key, true, expires_in: 1.hour)
      false
    end
  end
  
  def send_sms_alert
    SmsService.send_alert(
      to: @user.phone_number,
      co2_level: @measurement.co2ppm,
      venue_name: venue_name,
      location: @measurement.sub_location.description
    )
  end
  
  def venue_name
    # TODO: Fetch from Google Places API
    @place.google_place_id
  end
  
  def log_alert
    Rails.logger.info "SMS Alert sent to user #{@user.id} for CO2: #{@measurement.co2ppm}ppm at #{@place.google_place_id}"
  end
end
```

## Step 5: Create SMS Service (8 min)

```ruby
# app/services/sms_service.rb
class SmsService
  DANGER_EMOJI = {
    1000..1499 => "⚠️",
    1500..1999 => "🚨", 
    2000..Float::INFINITY => "☠️"
  }
  
  def self.send_alert(to:, co2_level:, venue_name:, location:)
    new.send_alert(to: to, co2_level: co2_level, venue_name: venue_name, location: location)
  end
  
  def send_alert(to:, co2_level:, venue_name:, location:)
    client.messages.create(
      from: twilio_phone,
      to: to,
      body: build_message(co2_level, venue_name, location)
    )
  end
  
  private
  
  def client
    @client ||= Twilio::REST::Client.new(
      Rails.application.credentials.dig(:twilio, :account_sid),
      Rails.application.credentials.dig(:twilio, :auth_token)
    )
  end
  
  def twilio_phone
    Rails.application.credentials.dig(:twilio, :phone_number) || '+15551234567'
  end
  
  def build_message(co2_level, venue_name, location)
    emoji = DANGER_EMOJI.find { |range, _| range.include?(co2_level) }&.last || "📊"
    
    <<~MSG.strip
      #{emoji} CO2 ALERT: #{co2_level}ppm
      📍 #{venue_name} - #{location}
      
      #{risk_message(co2_level)}
      
      Reply STOP to disable alerts
    MSG
  end
  
  def risk_message(co2_level)
    case co2_level
    when 0..799
      "Good ventilation"
    when 800..999
      "Consider opening windows"
    when 1000..1499
      "😷 Consider wearing a mask"
    when 1500..1999
      "⚠️ Poor ventilation - leave if possible"
    else
      "☠️ DANGEROUS - Leave immediately!"
    end
  end
end
```

## Step 6: Hook Into Measurement Creation (5 min)

```ruby
# app/models/measurement.rb
# Add after validations (around line 25)

  # Callbacks
  after_create :check_for_alerts
  
  private
  
  def check_for_alerts
    AlertService.check_and_send(self)
  end
```

## Step 7: Add API Endpoints for Alert Preferences (10 min)

```ruby
# config/routes.rb
# Add inside namespace :api, :v1 block (after line 15)

      # Alert preferences
      get '/alert_preferences', to: 'alert_preferences#show'
      put '/alert_preferences', to: 'alert_preferences#update'
```

```ruby
# app/controllers/api/v1/alert_preferences_controller.rb
module Api
  module V1
    class AlertPreferencesController < ApiController
      def show
        render json: {
          alert_enabled: @user.alert_enabled,
          alert_threshold: @user.alert_threshold,
          phone_number: @user.phone_number&.gsub(/\d(?=\d{4})/, '*')
        }
      end
      
      def update
        if @user.update(alert_params)
          render json: { 
            message: 'Alert preferences updated',
            alert_enabled: @user.alert_enabled
          }
        else
          render json: { 
            errors: @user.errors.full_messages 
          }, status: :unprocessable_entity
        end
      end
      
      private
      
      def alert_params
        params.require(:alert_preferences).permit(
          :phone_number, 
          :alert_enabled, 
          :alert_threshold
        )
      end
    end
  end
end
```

## Step 8: Add Twilio Credentials (5 min)

```bash
# Edit Rails credentials
EDITOR="nano" rails credentials:edit
```

Add this structure:
```yaml
twilio:
  account_sid: "YOUR_TWILIO_ACCOUNT_SID"
  auth_token: "YOUR_TWILIO_AUTH_TOKEN"  
  phone_number: "+1234567890"  # Your Twilio phone number
```

Save and exit (Ctrl+X, Y, Enter)

## Step 9: Test in Console (5 min)

```ruby
# rails console

# Create test user with phone
user = User.first || User.create!(email: "test@example.com")
user.update!(
  phone_number: "+1234567890",  # Your real phone for testing
  alert_enabled: true,
  alert_threshold: 1000
)

# Find a device
device = user.devices.first || Device.create!(
  user: user,
  serial: "TEST123",
  model: Model.first
)

# Find a place/sub_location
place = Place.first
sub_location = place.sub_location.first

# Create high CO2 measurement (will trigger alert!)
measurement = Measurement.create!(
  device: device,
  co2ppm: 1500,  # High CO2!
  measurementtime: Time.current,
  sub_location: sub_location,
  crowding: 3
)

# Check if alert would send
user.should_alert_for_co2?(1500)  # => true
```

## Step 10: Add to Admin Panel (2 min)

```ruby
# app/admin/users.rb
# Add to the existing form block (around line 15)

    input :phone_number, hint: "Format: +1234567890"
    input :alert_enabled
    input :alert_threshold, hint: "CO2 level in ppm (400-10000)"
```

## ✅ Verification Checklist

```bash
# 1. Check migration worked
rails console
User.column_names.include?("phone_number")  # => true
exit

# 2. Check services exist
ls app/services/
# Should show: alert_service.rb sms_service.rb

# 3. Test without real SMS (dry run)
rails console
AlertService.new(Measurement.last).send(:should_send_alert?)
exit

# 4. Check routes
rails routes | grep alert_preferences
```

## 🎯 Testing the Full Flow

1. **Setup test user** in Rails console:
```ruby
u = User.find_by(email: "your-email@example.com")
u.update!(phone_number: "+15551234567", alert_enabled: true, alert_threshold: 1000)
```

2. **Create measurement via API**:
```bash
curl -X POST http://localhost:3000/api/v1/measurement \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "measurement": {
      "device_id": 1,
      "co2ppm": 1500,
      "google_place_id": "ChIJ...",
      "crowding": 3,
      "sub_location_id": 1
    }
  }'
```

3. **Check alert preferences via API**:
```bash
curl http://localhost:3000/api/v1/alert_preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deploy Considerations

### Environment Variables Needed
```bash
# .env.production
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxxx  
TWILIO_PHONE_NUMBER=+15551234567
```

### Cache Configuration
- Ensure Redis or Memcached is configured for rate limiting
- Without cache, alerts will send on every measurement!

### Background Jobs (Optional Enhancement)
```bash
# Add to Gemfile for async processing
bundle add sidekiq
bundle add redis

# Create job
rails generate job SendAlert
```

## 📊 Success Metrics

You'll know it's working when:
1. ✅ User receives SMS when CO2 > threshold
2. ✅ Rate limiting prevents spam (1 per venue per hour)
3. ✅ Admin can see/edit phone numbers
4. ✅ API returns alert preferences
5. ✅ No errors in `rails console` testing

## 🐛 Common Issues & Fixes

### "Twilio::REST::RestError"
- Check credentials in `rails credentials:edit`
- Verify phone number format (+1234567890)
- Ensure Twilio account has SMS credits

### "undefined method `phone_number`"
- Run `rails db:migrate`
- Restart Rails server

### No SMS received
- Check `Rails.logger` for "SMS Alert sent" messages
- Verify user.alert_enabled is true
- Check co2ppm exceeds threshold
- Ensure phone_number is present

## 📝 Next Steps

After implementation:
1. Add SMS webhook for STOP replies
2. Create alert history/logs table
3. Add venue name resolution from Google Places
4. Implement batch alerts for multiple users
5. Add email as fallback channel

---

*Time estimate: 50-60 minutes for full implementation*
*Tested with Rails 7.1.0 and twilio-ruby gem*