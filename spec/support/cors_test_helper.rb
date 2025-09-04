# frozen_string_literal: true

# CORS testing helper methods
module CorsTestHelper
  # Helper to reload CORS middleware with new configuration
  def reload_cors_middleware!(allowed_origins: nil)
    # Store the original ENV value
    original_env = ENV.fetch('ALLOWED_ORIGINS', nil)

    # Set the new value if provided
    ENV['ALLOWED_ORIGINS'] = allowed_origins if allowed_origins

    # Remove existing CORS middleware
    Rails.application.config.middleware.delete(Rack::Cors) if defined?(Rack::Cors)

    # Re-load the CORS initializer to pick up new configuration
    load Rails.root.join('config/initializers/cors.rb')

    # Restore original ENV value after block if block given
    if block_given?
      begin
        yield
      ensure
        ENV['ALLOWED_ORIGINS'] = original_env
        reload_cors_middleware!
      end
    end

    ENV['ALLOWED_ORIGINS'] = original_env unless block_given?
  end

  # Helper to set CORS test origins
  def with_cors_origins(origins)
    original = ENV.fetch('ALLOWED_ORIGINS', nil)
    ENV['ALLOWED_ORIGINS'] = origins
    yield
  ensure
    ENV['ALLOWED_ORIGINS'] = original
  end
end

RSpec.configure do |config|
  config.include CorsTestHelper, type: :request
end