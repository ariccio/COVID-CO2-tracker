#!/usr/bin/env ruby
# frozen_string_literal: true

# Script to update rate limit for existing export tokens
# Usage:
#   rails runner scripts/update_token_rate_limit.rb TOKEN_HASH_PREFIX NEW_RATE_LIMIT
#   rails runner scripts/update_token_rate_limit.rb abc123 1000

if ARGV.length < 2
  puts 'Usage: rails runner scripts/update_token_rate_limit.rb TOKEN_HASH_PREFIX NEW_RATE_LIMIT'
  puts 'Example: rails runner scripts/update_token_rate_limit.rb abc123 1000'
  exit 1
end

token_prefix = ARGV[0]
new_rate_limit = ARGV[1].to_i

if new_rate_limit <= 0
  puts 'Error: Rate limit must be a positive number'
  exit 1
end

# Find the token
token = ExportToken.find_by('token_hash LIKE ?', "#{token_prefix}%")

if token.nil?
  puts "Error: No token found with hash starting with '#{token_prefix}'"
  puts "\nAvailable tokens:"
  ExportToken.all.each do |t|
    puts "  #{t.token_hash[0..10]}... - #{t.description}"
  end
  exit 1
end

# Store old value for comparison
old_rate_limit = token.rate_limit_per_hour

# Update the rate limit in permissions
token.permissions ||= {}
token.permissions['rate_limit_per_hour'] = new_rate_limit

# Save the token
if token.save
  puts '✓ Successfully updated token rate limit'
  puts "  Token: #{token.description}"
  puts "  Hash: #{token.token_hash[0..10]}..."
  puts "  Old rate limit: #{old_rate_limit || 'unlimited'}"
  puts "  New rate limit: #{new_rate_limit} requests/hour"

  # Show current usage if any
  if token.usage_count > 0
    puts "\n  Current usage: #{token.usage_count} requests"
    puts "  Last used: #{token.last_used_at}"
  end
else
  puts 'Error: Failed to update token'
  puts token.errors.full_messages.join("\n")
  exit 1
end