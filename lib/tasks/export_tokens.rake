# frozen_string_literal: true

namespace :export do
  desc 'Generate a new export token with description'
  task generate: :environment do
    # Prompt for description
    print 'Enter description for this token: '
    description = STDIN.gets.strip

    if description.blank?
      puts '✗ Error: Description cannot be blank'
      exit 1
    end

    # Prompt for expiration period
    puts "\nSelect expiration period:"
    puts '  1. 30 days (default)'
    puts '  2. 90 days'
    puts '  3. 1 year'
    puts '  4. Custom (enter days)'
    print 'Choice [1-4]: '
    choice = STDIN.gets.strip

    days = case choice
           when '2' then 90
           when '3' then 365
           when '4'
             print 'Enter number of days: '
             custom_days = STDIN.gets.strip.to_i
             if custom_days <= 0
               puts '✗ Error: Invalid number of days'
               exit 1
             end
             custom_days
           else
             30
           end

    expires_at = Time.current + days.days

    # Optional: Set permissions
    print "\nSet custom permissions? (y/N): "
    custom_response = STDIN.gets.strip.downcase
    permissions = {}
    
    if custom_response == 'y'
      print 'Max records (default 100000): '
      max_records_input = STDIN.gets.strip
      permissions['max_records'] = max_records_input.present? ? max_records_input.to_i : 100_000

      print 'Rate limit per hour (default 10): '
      rate_limit_input = STDIN.gets.strip
      permissions['rate_limit_per_hour'] = rate_limit_input.present? ? rate_limit_input.to_i : 10

      print 'Allowed formats (comma-separated, e.g., json,csv): '
      formats_input = STDIN.gets.strip
      permissions['formats'] = formats_input.present? ? formats_input.split(',').map(&:strip) : %w[csv jsonl json yaml multi_csv]
    else
      # Set default permissions
      permissions = {
        'max_records' => 100_000,
        'rate_limit_per_hour' => 10,
        'formats' => %w[csv jsonl json yaml multi_csv]
      }
    end

    # Create the token
    token = ExportToken.new(
      description: description,
      expires_at: expires_at,
      permissions: permissions.presence
    )

    if token.save
      puts "\n#{'═' * 60}"
      puts '✓ Export token successfully created!'
      puts('═' * 60)
      puts "\nToken Details:"
      puts "  Description: #{token.description}"
      puts "  Expires: #{token.expires_at.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      puts "  Expires in: #{days} days"

      if token.permissions.present?
        puts "\nPermissions:"
        puts "  Max records: #{token.max_records}"
        puts "  Rate limit: #{token.rate_limit_per_hour} requests/hour"
        if token.permissions['formats'].present?
          puts "  Formats: #{token.permissions['formats'].join(', ')}"
        end
      end

      puts "\n#{'─' * 60}"
      puts '⚠ IMPORTANT: Copy this token now! It cannot be retrieved later:'
      puts('─' * 60)
      puts "\n#{token.raw_token}\n"
      puts('─' * 60)
      puts "\nUsage example:"
      puts "  curl -H 'Authorization: Bearer #{token.raw_token}' \\"
      puts '       https://your-app.com/api/v1/export'
      puts('═' * 60)
    else
      puts "\n✗ Error creating token:"
      token.errors.full_messages.each do |message|
        puts "  • #{message}"
      end
      exit 1
    end
  rescue StandardError => e
    puts "\n✗ Unexpected error: #{e.message}"
    puts e.backtrace.first(5).join("\n") if Rails.env.development?
    exit 1
  end

  desc 'List all active export tokens'
  task list: :environment do
    active_tokens = ExportToken.active.order(created_at: :desc)

    if active_tokens.empty?
      puts "\n✗ No active export tokens found"
      puts "\nRun 'rails export:generate' to create a new token"
      exit 0
    end

    puts "\n#{'═' * 80}"
    puts ' Active Export Tokens'
    puts('═' * 80)
    puts 'Description                    Created              Usage      Last Used  Status  '
    puts('─' * 80)

    active_tokens.each do |token|
      # Show only first 8 chars of token hash for identification
      token_preview = "#{token.token_hash[0..7]}..." if token.token_hash.present?

      # Format dates
      created = token.created_at.strftime('%Y-%m-%d')
      last_used = token.last_used_at&.strftime('%Y-%m-%d') || 'Never'

      # Calculate days until expiration
      days_left = ((token.expires_at - Time.current) / 1.day).ceil
      status = if days_left <= 7
                 "⚠ #{days_left}d"
               else
                 "✓ #{days_left}d"
               end

      puts format('%-30s %-20s %-10s %-10s %-8s',
                  token.description.truncate(30),
                  created,
                  token.usage_count.to_s,
                  last_used,
                  status)

      # Show additional details if verbose
      next unless ENV['VERBOSE'] == 'true'

      puts "  Token ID: #{token_preview}"
      puts "  Expires: #{token.expires_at.strftime('%Y-%m-%d %H:%M:%S')}"
      if token.permissions.present?
        puts "  Permissions: max_records=#{token.max_records}, " \
             "rate_limit=#{token.rate_limit_per_hour}/hr"
      end
      puts ''
    end

    puts('─' * 80)
    puts "Total active tokens: #{active_tokens.count}"

    # Also show expired tokens count
    expired_count = ExportToken.expired.count
    if expired_count.positive?
      puts "Expired tokens: #{expired_count} (run 'rails export:cleanup' to remove)"
    end

    puts "\nTip: Use VERBOSE=true rails export:list for more details"
    puts('═' * 80)
  rescue StandardError => e
    puts "\n✗ Error listing tokens: #{e.message}"
    puts e.backtrace.first(5).join("\n") if Rails.env.development?
    exit 1
  end

  desc 'Revoke a compromised token'
  task :revoke, [:token] => :environment do |_t, args|
    if args[:token].blank?
      puts "\n✗ Error: Please provide a token to revoke"
      puts 'Usage: rails export:revoke[token_value]'
      puts '   or: rails export:revoke TOKEN=token_value'
      exit 1
    end

    token_value = args[:token] || ENV.fetch('TOKEN', nil)

    # Try to authenticate with the token to find it
    token = ExportToken.authenticate(token_value)

    if token.nil?
      # Try to find by partial hash match (for admin convenience)
      if token_value.length >= 8
        partial_hash = token_value[0..7]
        tokens = ExportToken.where('token_hash LIKE ?', "#{partial_hash}%")

        if tokens.one?
          token = tokens.first
          puts "✓ Found token by partial hash: #{token.description}"
        elsif tokens.many?
          puts "\n✗ Error: Multiple tokens match that partial hash"
          puts 'Matching tokens:'
          tokens.each do |t|
            puts "  • #{t.description} (#{t.token_hash[0..15]}...)"
          end
          exit 1
        else
          puts "\n✗ Error: Token not found or already expired"
          exit 1
        end
      else
        puts "\n✗ Error: Token not found or already expired"
        exit 1
      end
    end

    # Display token details
    puts "\n#{'─' * 60}"
    puts 'Token to revoke:'
    puts "  Description: #{token.description}"
    puts "  Created: #{token.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    puts "  Usage count: #{token.usage_count}"
    puts "  Last used: #{token.last_used_at&.strftime('%Y-%m-%d %H:%M:%S') || 'Never'}"
    puts "  Expires: #{token.expires_at.strftime('%Y-%m-%d %H:%M:%S')}"
    puts('─' * 60)

    # Confirmation prompt
    print "\n⚠ Are you sure you want to revoke this token? (yes/no): "
    confirmation = STDIN.gets.strip.downcase

    unless %w[yes y].include?(confirmation)
      puts "\n✗ Revocation cancelled"
      exit 0
    end

    # Revoke by setting expiration to now
    token.update!(expires_at: Time.current)

    puts "\n✓ Token successfully revoked!"
    puts '  The token is now expired and cannot be used for authentication.'

    # Log the revocation for audit purposes
    Rails.logger.info("Export token revoked: #{token.description} (ID: #{token.id})")
  rescue ActiveRecord::RecordInvalid => e
    puts "\n✗ Error revoking token: #{e.message}"
    exit 1
  rescue StandardError => e
    puts "\n✗ Unexpected error: #{e.message}"
    puts e.backtrace.first(5).join("\n") if Rails.env.development?
    exit 1
  end

  desc 'Remove old expired tokens'
  task cleanup: :environment do
    expired_tokens = ExportToken.expired
    count = expired_tokens.count

    if count.zero?
      puts "\n✓ No expired tokens to clean up"
      exit 0
    end

    # Show what will be deleted
    puts "\n#{'═' * 60}"
    puts ' Expired Tokens to Remove'
    puts('═' * 60)

    expired_tokens.order(expires_at: :desc).limit(20).each do |token|
      expired_days = ((Time.current - token.expires_at) / 1.day).ceil
      puts format('  • %-30s (expired %d days ago, used %d times)',
                  token.description.truncate(30),
                  expired_days,
                  token.usage_count)
    end

    if count > 20
      puts "  ... and #{count - 20} more"
    end

    puts('─' * 60)
    puts "Total expired tokens: #{count}"
    puts('─' * 60)

    # Confirmation prompt
    print "\n⚠ Remove all #{count} expired tokens? (yes/no): "
    confirmation = STDIN.gets.strip.downcase

    unless %w[yes y].include?(confirmation)
      puts "\n✗ Cleanup cancelled"
      exit 0
    end

    # Perform the cleanup
    print "\nRemoving expired tokens..."

    # Delete in batches to avoid timeout on large datasets
    deleted_count = 0
    expired_tokens.find_in_batches(batch_size: 100) do |batch|
      batch_ids = batch.map(&:id)
      ExportToken.where(id: batch_ids).destroy_all
      deleted_count += batch.size
      print '.'
    end

    puts "\n\n✓ Successfully removed #{deleted_count} expired tokens"

    # Show summary
    active_count = ExportToken.active.count
    puts "\nCurrent status:"
    puts "  • Active tokens: #{active_count}"
    puts "  • Total tokens: #{ExportToken.count}"

    # Log the cleanup for audit purposes
    Rails.logger.info("Export token cleanup: removed #{deleted_count} expired tokens")
  rescue StandardError => e
    puts "\n✗ Error during cleanup: #{e.message}"
    puts e.backtrace.first(5).join("\n") if Rails.env.development?
    exit 1
  end

  desc 'Show detailed information about a specific token'
  task :info, [:token] => :environment do |_t, args|
    if args[:token].blank?
      puts "\n✗ Error: Please provide a token"
      puts 'Usage: rails export:info[token_value]'
      exit 1
    end

    token_value = args[:token]

    # Try to authenticate with the token
    token = ExportToken.authenticate(token_value)

    if token.nil?
      puts "\n✗ Error: Token not found, invalid, or expired"
      exit 1
    end

    # Display comprehensive token information
    puts "\n#{'═' * 60}"
    puts ' Export Token Information'
    puts('═' * 60)

    puts "\nBasic Information:"
    puts "  Description: #{token.description}"
    puts "  Token Hash: #{token.token_hash[0..15]}..." if token.token_hash.present?
    puts "  Created: #{token.created_at.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    puts "  Expires: #{token.expires_at.strftime('%Y-%m-%d %H:%M:%S %Z')}"

    # Calculate time remaining
    if token.active?
      time_left = token.expires_at - Time.current
      days_left = (time_left / 1.day).floor
      hours_left = ((time_left % 1.day) / 1.hour).floor
      puts "  Status: ✓ Active (#{days_left} days, #{hours_left} hours remaining)"
    else
      puts '  Status: ✗ Expired'
    end

    puts "\nUsage Statistics:"
    puts "  Total uses: #{token.usage_count || 0}"
    if token.last_used_at.present?
      puts "  Last used: #{token.last_used_at.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      time_ago = time_ago_in_words(token.last_used_at)
      puts "  Time since last use: #{time_ago} ago"
    else
      puts '  Last used: Never'
    end

    puts "\nPermissions:"
    if token.permissions.blank?
      puts '  Default permissions (no restrictions)'
    else
      puts "  Max records: #{token.max_records}"
      puts "  Rate limit: #{token.rate_limit_per_hour} requests per hour"
      if token.permissions['formats'].present?
        puts "  Allowed formats: #{token.permissions['formats'].join(', ')}"
      else
        puts '  Allowed formats: All'
      end
    end

    puts('═' * 60)
  rescue StandardError => e
    puts "\n✗ Error: #{e.message}"
    puts e.backtrace.first(5).join("\n") if Rails.env.development?
    exit 1
  end

  # Helper method for time formatting
  def time_ago_in_words(time)
    return '' if time.nil?

    seconds = Time.current - time
    case seconds
    when 0..59
      "#{seconds.to_i} seconds"
    when 60..3599
      "#{(seconds / 60).to_i} minutes"
    when 3600..86_399
      "#{(seconds / 3600).to_i} hours"
    else
      "#{(seconds / 86_400).to_i} days"
    end
  end
end