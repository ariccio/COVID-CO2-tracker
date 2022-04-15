# frozen_string_literal: true
puts "Start of config/application.rb: #{Time.now}"
require_relative 'boot'

require 'rails'
# Pick the frameworks you want:
require 'active_model/railtie'
require 'active_job/railtie'
require 'active_record/railtie'
# require 'active_storage/engine'
require 'action_controller/railtie'
# require 'action_mailer/railtie'
# require 'action_mailbox/engine'
# require 'action_text/engine'
require 'action_view/railtie'
# require 'action_cable/engine'
require 'sprockets/railtie'
require 'rails/test_unit/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
::Bundler.require(*::Rails.groups)

module COVIDCo2Tracker
  class Application < ::Rails::Application
    puts "Start Application class: #{Time.now}"
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults(6.1)

    # TODO: logging filters for google auth storage and stuff https://guides.rubyonrails.org/v3.0/security.html#logging

    config.filter_parameters += ['sub_google_uid']
    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # puts "Starting middleware: #{Time.now}"
    config.middleware.use(::ActionDispatch::Cookies)

    # Middleware for ActiveAdmin
    config.middleware.use(::Rack::MethodOverride)
    config.middleware.use(::ActionDispatch::Flash)
    config.middleware.use(::ActionDispatch::Session::CookieStore)
    # puts "End      middleware: #{Time.now}"

    # Fix rails g scaffold for ActiveAdmin
    # As per https://blog.heroku.com/a-rock-solid-modern-web-stack
    config.app_generators.scaffold_controller = :scaffold_controller
    puts "End   Application class: #{Time.now}\r\n"
  end
end
puts "end   of config/application.rb: #{Time.now}\r\n"