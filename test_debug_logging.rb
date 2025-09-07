#!/usr/bin/env ruby
# Test script to demonstrate debug logging behavior

require_relative 'config/initializers/debug_logging'

puts "=== Debug Logging Test ==="
puts "Current environment:"
puts "  Interactive terminal: stdin=#{$stdin.tty?}, stdout=#{$stdout.tty?}"
puts "  Parent PID: #{Process.ppid}"
puts "  Parent process: #{DebugLogging.send(:get_parent_process_info, Process.ppid) || 'unknown'}"
puts "  Rails runner check: #{DebugLogging.send(:running_under_rails_runner?)}"
puts "  MCP env check: #{DebugLogging.send(:running_under_mcp?)}"
puts ""
puts "Debug logging enabled: #{DebugLogging.enabled?}"
puts ""

# Test the logging
puts "Testing debug_log function:"
debug_log("This message will only appear in interactive terminals")

puts ""
puts "To test with suppression, try:"
puts "  SUPPRESS_DEBUG_LOGS=1 ruby test_debug_logging.rb"
puts "  rails runner test_debug_logging.rb"
puts "  MCP_TEST=1 ruby test_debug_logging.rb"