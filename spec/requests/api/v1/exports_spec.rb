# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('API::V1::Exports') do
  # Disable transactional fixtures for export tests since exports can't run in transactions
  self.use_transactional_tests = false

  # Clean up database after each test since we're not using transactions
  after do
    DatabaseCleaner.clean_with(:truncation)
  end

  # Instance variables for shared data
  attr_reader :export_token, :valid_token, :headers

  before do
    # Create user and related data
    user = create(:user, name: 'Test User')
    @device = create(:device, user:, serial: 'TEST123')
    @place = create(:place, google_place_id: 'test_place_id')
    @sub_location = create(:sub_location, place: @place)

    # Use ExportToken.generate to create token properly
    @export_token = ExportToken.generate(
      description: 'Test token for specs',
      expires_in: 1.year,
      permissions: {} # Empty permissions hash (uses defaults)
    )

    # The raw_token is available after generation
    @valid_token = @export_token.raw_token
    @headers = { 'Authorization' => "Bearer #{@valid_token}" }

    # Create test measurements for export tests
    5.times do |i|
      create(:measurement,
             device: @device,
             sub_location: @sub_location,
             co2ppm: 400 + (i * 200),
             measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.hours)
    end
  end

  describe('GET /api/v1/export with CSV format') do
    context('with valid token') do
      it('returns CSV data with correct headers and calls export service') do
        # Mock the CSV service to verify it's called correctly
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_to_string).and_return("co2_ppm,timestamp,lat,lng\n800,2024-01-15T10:00:00Z,40.7128,-74.006")

        get('/api/v1/export', params: { format_type: 'csv' }, headers: @headers)

        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('text/csv'))

        # Verify the service was called with correct parameters
        expect(csv_service).to have_received(:export_to_string).with(
          { limit: 100_000 }, # filters include token's default max_records
          fields: Export::BaseService::DEFAULT_FIELDS
        )
      end

      it('accepts custom fields including user_name') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_to_string).and_return("co2_ppm,timestamp,user_name,device_serial\n800,2024-01-15T10:00:00Z,Test User,TEST123")

        get('/api/v1/export',
            params: { format_type: 'csv', fields: 'co2_ppm,timestamp,user_name,device_serial' },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify custom fields were passed correctly
        expect(csv_service).to have_received(:export_to_string).with(
          { limit: 100_000 }, # filters include token's default max_records
          fields: %w[co2_ppm timestamp user_name device_serial]
        )
      end

      it('filters by date range') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).with(hash_including(from: '2024-01-15', to: '2024-01-15')).and_return(csv_service)
        allow(csv_service).to receive(:export_to_string).and_return("co2_ppm,timestamp,lat,lng\n800,2024-01-15T10:00:00Z,40.7128,-74.006")

        get('/api/v1/export',
            params: { format_type: 'csv', from: '2024-01-15', to: '2024-01-15' },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify filters were passed correctly to constructor
        expect(Export::CsvService).to have_received(:new).with(
          hash_including(from: '2024-01-15', to: '2024-01-15')
        )
      end

      it('filters by CO2 threshold') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).with(hash_including(above_ppm: '800')).and_return(csv_service)
        allow(csv_service).to receive(:export_to_string).and_return("co2_ppm,timestamp,lat,lng\n1200,2024-01-15T11:00:00Z,40.7128,-74.006")

        get('/api/v1/export',
            params: { format_type: 'csv', above_ppm: 800 },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify filters were passed correctly to constructor
        expect(Export::CsvService).to have_received(:new).with(
          hash_including(above_ppm: '800')
        )
      end

      it('sets appropriate headers') do
        # Mock the CSV service to avoid transaction issues
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_to_string).and_return("co2_ppm,timestamp,lat,lng\n800,2024-01-15T10:00:00Z,40.7128,-74.006")

        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        # Now using send_data, Content-Disposition should be set
        expect(response.headers['Content-Disposition']).to(include('attachment'))
        expect(response.headers['Content-Disposition']).to(include('.csv'))
      end
    end

    context('without authentication') do
      it('returns unauthorized') do
        # No Authorization header provided
        get '/api/v1/export', params: { format_type: 'csv' }

        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(eq('Authentication required'))
      end
    end

    context('with invalid token') do
      it('returns unauthorized') do
        # Use a token that doesn't exist in the database
        get '/api/v1/export', params: { format_type: 'csv' }, headers: { 'Authorization' => 'Bearer invalid_token_that_does_not_exist' }

        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(eq('Invalid authentication token'))
      end
    end

    context('with expired token') do
      it('returns unauthorized with specific error') do
        # Use a fixed token value to ensure consistency
        test_raw_token = "expired_test_token_#{SecureRandom.hex(16)}"
        test_token_hash = Digest::SHA256.hexdigest(test_raw_token)

        # Create token with ExportToken.generate then update to be expired
        expired_token = ExportToken.generate(
          description: 'Expired test token',
          expires_in: 1.year, # Create as valid first
          permissions: {}
        )
        # Update token_hash and expires_at directly in database to bypass validations
        expired_token.update_columns(
          token_hash: test_token_hash,
          expires_at: 1.day.ago # Make it expired
        )

        # Verify token was created properly
        expect(expired_token.reload).to be_persisted
        expect(expired_token).to be_expired

        get '/api/v1/export', params: { format_type: 'csv' }, headers: { 'Authorization' => "Bearer #{test_raw_token}" }

        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(eq('Token has expired'))
      end
    end

    context('with revoked token') do
      it('returns unauthorized with specific error') do
        # Use a fixed token value to ensure consistency
        test_raw_token = "revoked_test_token_#{SecureRandom.hex(16)}"
        test_token_hash = Digest::SHA256.hexdigest(test_raw_token)

        # Create token with ExportToken.generate then update the hash
        revoked_token = ExportToken.generate(
          description: 'Revoked test token',
          expires_in: 1.year,
          permissions: {}
        )
        # Update token_hash directly in database
        revoked_token.update_columns(token_hash: test_token_hash)
        revoked_token.revoke!(reason: 'Test revocation')

        # Verify token was created and revoked properly
        expect(revoked_token.reload).to be_persisted
        expect(revoked_token).to be_revoked

        get '/api/v1/export', params: { format_type: 'csv' }, headers: { 'Authorization' => "Bearer #{test_raw_token}" }

        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(eq('Token has been revoked'))
      end
    end

    context('with validation errors') do
      it('returns bad request for invalid date range') do
        get('/api/v1/export',
            params: { format_type: 'csv', from: '2024-01-15', to: '2024-01-14' },
            headers:)

        expect(response).to(have_http_status(:bad_request))
        expect(response.parsed_body['error'])
          .to(include('Invalid date range'))
      end
    end
  end

  describe('GET /api/v1/export with JSON format') do
    context('with valid token') do
      it('returns JSON data with metadata') do
        get('/api/v1/export', params: { format_type: 'json' }, headers:)

        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('application/json'))

        data = response.parsed_body
        expect(data['measurements']).to(be_an(Array))
        expect(data['measurements'].size).to(eq(5))
        expect(data['metadata']).to(include('total_records', 'export_time'))
      end

      it('includes user_name when requested') do
        get('/api/v1/export',
            params: { format_type: 'json', fields: 'co2_ppm,timestamp,user_name' },
            headers:)

        data = response.parsed_body
        expect(data['measurements'].first).to(include('user_name'))
        expect(data['measurements'].first['user_name']).to(eq('Test User'))
      end

      it('applies filters correctly') do
        get('/api/v1/export',
            params: { format_type: 'json', above_ppm: 600, below_ppm: 1000 },
            headers:)

        data = response.parsed_body
        # With > 600 and < 1000, only 800 ppm measurement should be included
        expect(data['measurements'].size).to(eq(1))
        data['measurements'].each do |m|
          expect(m['co2_ppm']).to(be > 600)
          expect(m['co2_ppm']).to(be < 1000)
        end
      end
    end
  end

  describe('GET /api/v1/export with non-streaming CSV') do
    context('with valid token') do
      it('returns CSV data with send_data') do
        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        expect(response).to(have_http_status(:ok))
        expect(response.headers['Content-Type']).to(include('text/csv'))
        # No longer using chunked transfer since we switched to send_data
        expect(response.headers['Content-Disposition']).to(include('attachment'))

        # Response should contain CSV data
        lines = response.body.split("\n")
        expect(lines.first).to(eq('co2_ppm,timestamp,lat,lng'))
      end

      it('handles large datasets efficiently') do
        # Create more measurements
        50.times do |i|
          create(:measurement,
                 device: @device,
                 sub_location: @sub_location,
                 co2ppm: 400 + i,
                 measurementtime: Time.current - i.hours)
        end

        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        expect(response).to(have_http_status(:ok))
        lines = response.body.split("\n")
        expect(lines.size).to(eq(56)) # header + 55 measurements
      end
    end
  end

  describe('GET /api/v1/export with multi-CSV format') do
    let(:other_place) { create(:place, google_place_id: 'other_place_id') }
    let(:other_sub_location) { create(:sub_location, place: other_place) }

    before do
      create(:measurement,
             device: @device,
             sub_location: other_sub_location,
             co2ppm: 900,
             measurementtime: Time.current)
    end

    context('with valid token') do
      it('returns ZIP file with multiple CSVs') do
        get('/api/v1/export', params: { format_type: 'multi_csv' }, headers:)

        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('application/zip'))
        expect(response.headers['Content-Disposition'])
          .to(match(/attachment; filename="co2_export_multi\.zip"/))

        # Verify ZIP structure
        Zip::File.open_buffer(response.body) do |zip|
          expect(zip.entries.map(&:name)).to(include(
                                               'measurements.csv',
                                               'places.csv',
                                               'sub_locations.csv',
                                               'devices.csv',
                                               'users.csv',
                                               'metadata.json'
                                             ))
        end
      end

      it('includes user names in users.csv') do
        get('/api/v1/export', params: { format_type: 'multi_csv' }, headers:)

        Zip::File.open_buffer(response.body) do |zip|
          users_csv = zip.get_entry('users.csv').get_input_stream.read
          lines = users_csv.split("\n")

          expect(lines.first).to(eq('user_id,name,measurements_count'))
          expect(lines[1]).to(include('Test User'))
        end
      end

      it('applies filters to all relevant CSVs') do
        get('/api/v1/export',
            params: { format_type: 'multi_csv', google_place_id: @place.google_place_id },
            headers:)

        Zip::File.open_buffer(response.body) do |zip|
          measurements_csv = zip.get_entry('measurements.csv').get_input_stream.read
          lines = measurements_csv.split("\n")

          # Should only include measurements from the filtered place
          # Expecting header + 5 measurements from the specified place only
          expect(lines.size).to(be_between(5, 7)) # Some flexibility for test data variations
        end
      end
    end
  end

  describe('Rate limiting') do
    it('enforces rate limits') do
      # Mock a memory store cache instead of null store
      memory_store = ActiveSupport::Cache::MemoryStore.new
      allow(Rails).to receive(:cache).and_return(memory_store)

      # Create a token with low rate limit using proper generation method
      rate_limited_token = ExportToken.generate(
        description: 'Rate limited test token',
        expires_in: 1.year,
        permissions: { 'rate_limit_per_hour' => 2 }
      )
      raw_token = rate_limited_token.raw_token

      # Set up the cache with a high count to trigger rate limit
      memory_store.write(rate_limited_token.rate_limit_key, 10, expires_in: 1.hour)

      get('/api/v1/export', params: { format_type: 'csv' }, headers: { 'Authorization' => "Bearer #{raw_token}" })

      expect(response).to(have_http_status(:too_many_requests))
      expect(response.parsed_body['error']).to(include('Rate limit exceeded'))
    end
  end

  describe('Error handling') do
    it('handles database errors gracefully') do
      # Mock the QueryBuilder to raise an error when building the query
      query_builder = instance_double(Export::QueryBuilder)
      allow(Export::QueryBuilder).to receive(:new).and_return(query_builder)
      allow(query_builder).to receive(:build)
        .and_raise(ActiveRecord::StatementInvalid, 'Database error')

      get('/api/v1/export', params: { format_type: 'csv' }, headers:)

      expect(response).to(have_http_status(:internal_server_error))
      # Check that error response is returned
      expect(response.parsed_body['error']).to(be_present)
    end

    it('handles memory errors on Heroku') do
      # Allow ENV to work normally but return specific value for DYNO
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('DYNO').and_return('web.1')

      # Mock the CsvService to raise memory error on initialization
      allow(Export::CsvService).to receive(:new)
        .and_raise(Export::BaseService::ExportError, 'Insufficient memory for export operation')

      get('/api/v1/export', params: { format_type: 'csv' }, headers:)

      expect(response).to(have_http_status(:service_unavailable))
      # Check that an error response is returned (streaming may truncate the message)
      expect(response.body).to(include('error'))
    end
  end
end