# frozen_string_literal: true

::Sentry.init do |config|
  config.dsn = 'https://5c72ea76ca204179b35fa8a3eb847ab0@o584271.ingest.sentry.io/5737166' unless ((Rails.env == "development") || (Rails.env == "test") )
  config.breadcrumbs_logger = [:active_support_logger]


  config.environment = Rails.env
  config.enabled_environments = ["production"]
  # To activate performance monitoring, set one of these options.
  # We recommend adjusting the value in production:
  # config.traces_sample_rate = 0
  # or
  # config.traces_sampler = lambda do |context|
  #   true
  # end

  # https://github.com/getsentry/sentry-ruby/issues/1522#issuecomment-1140223492
  # config.async = lambda do |event, hint|
  #   ::Sentry::SendEventJob.perform_later(event, hint)
  # end
end
