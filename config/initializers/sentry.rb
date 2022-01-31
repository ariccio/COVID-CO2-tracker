# frozen_string_literal: true

::Sentry.init do |config|
  config.dsn = 'https://5c72ea76ca204179b35fa8a3eb847ab0@o584271.ingest.sentry.io/5737166'
  config.breadcrumbs_logger = [:active_support_logger]

  # To activate performance monitoring, set one of these options.
  # We recommend adjusting the value in production:
  config.traces_sample_rate = 0
  # or
  # config.traces_sampler = lambda do |context|
  #   true
  # end

  # https://docs.sentry.io/platforms/ruby/guides/rails/configuration/options/
  config.async = lambda do |event, hint|
    ::Sentry::SendEventJob.perform_later(event, hint)
  end
end
