# frozen_string_literal: true
# puts "#{Time.now.strftime("%H:%M:%S:%L")}: Start of config/environments/test.rb"

require 'active_support/core_ext/integer/time'

# The test environment is used exclusively to run your application's
# test suite. You never need to work with it otherwise. Remember that
# your test database is "scratch space" for the test suite and is wiped
# and recreated between test runs. Don't rely on the data there!

::Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.
  puts("CONFIGURING as test environment")
  config.enable_reloading = false

  # Eager loading loads your entire application. When running a single test locally,
  # this is usually not necessary, and can slow down your test suite. However, it's
  # recommended that you enable it in continuous integration systems to ensure eager
  # loading is working properly before deploying your code.
  config.eager_load = ENV["CI"].present?

  # Configure public file server for tests with Cache-Control for performance.
  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{1.hour.to_i}"
  }

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false
  config.cache_store = :null_store

  # Render exception templates for rescuable exceptions and raise for other exceptions.
  config.action_dispatch.show_exceptions = :rescuable

  # Disable request forgery protection in test environment.
  config.action_controller.allow_forgery_protection = false

  # Store uploaded files on the local file system in a temporary directory.
  # config.active_storage.service = :test

  # config.action_mailer.perform_caching = false

  # Tell Action Mailer not to deliver emails to the real world.
  # The :test delivery method accumulates sent emails in the
  # ActionMailer::Base.deliveries array.
  # config.action_mailer.delivery_method = :test

  # Print deprecation notices to the stderr.
  config.active_support.deprecation = :stderr

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

  # Raise error when a before_action's only/except options reference missing actions
  config.action_controller.raise_on_missing_callback_actions = true


  # pp "turning ActiveRecord SQL query logs on"
  # # config.active_record.verbose_query_logs = true
  # config.log_level = :warn

  # https://edgeguides.rubyonrails.org/configuring.html#config-active-record-db-warnings-action
  config.active_record.db_warnings_action = :report


  config.log_level = :debug
  
  Rails.logger = Logger.new(STDOUT)

    # Rails.logger.level = Logger::WARN
  # else
    Rails.logger.level = Logger::DEBUG
  # end

  # Rails.logger = Logger.new(STDOUT)
  # Rails.logger.level = Logger::INFO

  # config.after_initialize do
  #   puts("SLEEPING as a temporary measure to more easily debug e2e test connection issues")
  #   sleep(10)
  #   puts("DONE SLEEPING!")
  # end
end
# puts "#{Time.now.strftime("%H:%M:%S:%L")}: end   of config/environments/test.rb\r\n"
