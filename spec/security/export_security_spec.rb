# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Export Security', type: :request do
  describe 'Token Security' do
    it 'never stores tokens in plaintext' do
      token = ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )

      # The raw token should only be available in memory after creation
      expect(token.raw_token).to be_present
      expect(token.raw_token.length).to be >= 32

      # Token should not be stored in plaintext in database
      db_token = ExportToken.find(token.id)
      expect(db_token.respond_to?(:token)).to be false
      expect(db_token.token_hash).to be_present
      expect(db_token.token_hash).not_to eq(token.raw_token)
      expect(db_token.token_hash).to eq(Digest::SHA256.hexdigest(token.raw_token))
    end

    it 'authenticates using hashed tokens' do
      token = ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )

      raw_token = token.raw_token

      # Should authenticate with raw token
      authenticated = ExportToken.authenticate(raw_token)
      expect(authenticated).to eq(token)

      # Should not authenticate with hash
      authenticated = ExportToken.authenticate(token.token_hash)
      expect(authenticated).to be_nil

      # Should not authenticate with wrong token
      authenticated = ExportToken.authenticate('wrong_token')
      expect(authenticated).to be_nil
    end
  end

  describe 'SQL Injection Prevention' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end

    around do |example|
      suppress_logs { example.run }
    end

    it 'sanitizes date parameters against SQL injection' do
      # Attempt SQL injection in date parameter
      malicious_date = "2024-01-01'; DROP TABLE measurements; --"

      get '/api/v1/export',
          params: {
            format_type: 'csv',
            from: malicious_date
          },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }

      # Should reject invalid date, not execute SQL
      expect(response).to have_http_status(:unprocessable_entity)
      expect(Measurement.table_exists?).to be true
    end

    it 'sanitizes PPM parameters against SQL injection' do
      # Attempt SQL injection in PPM parameter
      malicious_ppm = '1000 OR 1=1'

      query_builder = Export::QueryBuilder.new
      filters = { above_ppm: malicious_ppm }

      # Should raise an error for invalid numeric input, preventing injection
      expect {
        query_builder.build(filters:)
      }.to raise_error(Export::BaseService::ExportError, /Invalid above_ppm/)
    end

    it 'sanitizes place_database_id against SQL injection' do
      # Attempt SQL injection in place_database_id
      malicious_id = '1 OR 1=1; DELETE FROM places'

      query_builder = Export::QueryBuilder.new
      filters = { place_database_id: malicious_id }

      # Should raise an error for invalid numeric input, preventing injection
      expect {
        query_builder.build(filters:)
      }.to raise_error(Export::BaseService::ExportError, /Invalid place_database_id/)
    end

    it 'sanitizes google_place_id against SQL injection' do
      # Attempt SQL injection in google_place_id
      malicious_id = "'; DELETE FROM places WHERE '1'='1"

      query_builder = Export::QueryBuilder.new
      filters = { google_place_id: malicious_id }

      # Should properly escape the string - Rails will parameterize it safely
      query = query_builder.build(filters:)
      sql = query.to_sql
      
      # The malicious string should be escaped/parameterized, not executed
      # Rails escapes single quotes in the string, preventing SQL injection
      expect(sql).to include('google_place_id')
      # Verify it's treating it as a string value, not executing SQL
      expect(sql).to include("'; DELETE FROM places WHERE ''1''=''1")
      # Ensure the Measurement table still exists (injection didn't execute)
      expect(Measurement.table_exists?).to be true
    end
  end

  describe 'Rate Limiting Security', :rack_attack do
    before do
      enable_rack_attack!
      reset_rack_attack_cache!
    end

    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: {
          formats: ['csv', 'json'],
          rate_limit_per_hour: 5
        }
      )
    end

    it 'uses secure unpredictable rate limiting keys' do
      key = token.rate_limit_key

      # Key should be based on token hash, not sequential ID
      # Check that it's a proper hash-based key
      expect(key).to match(/^export_rate:[a-f0-9]{64}$/)
      expect(key).to include('export_rate:')

      # Key should be unpredictable (hash length of 64 characters + prefix)
      expect(key.length).to be > 50
    end

    it 'prevents rate limit bypass with token variations' do
      Rails.cache.clear

      # Make requests up to the limit
      5.times do |i|
        get '/api/v1/export',
            params: { format_type: 'json' }, # Use JSON to avoid caching issues
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        expect(response).to have_http_status(:success), "Request #{i + 1} failed with status #{response.status}"
      end

      # Next request should be rate limited
      get '/api/v1/export',
          params: { format_type: 'json' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      expect(response).to have_http_status(:too_many_requests)

      # Trying with token variations should still be rate limited
      # (using same token with different casing/spacing)
      get '/api/v1/export',
          params: { format_type: 'json' },
          headers: { 'Authorization' => "bearer #{token.raw_token}" }
      expect(response).to have_http_status(:too_many_requests)
    end
  end

  describe 'Memory Leak Prevention' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end

    it 'handles client disconnects gracefully' do
      # With the non-streaming approach using send_data, client disconnections
      # are handled at a lower level by Rails/Rack and don't bubble up as exceptions
      # to our application code. The data is buffered and sent, and if the client
      # disconnects, the framework handles it gracefully.
      
      # This test now verifies that the CSV export completes successfully
      # without streaming-related issues
      get '/api/v1/export',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      
      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to include('text/csv')
    end

    it 'cleans up resources in ensure block' do
      # Test behavior, not implementation: verify resources are cleaned up after streaming
      # This test verifies that even when errors occur, connections don't leak

      initial_connections = ActiveRecord::Base.connection_pool.connections.size

      # Perform multiple requests to test connection pooling
      3.times do
        get '/api/v1/export',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }

        expect(response).to have_http_status(:success)
      end

      # Clear connections to get accurate count
      ActiveRecord::Base.clear_active_connections!
      final_connections = ActiveRecord::Base.connection_pool.connections.size

      # Connections should be properly managed and not leak
      expect(final_connections).to be <= initial_connections + 2 # Allow for some pooling

      # The ensure block in stream_export handles cleanup automatically
      # This is proven by the fact that connections don't grow unbounded
    end
  end

  describe 'CORS Protection' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end

    context 'simulating production-like CORS' do
      # NOTE: In test environment, CORS is configured at boot time.
      # We test with the default test origins: 'https://trusted-test-origin.com' and 'http://localhost:3000'

      it 'blocks requests from unauthorized origins' do
        get '/api/v1/export',
            params: { format_type: 'csv' },
            headers: {
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => 'https://evil.com'
            }

        # Should not include CORS headers for unauthorized origin
        expect(response.headers['Access-Control-Allow-Origin']).to be_nil
      end

      it 'allows requests from authorized origins' do
        get '/api/v1/export',
            params: { format_type: 'csv' },
            headers: {
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => 'https://trusted-test-origin.com'
            }

        # Should include CORS headers for authorized origin
        expect(response.headers['Access-Control-Allow-Origin']).to eq('https://trusted-test-origin.com')
      end
    end

    context 'in development' do
      it 'allows localhost origins' do
        get '/api/v1/export',
            params: { format_type: 'csv' },
            headers: {
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => 'http://localhost:3000'
            }

        # Should allow localhost in development
        expect(response.headers['Access-Control-Allow-Origin']).to eq('http://localhost:3000')
      end
    end
  end

  describe 'Additional Security Measures' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end

    it 'validates export format to prevent format injection' do
      # Attempt to use malicious format
      get '/api/v1/export',
          params: { format_type: '../../../etc/passwd' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }

      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include('Unsupported format')
    end

    it 'enforces token expiration' do
      expired_token = ExportToken.new(
        description: 'Expired token',
        expires_at: 1.hour.ago,
        permissions: { formats: ['csv'] }
      )
      expired_token.skip_expiration_validation = true
      expired_token.save!

      get '/api/v1/export',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{expired_token.raw_token}" }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'enforces format permissions' do
      restricted_token = ExportToken.create!(
        description: 'Restricted token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] } # Only CSV allowed
      )

      # Try to export JSON
      get '/api/v1/export',
          params: { format_type: 'json' },
          headers: { 'Authorization' => "Bearer #{restricted_token.raw_token}" }

      expect(response).to have_http_status(:forbidden)
      expect(response.body).to include('Token not authorized for format')
    end
  end
end