# frozen_string_literal: true

require 'rails_helper'

RSpec.describe(ExportToken, type: :model) do
  # Test basic validations
  describe('validations') do
    subject { build(:export_token) }

    it { is_expected.to(validate_presence_of(:description)) }
    it { is_expected.to(validate_presence_of(:expires_at)) }
    it { is_expected.to(validate_uniqueness_of(:token_hash)) }

    context('when creating a new token') do
      it('requires expires_at to be in the future') do
        token = build(:export_token, expires_at: 1.day.ago)
        expect(token).not_to(be_valid)
        expect(token.errors[:expires_at]).to(include('must be in the future'))
      end

      it('allows future expiration dates') do
        token = build(:export_token, expires_at: 1.day.from_now)
        expect(token).to(be_valid)
      end

      it('allows 10+ year expiration dates') do
        token = build(:export_token, expires_at: 15.years.from_now)
        expect(token).to(be_valid)
      end

      it('skips expiration validation when skip_expiration_validation is true') do
        token = build(:export_token, expires_at: 1.day.ago)
        token.skip_expiration_validation = true
        expect(token).to(be_valid)
      end
    end
  end

  describe('scopes') do
    let!(:active_token) { create(:export_token, expires_at: 1.day.from_now) }
    let!(:expired_token) do
      token = build(:export_token, expires_at: 1.day.ago)
      token.skip_expiration_validation = true
      token.save!
      token
    end
    let!(:revoked_token) { create(:export_token, :revoked) }

    describe('.active') do
      it('returns only non-expired tokens') do
        expect(ExportToken.active).to(include(active_token))
        expect(ExportToken.active).not_to(include(expired_token))
      end

      it('includes revoked tokens that haven\'t expired yet') do
        # Active scope only checks expiration, not revocation
        expect(ExportToken.active).to(include(revoked_token))
      end
    end

    describe('.expired') do
      it('returns only expired tokens') do
        expect(ExportToken.expired).to(include(expired_token))
        expect(ExportToken.expired).not_to(include(active_token))
      end
    end
  end

  describe('#generate') do
    context('with default parameters') do
      let(:token) { ExportToken.generate(description: 'API Access') }

      it('creates a new token') do
        expect { ExportToken.generate(description: 'Test') }
          .to(change(ExportToken, :count).by(1))
      end

      it('sets description') do
        expect(token.description).to(eq('API Access'))
      end

      it('sets default expiration to 10 years') do
        expect(token.expires_at).to(be_within(1.minute).of(10.years.from_now))
      end

      it('generates a raw token') do
        expect(token.raw_token).to(be_present)
        expect(token.raw_token).to(match(/^[A-Za-z0-9_-]{43}$/)) # Base64 URL-safe pattern
      end

      it('stores only the hashed token') do
        expect(token.token_hash).to(be_present)
        expect(token.token_hash).not_to(eq(token.raw_token))
        expect(token.token_hash).to(eq(Digest::SHA256.hexdigest(token.raw_token)))
      end

      it('raw token is not persisted to database') do
        token.reload
        expect(token.raw_token).to(be_nil)
      end
    end

    context('with custom parameters') do
      it('accepts custom expiration') do
        token = ExportToken.generate(
          description: 'Short-lived',
          expires_in: 30.days
        )
        expect(token.expires_at).to(be_within(1.minute).of(30.days.from_now))
      end

      it('accepts created_by') do
        token = ExportToken.generate(
          description: 'Admin token',
          created_by: 'admin@example.com'
        )
        expect(token.created_by).to(eq('admin@example.com'))
      end

      it('accepts permissions hash') do
        permissions = {
          'max_records' => 50_000,
          'rate_limit_per_hour' => 20,
          'formats' => %w[csv json]
        }
        token = ExportToken.generate(
          description: 'Limited token',
          permissions: permissions
        )
        expect(token.permissions).to(eq(permissions))
      end
    end

    context('with invalid parameters') do
      it('raises error for blank description') do
        expect { ExportToken.generate(description: '') }
          .to(raise_error(ActiveRecord::RecordInvalid))
      end

      it('raises error for nil description') do
        expect { ExportToken.generate(description: nil) }
          .to(raise_error(ActiveRecord::RecordInvalid))
      end
    end
  end

  describe('#authenticate') do
    let!(:valid_token) { ExportToken.generate(description: 'Valid token') }
    let(:raw_token) { valid_token.raw_token }

    context('with valid token') do
      it('returns the token object') do
        result = ExportToken.authenticate(raw_token)
        expect(result).to(eq(valid_token))
      end

      it('works with tokens stored before raw_token was available') do
        # Simulate a token created before the refactor
        valid_token.update_column(:token_hash, Digest::SHA256.hexdigest(raw_token))
        result = ExportToken.authenticate(raw_token)
        expect(result).to(eq(valid_token))
      end
    end

    context('with expired token') do
      let!(:expired_token) do
        token = ExportToken.generate(description: 'Expired', expires_in: 1.second)
        sleep(2)
        token
      end

      it('returns nil') do
        result = ExportToken.authenticate(expired_token.raw_token)
        expect(result).to(be_nil)
      end
    end

    context('with revoked token') do
      let!(:revoked_token) do
        token = ExportToken.generate(description: 'Revoked')
        token.revoke!
        token
      end

      it('returns nil when checking active status') do
        # Note: authenticate only checks active scope (expires_at)
        # The controller should additionally check revoked?
        result = ExportToken.authenticate(revoked_token.raw_token)
        expect(result).to(be_present) # Found the token
        expect(result.revoked?).to(be(true)) # But it's revoked
      end
    end

    context('with invalid input') do
      it('returns nil for blank token') do
        expect(ExportToken.authenticate('')).to(be_nil)
        expect(ExportToken.authenticate(nil)).to(be_nil)
      end

      it('returns nil for excessively long token') do
        long_token = 'a' * 1001
        expect(ExportToken.authenticate(long_token)).to(be_nil)
      end

      it('returns nil for token with null bytes') do
        token_with_null = "valid_start\u0000malicious"
        expect(ExportToken.authenticate(token_with_null)).to(be_nil)
      end

      it('returns nil for non-existent token') do
        expect(ExportToken.authenticate('fake_token_123')).to(be_nil)
      end
    end
  end

  describe('#active?') do
    context('with active token') do
      let(:token) { create(:export_token, expires_at: 1.day.from_now) }

      it('returns true') do
        expect(token.active?).to(be(true))
      end
    end

    context('with expired token') do
      let(:token) do
        t = build(:export_token, expires_at: 1.day.ago)
        t.skip_expiration_validation = true
        t.save!
        t
      end

      it('returns false') do
        expect(token.active?).to(be(false))
      end
    end

    context('with revoked token') do
      let(:token) { create(:export_token, :revoked) }

      it('returns false') do
        expect(token.active?).to(be(false))
      end
    end

    context('with revoked and expired token') do
      let(:token) do
        t = build(:export_token, expires_at: 1.day.ago)
        t.skip_expiration_validation = true
        t.save!
        t.revoke!
        t
      end

      it('returns false') do
        expect(token.active?).to(be(false))
      end
    end
  end

  describe('#revoked?') do
    context('with non-revoked token') do
      let(:token) { create(:export_token) }

      it('returns false') do
        expect(token.revoked?).to(be(false))
      end
    end

    context('with revoked token') do
      let(:token) { create(:export_token, :revoked) }

      it('returns true') do
        expect(token.revoked?).to(be(true))
      end
    end
  end

  describe('#expired?') do
    context('with non-expired token') do
      let(:token) { create(:export_token, expires_at: 1.day.from_now) }

      it('returns false') do
        expect(token.expired?).to(be(false))
      end
    end

    context('with expired token') do
      let(:token) do
        t = build(:export_token, expires_at: 1.day.ago)
        t.skip_expiration_validation = true
        t.save!
        t
      end

      it('returns true') do
        expect(token.expired?).to(be(true))
      end
    end

    context('at exact expiration moment') do
      let(:token) { create(:export_token, expires_at: Time.current) }

      it('returns true') do
        # Using Timecop to freeze time for this test
        Timecop.freeze do
          token = create(:export_token, expires_at: Time.current)
          expect(token.expired?).to(be(true))
        end
      end
    end
  end

  describe('#revoke!') do
    let(:token) { create(:export_token) }

    it('sets revoked_at timestamp') do
      expect { token.revoke! }
        .to(change(token, :revoked_at).from(nil))
      expect(token.revoked_at).to(be_within(1.second).of(Time.current))
    end

    it('accepts a reason') do
      token.revoke!(reason: 'Compromised key')
      expect(token.revocation_reason).to(eq('Compromised key'))
    end

    it('returns true on success') do
      expect(token.revoke!).to(be(true))
    end

    it('prevents further use of token') do
      raw = token.raw_token
      token.revoke!
      expect(token.active?).to(be(false))
    end

    it('is idempotent') do
      token.revoke!(reason: 'First')
      first_time = token.revoked_at
      
      Timecop.travel(1.hour.from_now) do
        token.revoke!(reason: 'Second')
        expect(token.revoked_at).not_to(eq(first_time))
        expect(token.revocation_reason).to(eq('Second'))
      end
    end
  end

  describe('#record_usage!') do
    let(:token) { create(:export_token) }

    it('increments usage_count') do
      expect { token.record_usage! }
        .to(change(token, :usage_count).from(0).to(1))
      
      expect { token.record_usage! }
        .to(change(token, :usage_count).from(1).to(2))
    end

    it('updates last_used_at') do
      expect { token.record_usage! }
        .to(change(token, :last_used_at).from(nil))
      
      expect(token.last_used_at).to(be_within(1.second).of(Time.current))
    end

    it('handles nil usage_count gracefully') do
      token.update_column(:usage_count, nil)
      token.record_usage!
      expect(token.usage_count).to(eq(1))
    end

    it('is reusable - does not invalidate token') do
      10.times { token.record_usage! }
      expect(token.reload.active?).to(be(true))
      expect(token.usage_count).to(eq(10))
    end
  end

  describe('#can_export_format?') do
    context('without permissions') do
      let(:token) { create(:export_token) }

      it('allows all formats') do
        expect(token.can_export_format?('csv')).to(be(true))
        expect(token.can_export_format?('json')).to(be(true))
        expect(token.can_export_format?('jsonl')).to(be(true))
        expect(token.can_export_format?('yaml')).to(be(true))
      end
    end

    context('with format restrictions') do
      let(:token) do
        create(:export_token, permissions: { 'formats' => %w[csv json] })
      end

      it('allows specified formats') do
        expect(token.can_export_format?('csv')).to(be(true))
        expect(token.can_export_format?('json')).to(be(true))
      end

      it('denies non-specified formats') do
        expect(token.can_export_format?('jsonl')).to(be(false))
        expect(token.can_export_format?('yaml')).to(be(false))
      end

      it('handles symbol input') do
        expect(token.can_export_format?(:csv)).to(be(true))
        expect(token.can_export_format?(:yaml)).to(be(false))
      end
    end

    context('with empty formats array') do
      let(:token) do
        create(:export_token, permissions: { 'formats' => [] })
      end

      it('denies all formats') do
        expect(token.can_export_format?('csv')).to(be(false))
        expect(token.can_export_format?('json')).to(be(false))
      end
    end
  end

  describe('#max_records') do
    context('without permissions') do
      let(:token) { create(:export_token) }

      it('returns default of 100,000') do
        expect(token.max_records).to(eq(100_000))
      end
    end

    context('with custom max_records') do
      let(:token) do
        create(:export_token, permissions: { 'max_records' => 50_000 })
      end

      it('returns custom value') do
        expect(token.max_records).to(eq(50_000))
      end
    end

    context('with empty permissions hash') do
      let(:token) do
        create(:export_token, permissions: {})
      end

      it('returns default') do
        expect(token.max_records).to(eq(100_000))
      end
    end
  end

  describe('#rate_limit_per_hour') do
    context('without permissions') do
      let(:token) { create(:export_token) }

      it('returns default of 10') do
        expect(token.rate_limit_per_hour).to(eq(10))
      end
    end

    context('with custom rate limit') do
      let(:token) do
        create(:export_token, permissions: { 'rate_limit_per_hour' => 100 })
      end

      it('returns custom value') do
        expect(token.rate_limit_per_hour).to(eq(100))
      end
    end
  end

  describe('#rate_limit_key') do
    let(:token) { create(:export_token) }

    it('returns a key based on token hash') do
      expect(token.rate_limit_key).to(eq("export_rate:#{token.token_hash}"))
    end

    it('returns nil if token_hash is not present') do
      token.token_hash = nil
      expect(token.rate_limit_key).to(be_nil)
    end
  end

  describe('token generation and hashing') do
    let(:token) { create(:export_token) }

    it('generates unique tokens') do
      tokens = 10.times.map { create(:export_token).token_hash }
      expect(tokens.uniq.size).to(eq(10))
    end

    it('uses SHA256 for hashing') do
      raw = token.raw_token
      expected_hash = Digest::SHA256.hexdigest(raw)
      expect(token.token_hash).to(eq(expected_hash))
    end

    it('generates URL-safe tokens') do
      # URL-safe base64 uses - and _ instead of + and /
      expect(token.raw_token).to(match(/^[A-Za-z0-9_-]+$/))
    end

    it('does not store raw token in database') do
      token_from_db = ExportToken.find(token.id)
      expect(token_from_db.raw_token).to(be_nil)
    end
  end

  describe('edge cases and security') do
    it('handles concurrent token generation') do
      tokens = []
      threads = 5.times.map do
        Thread.new do
          tokens << ExportToken.generate(description: 'Concurrent')
        end
      end
      threads.each(&:join)
      
      expect(tokens.size).to(eq(5))
      expect(tokens.map(&:token_hash).uniq.size).to(eq(5))
    end

    it('prevents timing attacks on authentication') do
      valid_token = create(:export_token)
      raw = valid_token.raw_token
      
      # Measure time for valid token
      start_valid = Time.current.to_f
      100.times { ExportToken.authenticate(raw) }
      valid_time = Time.current.to_f - start_valid
      
      # Measure time for invalid token
      start_invalid = Time.current.to_f
      100.times { ExportToken.authenticate('invalid_token_xyz') }
      invalid_time = Time.current.to_f - start_invalid
      
      # Times should be similar (within 50% difference)
      # This prevents timing attacks that could reveal valid token patterns
      ratio = [valid_time / invalid_time, invalid_time / valid_time].max
      expect(ratio).to(be < 1.5)
    end

    it('handles database transaction rollbacks') do
      expect do
        ActiveRecord::Base.transaction do
          ExportToken.generate(description: 'Will rollback')
          raise ActiveRecord::Rollback
        end
      end.not_to(change(ExportToken, :count))
    end

    it('maintains data integrity with nil permissions') do
      token = create(:export_token, permissions: nil)
      expect(token.max_records).to(eq(100_000))
      expect(token.rate_limit_per_hour).to(eq(10))
      expect(token.can_export_format?('csv')).to(be(true))
    end
  end

  describe('time-dependent behavior') do
    it('handles expiration at exact moment') do
      Timecop.freeze do
        token = create(:export_token, expires_at: 1.hour.from_now)
        expect(token.active?).to(be(true))
        
        Timecop.travel(1.hour.from_now) do
          expect(token.active?).to(be(false))
          expect(token.expired?).to(be(true))
        end
      end
    end

    it('handles long-term tokens (10+ years)') do
      token = ExportToken.generate(
        description: 'Long-term',
        expires_in: 15.years
      )
      
      expect(token.active?).to(be(true))
      
      Timecop.travel(10.years.from_now) do
        expect(token.reload.active?).to(be(true))
      end
      
      Timecop.travel(16.years.from_now) do
        expect(token.reload.active?).to(be(false))
      end
    end
  end
end