# frozen_string_literal: true

# Configure Rack::Timeout for Heroku production environment
# Prevents requests from running indefinitely and helps avoid H12 timeout errors
if defined?(Rack::Timeout)
  # rack-timeout 0.7.0+ uses environment variables or Rails.application.config
  # Set the timeout values based on environment

  if Rails.env.production?
    # Heroku router timeout is 30 seconds, so we set service timeout to 25 seconds
    # to allow time for cleanup and proper error responses
    Rails.application.config.middleware.use(
      Rack::Timeout,
      service_timeout: 25,  # seconds
      wait_timeout: 30,     # seconds
      wait_overtime: false, # Disable to prevent false positives on low-traffic apps
      service_past_wait: false
    )
  elsif Rails.env.test?
    # Disable timeout in test environment
    Rails.application.config.middleware.use(
      Rack::Timeout,
      service_timeout: 0 # 0 disables the timeout
    )
  elsif Rails.env.development?
    # For development, use a longer timeout for debugging
    Rails.application.config.middleware.use(
      Rack::Timeout,
      service_timeout: 60,  # seconds
      wait_timeout: 30      # seconds
    )
  end
end