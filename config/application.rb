# frozen_string_literal: true
puts "Start of config/application.rb: #{Time.now}"
require_relative 'boot'

puts "require 'rails': #{Time.now}"
require 'rails'
# Pick the frameworks you want:
puts "require 'active_model/railtie': #{Time.now}"
require 'active_model/railtie'

puts "require 'active_job/railtie': #{Time.now}"
require 'active_job/railtie'

puts "require 'active_record/railtie': #{Time.now}"
require 'active_record/railtie'

# require 'active_storage/engine'
puts "require 'action_controller/railtie': #{Time.now}"
require 'action_controller/railtie'

puts "require 'action_mailer/railtie': #{Time.now}"
require 'action_mailer/railtie'
# require 'action_mailbox/engine'
# require 'action_text/engine'

puts "require 'action_view/railtie': #{Time.now}"
require 'action_view/railtie'

# require 'action_cable/engine'
puts "require 'sprockets/railtie': #{Time.now}"
require 'sprockets/railtie'

puts "require 'rails/test_unit/railtie': #{Time.now}"
require 'rails/test_unit/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
puts "requiring gems listed in gemfile: #{Time.now}"
::Bundler.require(*::Rails.groups)

puts "DONE requiring gems listed in gemfile: #{Time.now}"

module COVIDCo2Tracker
  class Application < ::Rails::Application
    puts "\tStart Application class: #{Time.now}"
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
    puts "\tEnd   Application class: #{Time.now}"
    puts ""
  end
end
puts "end   of config/application.rb: #{Time.now}"
puts ""
