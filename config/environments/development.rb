# frozen_string_literal: true
puts "#{Time.now.strftime("%H:%M:%S:%L")}: Start of config/environments/development.rb"

require 'active_support/core_ext/integer/time'

::Rails.application.configure do

if ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
  puts "Must be in cypress mode - turning off a bunch of verbosity!"
end


  config.after_initialize do
    ::Bullet.enable        = true
  # Bullet.alert         = true
  # Bullet.bullet_logger = true
  # Bullet.console       = true
  # Bullet.growl         = true
    unless ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
      ::Bullet.rails_logger  = true
    end
    # Bullet.add_footer    = true
  end

  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if ::Rails.root.join('tmp', 'caching-dev.txt').exist?
    config.cache_store = :memory_store
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.to_i}"
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Store uploaded files on the local file system (see config/storage.yml for options).
  # config.active_storage.service = :local

  # Don't care if the mailer can't send.
  # config.action_mailer.raise_delivery_errors = false

  # config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  unless ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
    config.active_record.verbose_query_logs = true
  end

  if Rails.version != "7.0.8"
    # https://edgeguides.rubyonrails.org/configuring.html#config-active-record-db-warnings-action
    config.active_record.db_warnings_action = :report
  end

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  # config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # Uncomment if you wish to allow Action Cable access from any origin.
  # config.action_cable.disable_request_forgery_protection = true



  if ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
    # config.log_level = :warn
    config.log_level = :debug
  else
    config.log_level = :debug
  end
  
  Rails.logger = Logger.new(STDOUT)

  if ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
    Rails.logger.level = Logger::WARN
  else
    Rails.logger.level = Logger::DEBUG
  end

  # config.after_initialize() do
  #   pp 'ENV["PORT\"]: ', ENV["PORT"]
  #   unless ENV.include?("PORT")
  #     puts 'ENV["PORT"] does not exist! Setting this to 3001 makes this easier for Alexander when he develops :)'
  #     ENV["PORT"] = "3001"
  #   else
  #     puts "PORT environment variable already exists: #{ENV["PORT"]}"
  #   end
  # end

end

puts "#{Time.now.strftime("%H:%M:%S:%L")}: end   of config/environments/development.rb\r\n"
