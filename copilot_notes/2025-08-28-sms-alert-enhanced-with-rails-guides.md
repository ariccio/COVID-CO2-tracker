# SMS Alert System Enhanced with Rails Guide Best Practices
*Generated: 2025-08-28*
*Incorporates Active Job, Security, and API best practices from Rails 7.1 official guides*

## Executive Summary
Enhanced SMS alert implementation for COVID CO2 Tracker incorporating official Rails patterns:
- Active Job for background processing (prevents Heroku timeouts)
- Security hardening from Rails Security Guide
- API-only optimizations
- Rate limiting and authentication
- Proper error handling and retry logic

## 1. Active Job Background Processing

### Alert Job with Retry Logic (from active_job_basics)

```ruby
# app/jobs/co2_alert_job.rb
class Co2AlertJob < ApplicationJob
  queue_as :alerts
  
  # Prevent duplicate alerts using Solid Queue concurrency controls
  limits_concurrency to: 1, key: ->(measurement_id, user_id) { 
    "alert:#{user_id}:#{measurement_id}" 
  }, duration: 1.hour
  
  # Retry on temporary failures
  retry_on Twilio::REST::TwilioError, wait: :exponentially_longer, attempts: 3
  retry_on Net::OpenTimeout, wait: 5.seconds, attempts: 3
  
  # Don't retry if data is corrupted
  discard_on ActiveJob::DeserializationError
  
  # Report errors to monitoring
  rescue_from StandardError do |exception|
    Rails.error.report(exception, {
      measurement_id: arguments[0],
      user_id: arguments[1],
      severity: 'high'
    })
    
    # Notify admin of critical failure
    AdminMailer.alert_system_failure(exception, arguments).deliver_later
    raise exception  # Re-raise to trigger retry
  end
  
  around_perform :measure_performance
  
  def perform(measurement_id, user_id, alert_type = :threshold)
    measurement = Measurement.find(measurement_id)
    user = User.find(user_id)
    
    # Security check - prevent parameter manipulation
    return unless user.alert_preferences.active?
    return unless should_send_alert?(measurement, user)
    
    # Send SMS with proper error handling
    response = send_sms_alert(measurement, user, alert_type)
    
    # Log success
    create_alert_log(measurement, user, response, alert_type)
    
    # Update user's last alert timestamp
    user.alert_preferences.touch(:last_alert_at)
  end
  
  private
  
  def should_send_alert?(measurement, user)
    # Prevent alert fatigue - check cooldown period
    return false if recent_alert_sent?(measurement, user)
    
    # Check threshold based on alert type
    measurement.co2ppm >= user.alert_preferences.threshold_ppm
  end
  
  def recent_alert_sent?(measurement, user)
    user.alert_logs
        .where(place_id: measurement.sub_location.place_id)
        .where(created_at: 30.minutes.ago..Time.current)
        .exists?
  end
  
  def send_sms_alert(measurement, user, alert_type)
    message = build_alert_message(measurement, alert_type)
    
    # Use Twilio with proper configuration
    client = Twilio::REST::Client.new(
      Rails.application.credentials.twilio[:account_sid],
      Rails.application.credentials.twilio[:auth_token]
    )
    
    client.messages.create(
      from: Rails.application.credentials.twilio[:phone_number],
      to: user.phone_number,
      body: message
    )
  end
  
  def build_alert_message(measurement, alert_type)
    case alert_type
    when :threshold
      "⚠️ CO2 Alert: #{measurement.co2ppm}ppm at #{measurement.sub_location.description}. " \
      "Consider wearing a mask or leaving. Reply STOP to unsubscribe."
    when :danger
      "🚨 DANGER: CO2 at #{measurement.co2ppm}ppm! #{measurement.sub_location.description}. " \
      "Leave immediately for your safety. Reply STOP to unsubscribe."
    when :trend
      "📈 CO2 Rising: Now #{measurement.co2ppm}ppm at #{measurement.sub_location.description}. " \
      "Ventilation degrading. Reply STOP to unsubscribe."
    end
  end
  
  def create_alert_log(measurement, user, response, alert_type)
    AlertLog.create!(
      user: user,
      measurement: measurement,
      place_id: measurement.sub_location.place_id,
      alert_type: alert_type,
      co2_level: measurement.co2ppm,
      twilio_sid: response.sid,
      status: response.status,
      sent_at: Time.current
    )
  end
  
  def measure_performance(&block)
    start_time = Time.current
    result = yield
    duration = Time.current - start_time
    
    Rails.logger.info "[Co2AlertJob] Completed in #{duration.round(2)}s"
    StatsD.histogram('jobs.co2_alert.duration', duration * 1000)
    
    result
  end
end
```

### Bulk Alert Processing

```ruby
# app/jobs/bulk_venue_alert_job.rb
class BulkVenueAlertJob < ApplicationJob
  queue_as :bulk_alerts
  
  def perform(place_id)
    place = Place.find(place_id)
    latest_measurement = place.latest_measurement
    
    return unless latest_measurement.co2ppm >= 1000  # WHO threshold
    
    # Find all users who want alerts for this venue
    subscribed_users = User.joins(:alert_preferences)
                           .where(alert_preferences: { 
                             place_id: place_id,
                             active: true 
                           })
    
    # Create individual alert jobs for each user
    alert_jobs = subscribed_users.map do |user|
      Co2AlertJob.new(latest_measurement.id, user.id, :threshold)
                 .set(wait: rand(0..30).seconds)  # Stagger sending
    end
    
    # Bulk enqueue using Solid Queue's optimization
    ActiveJob.perform_all_later(alert_jobs)
    
    Rails.logger.info "[BulkAlert] Queued #{alert_jobs.size} alerts for #{place.name}"
  end
end
```

## 2. Security Hardening (from Security Guide)

### API Authentication for Alert Management

```ruby
# app/controllers/api/v1/alert_preferences_controller.rb
class Api::V1::AlertPreferencesController < ApplicationController
  include ActionController::HttpAuthentication::Token::ControllerMethods
  
  before_action :authenticate_api_request
  before_action :rate_limit_alerts
  before_action :validate_phone_number, only: [:create, :update]
  
  # Prevent CSRF for API endpoints
  protect_from_forgery with: :null_session
  
  def create
    @preference = current_user.build_alert_preference(alert_params)
    
    if @preference.save
      # Send confirmation SMS with verification code
      VerifyPhoneJob.perform_later(current_user.id)
      
      render json: @preference, status: :created
    else
      render_validation_errors(@preference)
    end
  end
  
  def update
    @preference = current_user.alert_preference
    
    # Require password for sensitive changes
    unless current_user.authenticate(params[:password])
      return render_unauthorized("Password required for this change")
    end
    
    if @preference.update(alert_params)
      render json: @preference
    else
      render_validation_errors(@preference)
    end
  end
  
  private
  
  def authenticate_api_request
    authenticate_or_request_with_http_token do |token, options|
      # Constant-time comparison to prevent timing attacks
      user = User.find_by(api_token: token)
      
      if user && ActiveSupport::SecurityUtils.secure_compare(user.api_token, token)
        @current_user = user
        true
      else
        false
      end
    end
  end
  
  def rate_limit_alerts
    # Prevent SMS bombing attacks
    cache_key = "alert_api:#{request.remote_ip}:#{current_user.id}"
    count = Rails.cache.increment(cache_key, 1, expires_in: 1.hour)
    
    if count > 20  # 20 API calls per hour
      render json: { 
        error: "Rate limit exceeded. Maximum 20 requests per hour.",
        retry_after: 1.hour.to_i
      }, status: :too_many_requests
    end
  end
  
  def validate_phone_number
    phone = params.dig(:alert_preference, :phone_number)
    
    # Sanitize and validate phone number
    unless phone.present? && phone.match?(/\A\+?1?\d{10,14}\z/)
      render json: { 
        error: "Invalid phone number format" 
      }, status: :unprocessable_entity
    end
  end
  
  def alert_params
    # Whitelist parameters to prevent mass assignment
    params.expect(alert_preference: [
      :phone_number,
      :threshold_ppm,
      :active,
      :alert_types,
      place_ids: []
    ])
  end
  
  def render_validation_errors(model)
    render json: {
      errors: model.errors.map { |error|
        {
          field: error.attribute,
          message: error.message,
          type: error.type
        }
      }
    }, status: :unprocessable_entity
  end
  
  def render_unauthorized(message = "Unauthorized")
    render json: { error: message }, status: :unauthorized
  end
end
```

### SMS Webhook Security

```ruby
# app/controllers/webhooks/twilio_controller.rb
class Webhooks::TwilioController < ApplicationController
  # Skip CSRF for webhooks
  skip_before_action :verify_authenticity_token
  before_action :verify_twilio_signature
  
  def status
    # Handle SMS delivery status
    alert_log = AlertLog.find_by(twilio_sid: params[:MessageSid])
    
    if alert_log
      alert_log.update!(
        delivery_status: params[:MessageStatus],
        error_code: params[:ErrorCode],
        error_message: params[:ErrorMessage]
      )
      
      # Handle unsubscribe requests
      handle_stop_request if params[:Body]&.downcase&.include?('stop')
    end
    
    head :no_content
  end
  
  private
  
  def verify_twilio_signature
    # Verify webhook is from Twilio
    signature = request.headers['X-Twilio-Signature']
    url = request.original_url
    params = request.request_parameters
    
    auth_token = Rails.application.credentials.twilio[:auth_token]
    
    validator = Twilio::Security::RequestValidator.new(auth_token)
    
    unless validator.validate(url, params, signature)
      Rails.logger.warn "[Security] Invalid Twilio signature from #{request.remote_ip}"
      head :forbidden
    end
  end
  
  def handle_stop_request
    phone = params[:From]
    user = User.find_by(phone_number: phone)
    
    if user&.alert_preference
      user.alert_preference.update!(active: false, unsubscribed_at: Time.current)
      
      # Send confirmation
      TwilioClient.send_message(
        to: phone,
        body: "You've been unsubscribed from CO2 alerts. Text START to re-subscribe."
      )
    end
  end
end
```

## 3. Database Schema and Models

### Migrations with Security in Mind

```ruby
# db/migrate/xxx_create_alert_system.rb
class CreateAlertSystem < ActiveRecord::Migration[7.1]
  def change
    # Store user preferences
    create_table :alert_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :phone_number, null: false
      t.string :phone_number_encrypted  # Store encrypted version
      t.boolean :phone_verified, default: false
      t.string :verification_code_digest  # Hashed verification code
      t.datetime :verification_sent_at
      t.integer :threshold_ppm, default: 1000
      t.boolean :active, default: true
      t.datetime :unsubscribed_at
      t.datetime :last_alert_at
      t.jsonb :alert_types, default: ['threshold', 'danger']
      t.integer :daily_limit, default: 10
      t.integer :daily_count, default: 0
      t.date :daily_count_date
      
      t.timestamps
    end
    
    # Log all alerts sent
    create_table :alert_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :measurement, null: false, foreign_key: true
      t.references :place, null: false, foreign_key: true
      t.string :alert_type, null: false
      t.integer :co2_level, null: false
      t.string :twilio_sid
      t.string :delivery_status
      t.string :error_code
      t.string :error_message
      t.datetime :sent_at, null: false
      
      t.timestamps
    end
    
    # Track venue subscriptions
    create_table :venue_alert_subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :place, null: false, foreign_key: true
      t.boolean :active, default: true
      
      t.timestamps
      t.index [:user_id, :place_id], unique: true
    end
    
    # Add indexes for performance
    add_index :alert_logs, [:user_id, :place_id, :created_at]
    add_index :alert_logs, :twilio_sid
    add_index :alert_preferences, :phone_number_encrypted
  end
end
```

### Models with Validation and Security

```ruby
# app/models/alert_preference.rb
class AlertPreference < ApplicationRecord
  belongs_to :user
  has_many :alert_logs, through: :user
  
  # Encrypt sensitive data
  encrypts :phone_number
  
  # Validations with security in mind
  validates :phone_number, presence: true, format: {
    with: /\A\+?1?\d{10,14}\z/,
    message: "must be a valid phone number"
  }
  validates :threshold_ppm, inclusion: { in: 400..5000 }
  validates :daily_limit, inclusion: { in: 1..50 }
  
  # Secure verification code
  has_secure_token :verification_code, length: 6
  
  # Prevent alert fatigue
  before_save :reset_daily_count_if_needed
  
  def can_send_alert?
    active? && 
    phone_verified? && 
    within_daily_limit? &&
    !recently_alerted?
  end
  
  def within_daily_limit?
    reset_daily_count_if_needed
    daily_count < daily_limit
  end
  
  def recently_alerted?
    last_alert_at.present? && last_alert_at > 30.minutes.ago
  end
  
  def increment_daily_count!
    reset_daily_count_if_needed
    increment!(:daily_count)
  end
  
  private
  
  def reset_daily_count_if_needed
    if daily_count_date != Date.current
      self.daily_count = 0
      self.daily_count_date = Date.current
    end
  end
end
```

## 4. Testing with Rails Patterns

```ruby
# test/jobs/co2_alert_job_test.rb
require 'test_helper'

class Co2AlertJobTest < ActiveJob::TestCase
  setup do
    @measurement = measurements(:high_co2)  # 1500ppm
    @user = users(:alice)
    @preference = alert_preferences(:alice_active)
  end
  
  test "enqueues alert job successfully" do
    assert_enqueued_with(job: Co2AlertJob) do
      Co2AlertJob.perform_later(@measurement.id, @user.id)
    end
  end
  
  test "sends SMS for high CO2 levels" do
    # Mock Twilio
    mock_twilio = Minitest::Mock.new
    mock_twilio.expect :create, OpenStruct.new(sid: 'TEST123', status: 'sent'), [Hash]
    
    Twilio::REST::Client.stub :new, mock_twilio do
      perform_enqueued_jobs do
        Co2AlertJob.perform_later(@measurement.id, @user.id)
      end
    end
    
    assert_performed_jobs 1
    assert AlertLog.exists?(twilio_sid: 'TEST123')
  end
  
  test "respects rate limiting" do
    # Create recent alert
    AlertLog.create!(
      user: @user,
      measurement: @measurement,
      place_id: @measurement.sub_location.place_id,
      alert_type: 'threshold',
      co2_level: 1500,
      sent_at: 10.minutes.ago
    )
    
    # Should not send another alert
    assert_no_performed_jobs do
      Co2AlertJob.perform_later(@measurement.id, @user.id)
    end
  end
  
  test "retries on Twilio errors" do
    # Simulate Twilio error
    Twilio::REST::Client.stub :new, ->(*) { raise Twilio::REST::TwilioError } do
      assert_performed_jobs 3 do  # Should retry 3 times
        Co2AlertJob.perform_later(@measurement.id, @user.id)
      end
    end
  end
end
```

## 5. API Documentation

### Alert Endpoints

```yaml
# docs/api/alerts.yml
openapi: 3.0.0
paths:
  /api/v1/alert_preferences:
    post:
      summary: Create alert preferences
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone_number
                - password
              properties:
                phone_number:
                  type: string
                  pattern: '^\+?1?\d{10,14}$'
                threshold_ppm:
                  type: integer
                  minimum: 400
                  maximum: 5000
                  default: 1000
                alert_types:
                  type: array
                  items:
                    enum: [threshold, danger, trend]
      responses:
        201:
          description: Preferences created, verification SMS sent
        422:
          description: Validation failed
        429:
          description: Rate limit exceeded
```

## 6. Implementation Checklist

### Immediate (1 hour)
- [ ] Create Active Job for SMS alerts
- [ ] Add retry logic and error handling
- [ ] Implement rate limiting

### Short-term (2-4 hours)
- [ ] Set up Twilio integration
- [ ] Add phone verification flow
- [ ] Create webhook endpoints
- [ ] Add security validations

### Medium-term (1 day)
- [ ] Implement bulk alert system
- [ ] Add comprehensive testing
- [ ] Create admin monitoring dashboard
- [ ] Set up alert analytics

## Key Security Takeaways

1. **Always verify phone numbers** before sending alerts
2. **Rate limit everything** to prevent abuse
3. **Encrypt sensitive data** like phone numbers
4. **Validate webhook signatures** from Twilio
5. **Use Active Job** for background processing
6. **Implement retry logic** with exponential backoff
7. **Log everything** for compliance and debugging
8. **Respect unsubscribe requests** immediately

This enhanced implementation provides production-ready SMS alerts with security, scalability, and reliability built in from the start.