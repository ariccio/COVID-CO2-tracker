# frozen_string_literal: true

# Configure Rack::Timeout for Heroku production environment
# Prevents requests from running indefinitely and helps avoid H12 timeout errors
if defined?(Rack::Timeout)
  # Heroku router timeout is 30 seconds, so we set service timeout to 25 seconds
  # to allow time for cleanup and proper error responses
  Rack::Timeout.service_timeout = 25 # seconds

  # Wait timeout: Time to wait for a request to be serviced
  # Set to 30 seconds to match Heroku's router timeout
  Rack::Timeout.wait_timeout = 30 # seconds

  # Disable wait_overtime to prevent false positives on low-traffic apps
  Rack::Timeout.wait_overtime = nil

  # Log level for timeout events
  Rack::Timeout.logger_level = Logger::ERROR

  # Disable timeout in test environment
  if Rails.env.test?
    Rack::Timeout.service_timeout = 0
  end

  # For development, use a longer timeout for debugging
  if Rails.env.development?
    Rack::Timeout.service_timeout = 60
  end
end