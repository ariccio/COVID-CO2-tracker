# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

# TODO: was this an artifact from early dev?

# This block has strange formatting! See https://www.rubydoc.info/gems/rack-cors/0.4.0 for examples.

# https://github.com/cyu/rack-cors/blob/0e68b881ef6c428bbf928b2c4a92ab49a34823e3/examples/rails6/config/initializers/cors.rb#L6
::Rails.application.config.middleware.insert_before(0, ::Rack::Cors, debug: true, logger: (-> { Rails.logger })) do
  allow do
    origins('localhost:3001')
    origins('localhost:3000')
    # origins('localhost:3002')
    resource(
      '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
    )
  end
end
