# frozen_string_literal: true

# Lightweight debug logging for early boot phase (before Rails initializers)
# This is a simplified version of config/initializers/debug_logging.rb
module BootDebug
  def self.log(message)
    return if ENV['SUPPRESS_DEBUG_LOGS']
    return if !$stdin.tty? && !$stdout.tty? # Non-interactive (MCP servers)
    return if ENV.keys.any? { |k| k.start_with?('MCP_') }

    # Boot phase logging uses system time - cannot use Rails time zone yet
    puts "#{Time.now.strftime('%H:%M:%S:%L')}: #{message}" # rubocop:disable Rails/TimeZone
  end

  def self.enabled?
    return false if ENV['SUPPRESS_DEBUG_LOGS']
    return false if !$stdin.tty? && !$stdout.tty?
    return false if ENV.keys.any? { |k| k.start_with?('MCP_') }

    true
  end
end

# Global helper for convenience during boot
def boot_debug(message)
  BootDebug.log(message)
end