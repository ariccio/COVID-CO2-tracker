# frozen_string_literal: true
puts "Start of config/application.rb"
require_relative 'boot'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'rails'"
require 'rails'
# Pick the frameworks you want:
puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'active_model/railtie'"
require 'active_model/railtie'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'active_job/railtie'"
require 'active_job/railtie'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'active_record/railtie'"
require 'active_record/railtie'

# require 'active_storage/engine'
puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'action_controller/railtie'"
require 'action_controller/railtie'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'action_mailer/railtie'"
require 'action_mailer/railtie'
# require 'action_mailbox/engine'
# require 'action_text/engine'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'action_view/railtie'"
require 'action_view/railtie'

# require 'action_cable/engine'
puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'sprockets/railtie'"
require 'sprockets/railtie'

puts "#{Time.now.strftime("%H:%M:%S:%L")}: require 'rails/test_unit/railtie'"
require 'rails/test_unit/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
puts "#{Time.now.strftime("%H:%M:%S:%L")}: requiring gems listed in gemfile"
::Bundler.require(*::Rails.groups)

puts "#{Time.now.strftime("%H:%M:%S:%L")}: DONE requiring gems listed in gemfile"

module COVIDCo2Tracker
  class Application < ::Rails::Application
    puts "\t#{Time.now.strftime("%H:%M:%S:%L")}: Start Application class"
    # Initialize configuration defaults for last manually-checked rails version
    config.load_defaults(7.0)

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

    puts "#{Time.now.strftime("%H:%M:%S:%L")}: Starting middleware"
    config.middleware.use(::ActionDispatch::Cookies)

    # Middleware for ActiveAdmin
    config.middleware.use(::Rack::MethodOverride)
    config.middleware.use(::ActionDispatch::Flash)
    config.middleware.use(::ActionDispatch::Session::CookieStore)
    puts "#{Time.now.strftime("%H:%M:%S:%L")}: End      middleware"

    # Fix rails g scaffold for ActiveAdmin
    # As per https://blog.heroku.com/a-rock-solid-modern-web-stack
    config.app_generators.scaffold_controller = :scaffold_controller
    puts "\t#{Time.now.strftime("%H:%M:%S:%L")}: End   Application class"
    puts ""
  end
end
puts "#{Time.now.strftime("%H:%M:%S:%L")}: end   of config/application.rb"
puts ""
