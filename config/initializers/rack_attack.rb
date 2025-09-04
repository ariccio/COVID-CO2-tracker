# frozen_string_literal: true

# Rate limiting and throttling configuration for API security
class Rack::Attack
  # Configure cache store
  if Rails.env.test?
    # Use memory store for tests
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  elsif Rails.cache.respond_to?(:redis)
    # Use Redis if available
    Rack::Attack.cache.store = Rails.cache
  else
    # Fall back to memory store with size limit
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new(size: 64.megabytes)
  end

  # === SAFELIST ===
  # Allow localhost in development
  if Rails.env.development?
    safelist('allow-localhost') do |req|
      req.ip == '127.0.0.1' || req.ip == '::1'
    end
  end

  # === BLOCKLIST ===
  # Block suspicious requests
  blocklist('block-bad-bots') do |req|
    # Block requests with suspicious user agents
    req.user_agent =~ /bad_bot|evil_scanner|malicious/i
  end

  # === THROTTLES ===
  # Throttle all API requests by IP
  throttle('api/ip', limit: 300, period: 1.hour) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Throttle export requests by token
  # More restrictive for export endpoints
  throttle('exports/token', limit: 100, period: 1.hour) do |req|
    if req.path.start_with?('/api/v1/export')
      # Extract token from Authorization header
      auth_header = req.get_header('HTTP_AUTHORIZATION')
      if auth_header&.start_with?('Bearer ')
        # Use the token itself as the discriminator
        # This prevents bypass through casing variations
        token = auth_header[7..]&.strip
        # Normalize the token to prevent bypass attempts
        token&.downcase if token.present?
      end
    end
  end

  # Throttle aggressive burst requests
  throttle('req/burst', limit: 10, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # === TRACKS ===
  # Track requests that might be suspicious
  track('special/pings') do |req|
    req.path == '/ping'
  end

  # === CUSTOM RESPONSES ===
  # Customize throttled response
  self.throttled_responder = lambda do |env|
    # Handle both env hash and request object
    request_env = env.is_a?(Rack::Attack::Request) ? env.env : env

    # Get the matched throttle
    match_data = request_env['rack.attack.match_data']
    throttle_name = request_env['rack.attack.matched']

    # Ensure match_data is a hash (sometimes it can be nil or another object in tests)
    if match_data.is_a?(Hash)
      # Calculate retry time
      now = match_data[:epoch_time]
      retry_after = match_data[:period] - (now % match_data[:period])

      # Build response headers
      headers = {
        'Content-Type' => 'application/json',
        'Retry-After' => retry_after.to_s,
        'X-RateLimit-Limit' => match_data[:limit].to_s,
        'X-RateLimit-Remaining' => '0',
        'X-RateLimit-Reset' => (now + retry_after).to_s
      }
    else
      # Fallback headers when match_data is not available
      headers = {
        'Content-Type' => 'application/json',
        'Retry-After' => '60'
      }
    end

    # Log the rate limit event
    Rails.logger.warn("Rate limit exceeded: #{throttle_name} for #{request_env['REQUEST_PATH'] || request_env['PATH_INFO']}")

    # Return 429 Too Many Requests
    [429, headers, [{ error: 'Too many requests. Please retry later.' }.to_json]]
  end

  # Customize blocked response
  self.blocklisted_responder = lambda do |_env|
    [403, { 'Content-Type' => 'application/json' }, [{ error: 'Forbidden' }.to_json]]
  end
end

# Enable Rack::Attack middleware
Rails.application.config.middleware.use Rack::Attack

# Disable Rack::Attack in test environment by default
# Individual tests can enable it when needed (e.g., security tests)
if Rails.env.test?
  Rack::Attack.enabled = false
end

# Log attacks in development
if Rails.env.development?
  ActiveSupport::Notifications.subscribe('rack.attack') do |_name, _start, _finish, _id, payload|
    req = payload[:request]
    Rails.logger.info "[Rack::Attack] #{req.env['rack.attack.matched']} #{req.path}"
  end
end