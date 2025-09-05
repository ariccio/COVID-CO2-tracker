# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

# SECURITY: Configure strict CORS with explicit allowed origins
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Development configuration
  if Rails.env.development?
    allow do
      origins 'localhost:3000', 'localhost:3001', '127.0.0.1:3000', '127.0.0.1:3001'

      resource '*',
               headers: :any,
               methods: [:get, :post, :put, :patch, :delete, :options, :head],
               credentials: false,
               max_age: 86_400
    end
  end

  # Production configuration - STRICT
  if Rails.env.production?
    # Get allowed origins from environment variable
    allowed_origins = ENV.fetch('ALLOWED_ORIGINS', '').split(',')
    allowed_origins.map!(&:strip)
    allowed_origins.reject!(&:empty?)

    if allowed_origins.any?
      allow do
        origins(*allowed_origins)

        # API endpoints - restricted methods
        resource '/api/v1/exports/*',
                 headers: ['Authorization', 'Content-Type'],
                 methods: [:get, :options],
                 credentials: false,
                 max_age: 86_400

        # Other API endpoints
        resource '/api/*',
                 headers: :any,
                 methods: [:get, :post, :put, :patch, :delete, :options],
                 credentials: true,
                 max_age: 86_400
      end
    else
      # If no origins configured, deny all cross-origin requests
      Rails.logger.warn 'CORS: No allowed origins configured. Cross-origin requests will be blocked.'
    end
  end

  # Test environment - Flexible for security testing
  if Rails.env.test?
    # In test, allow configuration via ENV for testing different scenarios
    test_origins = if ENV['ALLOWED_ORIGINS'].present?
                     origins = ENV['ALLOWED_ORIGINS'].split(',')
                     origins.map!(&:strip)
                     origins.reject!(&:empty?)
                     origins
                   else
                     # Default test origins
                     ['https://trusted-test-origin.com', 'http://localhost:3000']
                   end

    if test_origins.any?
      allow do
        origins(*test_origins)

        # Export endpoints
        resource '/api/v1/export',
                 headers: ['Authorization', 'Content-Type', 'Accept'],
                 methods: [:get, :post, :options],
                 credentials: true,
                 max_age: 86_400

        resource '/api/v1/exports/*',
                 headers: ['Authorization', 'Content-Type'],
                 methods: [:get, :options],
                 credentials: false,
                 max_age: 86_400

        # Other API endpoints
        resource '/api/*',
                 headers: ['Authorization', 'Content-Type', 'Accept'],
                 methods: [:get, :post, :options],
                 credentials: false,
                 max_age: 86_400
      end
    end
  end
end