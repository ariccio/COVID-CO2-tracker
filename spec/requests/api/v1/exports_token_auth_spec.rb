# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('API::V1::Exports Token Authentication', type: :request) do
  # Disable transactional fixtures for export tests
  self.use_transactional_tests = false

  after do
    DatabaseCleaner.clean_with(:truncation)
  end

  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user:, serial: 'TEST123') }
  let(:place) { create(:place, google_place_id: 'test_place_id') }
  let(:sub_location) { create(:sub_location, place:) }

  before do
    # Create test measurements
    create_list(:measurement, 5, device:, sub_location:)
  end

  describe('Token authentication') do
    context('with valid non-expired token') do
      let(:token) { ExportToken.generate(description: 'Test API Access') }
      let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

      it('authenticates successfully') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:ok))
      end

      it('records token usage') do
        expect { get('/api/v1/export', params: { format_type: 'json' }, headers:) }
          .to(change { token.reload.usage_count }.from(0).to(1))
          .and(change { token.reload.last_used_at }.from(nil))
      end

      it('allows multiple uses of the same token') do
        5.times do
          get('/api/v1/export', params: { format_type: 'json' }, headers:)
          expect(response).to(have_http_status(:ok))
        end
        expect(token.reload.usage_count).to(eq(5))
      end

      it('works with 10+ year expiration tokens') do
        long_token = ExportToken.generate(
          description: 'Long-term token',
          expires_in: 15.years
        )
        headers = { 'Authorization' => "Bearer #{long_token.raw_token}" }
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:ok))
      end
    end

    context('with expired token') do
      let(:token) do
        t = ExportToken.generate(description: 'Expired', expires_in: 1.second)
        sleep(2)
        t
      end
      let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

      it('returns unauthorized') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(include('Invalid or expired token'))
      end

      it('does not record usage') do
        expect { get('/api/v1/export', params: { format_type: 'json' }, headers:) }
          .not_to(change { token.reload.usage_count })
      end
    end

    context('with revoked token') do
      let(:token) do
        t = ExportToken.generate(description: 'Will be revoked')
        t.revoke!(reason: 'Security breach')
        t
      end
      let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

      it('returns unauthorized after revocation') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        
        # The authenticate method finds the token but it should be rejected as revoked
        # This depends on controller implementation checking revoked? status
        expect(response).to(have_http_status(:unauthorized))
      end

      it('does not allow access even if not expired') do
        expect(token.expires_at).to(be > Time.current) # Still valid expiration
        expect(token.revoked?).to(be(true)) # But revoked
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:unauthorized))
      end
    end

    context('without authorization header') do
      it('returns unauthorized') do
        get('/api/v1/export', params: { format_type: 'json' })
        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(include('Invalid or expired token'))
      end
    end

    context('with malformed authorization header') do
      it('handles missing Bearer prefix') do
        token = ExportToken.generate(description: 'Test')
        headers = { 'Authorization' => token.raw_token }
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:ok)) # Should still work
      end

      it('rejects invalid tokens') do
        headers = { 'Authorization' => 'Bearer invalid_token_123' }
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:unauthorized))
      end

      it('rejects tokens with null bytes') do
        headers = { 'Authorization' => "Bearer valid_start\u0000malicious" }
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:unauthorized))
      end

      it('rejects excessively long tokens') do
        headers = { 'Authorization' => "Bearer #{'a' * 1001}" }
        
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:unauthorized))
      end
    end
  end

  describe('Permission-based authorization') do
    context('with format restrictions') do
      let(:csv_only_token) do
        ExportToken.generate(
          description: 'CSV only',
          permissions: { 'formats' => ['csv'] }
        )
      end
      let(:headers) { { 'Authorization' => "Bearer #{csv_only_token.raw_token}" } }

      it('allows permitted formats') do
        get('/api/v1/export', params: { format_type: 'csv' }, headers:)
        expect(response).to(have_http_status(:ok))
      end

      it('denies non-permitted formats') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:forbidden))
        expect(response.parsed_body['error']).to(include('not authorized for format'))
      end
    end

    context('with record limits') do
      let(:limited_token) do
        ExportToken.generate(
          description: 'Limited records',
          permissions: { 'max_records' => 2 }
        )
      end
      let(:headers) { { 'Authorization' => "Bearer #{limited_token.raw_token}" } }

      it('respects max_records limit in JSON') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        
        data = response.parsed_body
        # Should return only 2 records despite having 5 in database
        expect(data['measurements'].size).to(be <= 2)
      end
    end
  end

  describe('Rate limiting') do
    let(:token) do
      ExportToken.generate(
        description: 'Rate limited',
        permissions: { 'rate_limit_per_hour' => 3 }
      )
    end
    let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

    before do
      # Use memory store for rate limiting tests
      memory_store = ActiveSupport::Cache::MemoryStore.new
      allow(Rails).to receive(:cache).and_return(memory_store)
    end

    it('allows requests up to the limit') do
      3.times do |i|
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:ok), "Request #{i + 1} should succeed")
      end
    end

    it('blocks requests over the limit') do
      3.times do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
      end
      
      # 4th request should be blocked
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:too_many_requests))
      expect(response.parsed_body['error']).to(include('Rate limit exceeded'))
    end

    it('includes rate limit headers') do
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      
      expect(response.headers['X-RateLimit-Limit']).to(eq('3'))
      expect(response.headers['X-RateLimit-Remaining']).to(eq('2'))
      expect(response.headers['X-RateLimit-Reset']).to(be_present)
    end

    it('resets after the time window') do
      # Make 3 requests to hit the limit
      3.times do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
      end
      
      # Should be blocked
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:too_many_requests))
      
      # Travel forward in time
      Timecop.travel(2.hours.from_now) do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
        expect(response).to(have_http_status(:ok))
      end
    end

    it('tracks rate limits per token') do
      # Create another token
      other_token = ExportToken.generate(
        description: 'Another token',
        permissions: { 'rate_limit_per_hour' => 5 }
      )
      other_headers = { 'Authorization' => "Bearer #{other_token.raw_token}" }
      
      # Use up first token's limit
      3.times do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)
      end
      
      # First token should be blocked
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:too_many_requests))
      
      # Other token should still work
      get('/api/v1/export', params: { format_type: 'json' }, headers: other_headers)
      expect(response).to(have_http_status(:ok))
    end
  end

  describe('Data privacy') do
    context('email addresses in exports') do
      let(:token) { ExportToken.generate(description: 'Privacy test') }
      let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

      before do
        # Ensure we have users with email addresses
        user.update!(email: 'private@example.com')
      end

      it('does not include email addresses in CSV export') do
        get('/api/v1/export', params: { format_type: 'csv', fields: 'all' }, headers:)
        
        expect(response.body).not_to(include('private@example.com'))
        expect(response.body).not_to(include(user.email))
      end

      it('does not include email addresses in JSON export') do
        get('/api/v1/export', params: { format_type: 'json', fields: 'all' }, headers:)
        
        data = response.parsed_body
        measurements_json = data['measurements'].to_json
        expect(measurements_json).not_to(include('private@example.com'))
        expect(measurements_json).not_to(include(user.email))
      end

      it('includes user names when requested') do
        get('/api/v1/export', params: { format_type: 'json', fields: 'user_name' }, headers:)
        
        data = response.parsed_body
        expect(data['measurements'].first).to(have_key('user_name'))
        expect(data['measurements'].first['user_name']).to(eq('Test User'))
      end

      it('does not expose email in multi-CSV export') do
        get('/api/v1/export', params: { format_type: 'multi_csv' }, headers:)
        
        expect(response).to(have_http_status(:ok))
        
        # Check ZIP contents
        Zip::File.open_buffer(response.body) do |zip|
          zip.entries.each do |entry|
            content = entry.get_input_stream.read
            expect(content).not_to(include('private@example.com'))
          end
        end
      end
    end
  end

  describe('Token lifecycle') do
    it('handles token creation to usage flow') do
      # Generate a new token
      token = ExportToken.generate(
        description: 'Full lifecycle test',
        expires_in: 1.day
      )
      
      expect(token.raw_token).to(be_present)
      expect(token.usage_count).to(eq(0))
      
      # Use the token
      headers = { 'Authorization' => "Bearer #{token.raw_token}" }
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      
      expect(response).to(have_http_status(:ok))
      expect(token.reload.usage_count).to(eq(1))
      
      # Revoke the token
      token.revoke!(reason: 'Test complete')
      
      # Should no longer work
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:unauthorized))
    end

    it('handles token expiration gracefully') do
      token = ExportToken.generate(
        description: 'Expiration test',
        expires_in: 2.seconds
      )
      
      headers = { 'Authorization' => "Bearer #{token.raw_token}" }
      
      # Should work initially
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:ok))
      
      # Wait for expiration
      sleep(3)
      
      # Should no longer work
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      expect(response).to(have_http_status(:unauthorized))
    end
  end

  describe('CORS and OPTIONS handling') do
    context('OPTIONS request') do
      it('responds to preflight requests without authentication') do
        options('/api/v1/export')
        expect(response).to(have_http_status(:ok))
      end

      it('does not require token for OPTIONS') do
        # No authorization header
        options('/api/v1/export')
        expect(response).to(have_http_status(:ok))
        expect(response.body).to(be_empty)
      end
    end
  end

  describe('Error scenarios') do
    let(:token) { ExportToken.generate(description: 'Error test') }
    let(:headers) { { 'Authorization' => "Bearer #{token.raw_token}" } }

    it('handles database errors gracefully') do
      allow(Measurement).to receive(:includes).and_raise(ActiveRecord::StatementInvalid, 'DB Error')
      
      get('/api/v1/export', params: { format_type: 'json' }, headers:)
      
      expect(response).to(have_http_status(:internal_server_error))
      expect(response.parsed_body['error']).to(be_present)
    end

    it('handles invalid date formats') do
      get('/api/v1/export', 
          params: { format_type: 'json', from: 'invalid-date' }, 
          headers:)
      
      expect(response).to(have_http_status(:bad_request))
      expect(response.parsed_body['error']).to(include('Invalid date'))
    end

    it('handles invalid date ranges') do
      get('/api/v1/export',
          params: { format_type: 'json', from: '2024-01-15', to: '2024-01-14' },
          headers:)
      
      expect(response).to(have_http_status(:bad_request))
      expect(response.parsed_body['error']).to(include('Invalid date range'))
    end
  end
end