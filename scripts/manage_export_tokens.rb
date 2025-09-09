#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require 'digest'
require 'json'
# Script to manage export tokens for the COVID CO2 Tracker
# Usage:
#   ruby scripts/manage_export_tokens.rb generate
#   ruby scripts/manage_export_tokens.rb validate TOKEN
#   ruby scripts/manage_export_tokens.rb hash TOKEN

require 'securerandom'

class ExportTokenManager
  TOKENS_FILE = 'config/export_tokens.json'

  def self.run(args)
    command = args[0]

    case command
    when 'generate'
      generate_token
    when 'validate'
      validate_token(args[1])
    when 'hash'
      hash_token(args[1])
    when 'list'
      list_tokens
    when 'revoke'
      revoke_token(args[1])
    else
      show_help
    end
  end

  def self.generate_token
    # Generate a secure random token
    token = SecureRandom.hex(32)
    token_hash = Digest::SHA256.hexdigest(token)

    # Load existing tokens
    tokens = load_tokens

    # Add new token with metadata
    token_entry = {
      'hash' => token_hash,
      'created_at' => DateTime.now.iso8601,
      'description' => prompt_description,
      'active' => true
    }

    tokens << token_entry
    save_tokens(tokens)

    puts "\n✓ Token generated successfully!"
    puts '=' * 60
    puts "TOKEN: #{token}"
    puts '=' * 60
    puts "\nIMPORTANT:"
    puts '1. Save this token securely - it cannot be recovered!'
    puts "2. Token hash stored in: #{TOKENS_FILE}"
    puts '3. Set in Heroku with:'
    puts "   heroku config:set EXPORT_TOKENS='#{token}' --app covid-co2-tracker"
    puts "\nFor multiple tokens, use comma-separated list:"
    puts "   heroku config:set EXPORT_TOKENS='token1,token2,token3'"
  end

  def self.validate_token(token)
    unless token
      puts '✗ Error: Please provide a token to validate'
      puts 'Usage: ruby scripts/manage_export_tokens.rb validate TOKEN'
      return
    end

    token_hash = Digest::SHA256.hexdigest(token)
    tokens = load_tokens

    matching_token = tokens.find { |t| t['hash'] == token_hash && t['active'] }

    if matching_token
      puts '✓ Token is VALID'
      puts "Created: #{matching_token['created_at']}"
      puts "Description: #{matching_token['description']}"
    else
      puts '✗ Token is INVALID or REVOKED'
    end
  end

  def self.hash_token(token)
    unless token
      puts '✗ Error: Please provide a token to hash'
      puts 'Usage: ruby scripts/manage_export_tokens.rb hash TOKEN'
      return
    end

    hash = Digest::SHA256.hexdigest(token)
    puts "Token hash: #{hash}"
  end

  def self.list_tokens
    tokens = load_tokens

    if tokens.empty?
      puts 'No tokens found'
      return
    end

    puts "\nExport Tokens:"
    puts '-' * 60

    tokens.each_with_index do |token, index|
      status = token['active'] ? '✓ Active' : '✗ Revoked'
      puts "#{index + 1}. #{status}"
      puts "   Description: #{token['description']}"
      puts "   Created: #{token['created_at']}"
      puts "   Hash: #{token['hash'][0..16]}..."
      puts ''
    end
  end

  def self.revoke_token(token)
    unless token
      puts '✗ Error: Please provide a token to revoke'
      puts 'Usage: ruby scripts/manage_export_tokens.rb revoke TOKEN'
      return
    end

    token_hash = Digest::SHA256.hexdigest(token)
    tokens = load_tokens

    matching_token = tokens.find { |t| t['hash'] == token_hash }

    if matching_token
      matching_token['active'] = false
      matching_token['revoked_at'] = DateTime.now.iso8601
      save_tokens(tokens)
      puts '✓ Token revoked successfully'
      puts 'Remember to remove it from Heroku config!'
    else
      puts '✗ Token not found'
    end
  end

  def self.show_help
    puts <<~HELP
      Export Token Manager for COVID CO2 Tracker

      Usage:
        ruby scripts/manage_export_tokens.rb COMMAND [ARGS]

      Commands:
        generate     Generate a new export token
        validate     Check if a token is valid
        hash         Generate SHA256 hash of a token
        list         List all tokens (shows partial hashes)
        revoke       Revoke an existing token

      Examples:
        ruby scripts/manage_export_tokens.rb generate
        ruby scripts/manage_export_tokens.rb validate abc123...
        ruby scripts/manage_export_tokens.rb hash abc123...
        ruby scripts/manage_export_tokens.rb list
        ruby scripts/manage_export_tokens.rb revoke abc123...

      Security Notes:
        - Tokens are stored as SHA256 hashes
        - Original tokens cannot be recovered from hashes
        - Keep generated tokens in a secure location
        - Rotate tokens periodically for security
    HELP
  end


  def self.load_tokens
    return [] unless File.exist?(TOKENS_FILE)

    JSON.parse(File.read(TOKENS_FILE))
  rescue JSON::ParserError
    puts '⚠  Warning: Corrupted tokens file, starting fresh'
    []
  end

  def self.save_tokens(tokens)
    File.write(TOKENS_FILE, JSON.pretty_generate(tokens))
  end

  def self.prompt_description
    print "Enter token description (e.g., 'Production API Access'): "
    gets.chomp
  end
end

# Run the script
ExportTokenManager.run(ARGV) if __FILE__ == $PROGRAM_NAME