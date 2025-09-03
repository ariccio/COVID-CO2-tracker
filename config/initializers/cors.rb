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
    allowed_origins = ENV.fetch('ALLOWED_ORIGINS', '').split(',').map(&:strip).reject(&:empty?)

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

  # Test environment - STRICT for security testing
  if Rails.env.test?
    # Only allow specific test origins
    allow do
      origins 'https://trusted-test-origin.com', 'http://localhost:3000'
      
      resource '/api/v1/exports/*',
               headers: ['Authorization', 'Content-Type'],
               methods: [:get, :options],
               credentials: false,
               max_age: 86_400
               
      resource '/api/*',
               headers: ['Authorization', 'Content-Type', 'Accept'],
               methods: [:get, :post, :options],
               credentials: false,
               max_age: 86_400
    end
  end
end