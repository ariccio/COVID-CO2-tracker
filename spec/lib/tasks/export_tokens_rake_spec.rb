# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe('export rake tasks', type: :task) do
  before do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    # Clear any existing tokens
    ExportToken.destroy_all
    # Suppress ALL output and input to prevent interactive prompts
    @original_stdout = $stdout
    @original_stdin = $stdin
    $stdout = StringIO.new
    $stdin = StringIO.new
  end
  
  after do
    # Restore original stdout and stdin
    $stdout = @original_stdout
    $stdin = @original_stdin
  end

  describe('export:generate') do
    let(:task) { Rake::Task['export:generate'] }

    before do
      task.reenable
    end

    context('with valid input') do
      it('creates a new token with description') do
        # Set up input in the StringIO
        $stdin.puts("Test Token")     # Description
        $stdin.puts("1")              # Choice (30 days)
        $stdin.puts("n")              # No custom permissions
        $stdin.rewind                 # Reset to beginning for reading

        expect { task.invoke }.to change(ExportToken, :count).by(1)

        token = ExportToken.last
        expect(token.description).to(eq('Test Token'))
        expect(token.expires_at).to(be_within(1.minute).of(30.days.from_now))
      end

      it('creates token with custom expiration') do
        allow(STDIN).to receive(:gets).and_return(
          "Custom Expiry Token\n",
          "4\n",              # Custom days
          "365\n",            # 365 days
          "n\n"               # No custom permissions
        )

        expect { task.invoke }
          .to(change(ExportToken, :count).by(1))

        token = ExportToken.last
        expect(token.expires_at).to(be_within(1.minute).of(365.days.from_now))
      end

      it('creates token with custom permissions') do
        allow(STDIN).to receive(:gets).and_return(
          "Permission Token\n",
          "1\n",              # 30 days
          "y\n",              # Yes to custom permissions
          "50000\n",          # Max records
          "100\n",            # Rate limit
          "csv,json\n"        # Allowed formats
        )

        expect { task.invoke }
          .to(change(ExportToken, :count).by(1))

        token = ExportToken.last
        expect(token.permissions['max_records']).to(eq(50_000))
        expect(token.permissions['rate_limit_per_hour']).to(eq(100))
        expect(token.permissions['formats']).to(eq(%w[csv json]))
      end

      it('displays the raw token') do
        allow(STDIN).to receive(:gets).and_return(
          "Display Token\n",
          "1\n",
          "n\n"
        )

        # Capture output and check for token pattern
        output = capture_stdout { task.invoke }

        expect(output).to include('IMPORTANT: Copy this token now')
        # The raw token should be in the output (Base64 URL-safe pattern)
        expect(output).to match(/[A-Za-z0-9_-]{43}/)

        token = ExportToken.last
        expect(token.description).to eq('Display Token')
      end

      it('shows usage example') do
        allow(STDIN).to receive(:gets).and_return(
          "Example Token\n",
          "1\n",
          "n\n"
        )

        output = capture_stdout { task.invoke }
        expect(output).to(include('curl -H \'Authorization: Bearer'))
        expect(output).to(include('https://your-app.com/api/v1/export'))
      end
    end

    context('with invalid input') do
      it('rejects blank description') do
        allow(STDIN).to receive(:gets).and_return(
          "\n", # Blank description
          "1\n",
          "n\n"
        )

        expect { task.invoke }
          .to(output(/Description cannot be blank/).to_stdout)
          .and(raise_error(SystemExit))
      end

      it('rejects invalid number of days') do
        allow(STDIN).to receive(:gets).and_return(
          "Invalid Days Token\n",
          "4\n",              # Custom days
          "0\n"               # Invalid: 0 days
        )

        expect { task.invoke }
          .to(output(/Invalid number of days/).to_stdout)
          .and(raise_error(SystemExit))
      end

      it('handles negative days') do
        allow(STDIN).to receive(:gets).and_return(
          "Negative Days Token\n",
          "4\n",              # Custom days
          "-10\n"             # Invalid: negative days
        )

        expect { task.invoke }
          .to(output(/Invalid number of days/).to_stdout)
          .and(raise_error(SystemExit))
      end
    end

    context('with different expiration choices') do
      it('creates 30-day token (default)') do
        allow(STDIN).to receive(:gets).and_return(
          "30 Day Token\n",
          "1\n",
          "n\n"
        )

        task.invoke
        token = ExportToken.last
        expect(token.expires_at).to(be_within(1.minute).of(30.days.from_now))
      end

      it('creates 90-day token') do
        allow(STDIN).to receive(:gets).and_return(
          "90 Day Token\n",
          "2\n",
          "n\n"
        )

        task.invoke
        token = ExportToken.last
        expect(token.expires_at).to(be_within(1.minute).of(90.days.from_now))
      end

      it('creates 1-year token') do
        allow(STDIN).to receive(:gets).and_return(
          "1 Year Token\n",
          "3\n",
          "n\n"
        )

        task.invoke
        token = ExportToken.last
        expect(token.expires_at).to(be_within(1.minute).of(365.days.from_now))
      end
    end
  end

  describe('export:list') do
    let(:task) { Rake::Task['export:list'] }

    before do
      task.reenable
    end

    context('with no tokens') do
      it('shows no tokens message') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('No active export tokens found'))
        expect(output).to(include('rails export:generate'))
      end
    end

    context('with active tokens') do
      # rubocop:disable RSpec/LetSetup
      # These tokens are needed to populate the database for the list task
      let!(:active_token) { create(:export_token, description: 'API Token 1', usage_count: 5) }
      let!(:expiring_token) { create(:export_token, :expiring_soon, description: 'API Token 2') }
      # rubocop:enable RSpec/LetSetup
      let!(:expired_token) { create(:export_token, :expired) }

      it('lists active tokens') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('Active Export Tokens'))
        expect(output).to(include('API Token 1'))
        expect(output).to(include('API Token 2'))
        expect(output).not_to(include(expired_token.description))
      end

      it('shows usage count') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('5')) # Usage count for active_token
      end

      it('warns about expiring soon tokens') do
        output = capture_stdout { task.invoke }
        # Token expiring in 1 hour should show warning
        expect(output).to(match(/⚠\s+\d+d/))
      end

      it('shows expired tokens count') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('Expired tokens: 1'))
        expect(output).to(include('rails export:cleanup'))
      end

      it('shows verbose output when VERBOSE=true') do
        ENV['VERBOSE'] = 'true'
        output = capture_stdout { task.invoke }
        expect(output).to(include('Token ID:'))
        expect(output).to(include('Permissions:'))
        ENV.delete('VERBOSE')
      end
    end

    context('with used tokens') do
      let(:used_token) do
        create(:export_token, :used, description: 'Frequently Used')
      end

      it('shows last used date') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('Frequently Used'))
        # Should show a date in the Last Used column
        expect(output).to(match(/\d{4}-\d{2}-\d{2}/))
      end
    end
  end

  describe('export:revoke') do
    let(:task) { Rake::Task['export:revoke'] }
    let!(:token) { ExportToken.generate(description: 'Token to Revoke') }

    before do
      task.reenable
    end

    context('with valid token') do
      it('revokes the token with confirmation') do
        allow(STDIN).to receive(:gets).and_return("yes\n")

        expect { task.invoke(token.raw_token) }
          .to(output(/Token successfully revoked/).to_stdout)

        # NOTE: The rake task uses expires_at to revoke, not revoked_at
        expect(token.reload.expires_at).to(be <= Time.current)
      end

      it('shows token details before revocation') do
        allow(STDIN).to receive(:gets).and_return("yes\n")

        output = capture_stdout { task.invoke(token.raw_token) }
        expect(output).to(include('Token to revoke:'))
        expect(output).to(include('Token to Revoke'))
        expect(output).to(include('Usage count:'))
      end

      it('cancels revocation with no confirmation') do
        allow(STDIN).to receive(:gets).and_return("no\n")

        expect { task.invoke(token.raw_token) }
          .to(output(/Revocation cancelled/).to_stdout)

        expect(token.reload.active?).to(be(true))
      end

      it('finds token by partial hash') do
        allow(STDIN).to receive(:gets).and_return("yes\n")

        # Use first 8 characters of hash
        partial_hash = token.token_hash[0..7]

        output = capture_stdout { task.invoke(partial_hash) }
        expect(output).to(include('Found token by partial hash'))
        expect(output).to(include('Token successfully revoked'))
      end
    end

    context('with invalid token') do
      it('shows error for non-existent token') do
        expect { task.invoke('invalid_token_xyz') }
          .to(output(/Token not found or already expired/).to_stdout)
          .and(raise_error(SystemExit))
      end

      it('shows error when no token provided') do
        expect { task.invoke }
          .to(output(/Please provide a token to revoke/).to_stdout)
          .and(raise_error(SystemExit))
      end

      it('handles multiple matches for partial hash') do
        # Create another token with similar hash beginning
        create(:export_token, description: 'Another Token')

        # Mock to make hashes similar
        another_token = ExportToken.new
        allow(another_token).to receive(:token_hash).and_return(token.token_hash)
        allow(ExportToken).to receive(:active).and_return([token, another_token])

        expect { task.invoke(token.token_hash[0..7]) }
          .to(output(/Multiple tokens match that partial hash/).to_stdout)
          .and(raise_error(SystemExit))
      end
    end

    context('with already expired token') do
      let(:expired_token) { create(:export_token, :expired) }

      it('cannot find expired token') do
        # Generate a token and let it expire
        temp_token = ExportToken.generate(description: 'Will Expire', expires_in: 1.second)
        raw = temp_token.raw_token
        sleep(2)

        expect { task.invoke(raw) }
          .to(output(/Token not found or already expired/).to_stdout)
          .and(raise_error(SystemExit))
      end
    end
  end

  describe('export:cleanup') do
    let(:task) { Rake::Task['export:cleanup'] }

    before do
      task.reenable
    end

    context('with no expired tokens') do
      let(:active_token) { create(:export_token) }

      it('shows no tokens to clean') do
        output = capture_stdout { task.invoke }
        expect(output).to(include('No expired tokens to clean up'))
      end
    end

    context('with expired tokens') do
      # rubocop:disable RSpec/LetSetup
      # These tokens are needed to test the cleanup task
      let!(:first_expired_token) { create(:export_token, :expired, description: 'Old Token 1') }
      let!(:second_expired_token) { create(:export_token, :expired, description: 'Old Token 2') }
      let!(:active_token) { create(:export_token, description: 'Active Token') }
      # rubocop:enable RSpec/LetSetup

      it('lists expired tokens') do
        allow(STDIN).to receive(:gets).and_return("no\n")

        output = capture_stdout { task.invoke }
        expect(output).to(include('Expired Tokens to Remove'))
        expect(output).to(include('Old Token 1'))
        expect(output).to(include('Old Token 2'))
        expect(output).not_to(include('Active Token'))
      end

      it('removes expired tokens with confirmation') do
        allow(STDIN).to receive(:gets).and_return("yes\n")

        expect { task.invoke }
          .to(change(ExportToken, :count).by(-2))
          .and(output(/Successfully removed 2 expired tokens/).to_stdout)

        expect(ExportToken.expired.count).to(eq(0))
        expect(ExportToken.active.count).to(eq(1))
      end

      it('cancels cleanup without confirmation') do
        allow(STDIN).to receive(:gets).and_return("no\n")

        expect { task.invoke }
          .not_to(change(ExportToken, :count))
          .and(output(/Cleanup cancelled/).to_stdout)
      end

      it('shows summary after cleanup') do
        allow(STDIN).to receive(:gets).and_return("yes\n")

        output = capture_stdout { task.invoke }
        expect(output).to(include('Current status:'))
        expect(output).to(include('Active tokens: 1'))
      end

      it('handles large number of expired tokens') do
        # Create many expired tokens
        25.times do |i|
          create(:export_token, :expired, description: "Expired #{i}")
        end

        allow(STDIN).to receive(:gets).and_return("yes\n")

        output = capture_stdout { task.invoke }
        expect(output).to(include('... and 7 more')) # Shows truncation message

        expect do
          task.reenable
 task.invoke
        end
          .to(change(ExportToken, :count))
      end
    end
  end

  describe('export:info') do
    let(:task) { Rake::Task['export:info'] }
    let!(:token) { ExportToken.generate(description: 'Info Test Token') }

    before do
      task.reenable
    end

    context('with valid token') do
      it('shows comprehensive token information') do
        output = capture_stdout { task.invoke(token.raw_token) }

        expect(output).to(include('Export Token Information'))
        expect(output).to(include('Info Test Token'))
        expect(output).to(include('Basic Information:'))
        expect(output).to(include('Usage Statistics:'))
        expect(output).to(include('Permissions:'))
      end

      it('shows active status for valid tokens') do
        output = capture_stdout { task.invoke(token.raw_token) }
        expect(output).to(include('✓ Active'))
        expect(output).to(match(/\d+ days, \d+ hours remaining/))
      end

      it('shows usage statistics') do
        token.record_usage!
        token.record_usage!

        output = capture_stdout { task.invoke(token.raw_token) }
        expect(output).to(include('Total uses: 2'))
        expect(output).to(include('Last used:'))
      end

      it('shows custom permissions') do
        custom_token = ExportToken.generate(
          description: 'Custom',
          permissions: {
            'max_records' => 5000,
            'rate_limit_per_hour' => 50,
            'formats' => %w[csv]
          }
        )

        output = capture_stdout { task.invoke(custom_token.raw_token) }
        expect(output).to(include('Max records: 5000'))
        expect(output).to(include('Rate limit: 50'))
        expect(output).to(include('Allowed formats: csv'))
      end
    end

    context('with expired token') do
      it('shows expired status') do
        expired_token = ExportToken.generate(description: 'Expired', expires_in: 1.second)
        raw = expired_token.raw_token
        sleep(2)

        output = capture_stdout { task.invoke(raw) }
        expect(output).to(include('✗ Expired'))
      end
    end

    context('with invalid input') do
      it('shows error for missing token') do
        expect { task.invoke }
          .to(output(/Please provide a token/).to_stdout)
          .and(raise_error(SystemExit))
      end

      it('shows error for invalid token') do
        expect { task.invoke('fake_token') }
          .to(output(/Token not found, invalid, or expired/).to_stdout)
          .and(raise_error(SystemExit))
      end
    end
  end

  # Helper method to capture stdout
  def capture_stdout
    original_stdout = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original_stdout
  end
end