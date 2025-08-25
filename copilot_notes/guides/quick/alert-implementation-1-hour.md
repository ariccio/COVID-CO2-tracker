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
