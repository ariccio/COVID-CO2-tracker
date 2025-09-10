# frozen_string_literal: true

# Rate limiting concern for export controllers
# Handles export rate limits and tracks usage
module ExportRateLimiting
  extend ActiveSupport::Concern

  included do
    before_action :check_export_rate_limit
    # This concern is included in controllers that define their own index action
    # Note: after_action callbacks run in REVERSE order, so set_rate_limit_headers runs first
    after_action :set_rate_limit_headers, only: :index
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

    # Read current value, increment, and write back
    # This works consistently across different cache stores
    current = Rails.cache.read(rate_limit_key) || 0
    new_value = current + 1
    Rails.cache.write(rate_limit_key, new_value, expires_in: 1.hour)
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

  def set_rate_limit_headers
    return unless @export_token

    rate_limit_key = @export_token.rate_limit_key
    # Get the current count after increment has happened
    current_count = Rails.cache.read(rate_limit_key) || 0
    limit = @export_token.rate_limit_per_hour
    # Since increment_rate_limit_counter has already run, current_count includes this request
    # So remaining should be limit - current_count
    remaining = [limit - current_count, 0].max
    reset_time = calculate_rate_limit_reset_time(rate_limit_key)

    response.headers['X-RateLimit-Limit'] = limit.to_s
    response.headers['X-RateLimit-Remaining'] = remaining.to_s
    response.headers['X-RateLimit-Reset'] = reset_time.to_s
  end

  def calculate_rate_limit_reset_time(rate_limit_key)
    # Calculate the reset time as epoch seconds
    if Rails.cache.respond_to?(:redis)
      ttl = Rails.cache.redis.ttl(rate_limit_key)
      if ttl.positive?
        return (Time.current + ttl.seconds).to_i
      end
    end
    # Default to 1 hour from now if we can't determine TTL
    return (Time.current + 1.hour).to_i
  end
end