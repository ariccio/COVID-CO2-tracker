# frozen_string_literal: true

# Rate limiting concern for export controllers
# Handles export rate limits and tracks usage
module ExportRateLimiting
  extend ActiveSupport::Concern

  included do
    before_action :check_export_rate_limit
    after_action :increment_rate_limit_counter, only: :index
  end

  private

  def check_export_rate_limit
    return unless @export_token # Skip if authentication failed

    rate_limit_key = @export_token.rate_limit_key
    current_count = Rails.cache.read(rate_limit_key) || 0

    if current_count >= @export_token.rate_limit_per_hour
      Rails.logger.warn("Rate limit exceeded for token: #{rate_limit_key}")
      render(json: {
               error: 'Rate limit exceeded',
               retry_after: calculate_retry_after_seconds(rate_limit_key)
             }, status: :too_many_requests)
    end
  end

  def increment_rate_limit_counter
    return unless @export_token

    rate_limit_key = @export_token.rate_limit_key
    Rails.cache.increment(rate_limit_key, 1, expires_in: 1.hour)
  end

  def calculate_retry_after_seconds(rate_limit_key)
    # Get the TTL for the cache key to determine when limit resets
    if Rails.cache.respond_to?(:redis)
      ttl = Rails.cache.redis.ttl(rate_limit_key)
      ttl.positive? ? ttl : 3600
    else
      3600 # Default to 1 hour if we can't determine TTL
    end
  end
end