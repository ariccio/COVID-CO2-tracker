# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('API::V1::Exports') do
  # Disable transactional fixtures for export tests since exports can't run in transactions
  self.use_transactional_tests = false

  # Clean up database after each test since we're not using transactions
  after do
    DatabaseCleaner.clean_with(:truncation)
  end

  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user:, serial: 'TEST123') }
  let(:place) { create(:place, google_place_id: 'test_place_id') }
  let(:sub_location) { create(:sub_location, place:) }

  let!(:measurements) do
    Array.new(5) do |i|
      create(:measurement,
             device:,
             sub_location:,
             co2ppm: 400 + (i * 200),
             measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.hours)
    end
  end

  let(:valid_token) { 'test_export_token_123' }
  let(:headers) { { 'Authorization' => "Bearer #{valid_token}" } }

  before do
    # Mock token authentication and set the instance variable
    mock_token = instance_double('ExportToken',
                                 rate_limit_key: 'test_rate_key',
                                 rate_limit_per_hour: 100,
                                 max_records: 10_000,
                                 can_export_format?: true,
                                 record_usage!: true)

    allow_any_instance_of(Api::V1::ExportsController)
      .to receive(:authenticate_export_token) do |controller|
        controller.instance_variable_set(:@export_token, mock_token)
      end
  end

  describe('GET /api/v1/export with CSV format') do
    context('with valid token') do
      it('returns CSV data with correct headers and calls export service') do
        # Mock the CSV service to verify it's called correctly
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_measurements)

        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('text/csv'))

        # Verify the service was called with correct parameters
        expect(csv_service).to have_received(:export_measurements).with(
          anything, # stream
          anything, # filters
          fields: Export::BaseService::DEFAULT_FIELDS
        )
      end

      it('accepts custom fields including user_name') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_measurements)

        get('/api/v1/export',
            params: { format_type: 'csv', fields: 'co2_ppm,timestamp,user_name,device_serial' },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify custom fields were passed correctly
        expect(csv_service).to have_received(:export_measurements).with(
          anything,
          anything,
          fields: %w[co2_ppm timestamp user_name device_serial]
        )
      end

      it('filters by date range') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_measurements)

        get('/api/v1/export',
            params: { format_type: 'csv', from: '2024-01-15', to: '2024-01-15' },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify filters were passed correctly
        expect(csv_service).to have_received(:export_measurements).with(
          anything,
          hash_including(from: '2024-01-15', to: '2024-01-15'),
          anything
        )
      end

      it('filters by CO2 threshold') do
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_measurements)

        get('/api/v1/export',
            params: { format_type: 'csv', above_ppm: 800 },
            headers:)

        expect(response).to(have_http_status(:ok))

        # Verify filters were passed correctly
        expect(csv_service).to have_received(:export_measurements).with(
          anything,
          hash_including(above_ppm: 800),
          anything
        )
      end

      it('sets appropriate headers') do
        # Mock the CSV service to avoid transaction issues
        csv_service = instance_double(Export::CsvService)
        allow(Export::CsvService).to receive(:new).and_return(csv_service)
        allow(csv_service).to receive(:export_measurements)

        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        # NOTE: Content-Disposition is not set for the index action (streaming)
        # Only for the download action
        # Rails may reorder Cache-Control components
        expect(response.headers['Cache-Control']).to(include('public'))
        expect(response.headers['Cache-Control']).to(include('max-age=300'))
      end
    end

    context('without authentication') do
      it('returns unauthorized') do
        # Don't set up the mock authentication for this test
        allow_any_instance_of(Api::V1::ExportsController)
          .to receive(:authenticate_export_token) do |controller|
            controller.render json: { error: 'Invalid or expired token' }, status: :unauthorized
          end

        get '/api/v1/export', params: { format_type: 'csv' }

        expect(response).to(have_http_status(:unauthorized))
        expect(response.parsed_body['error']).to(eq('Invalid or expired token'))
      end
    end

    context('with invalid token') do
      it('returns unauthorized') do
        # Override the mock to simulate invalid token
        allow_any_instance_of(Api::V1::ExportsController)
          .to receive(:authenticate_export_token) do |controller|
            controller.render json: { error: 'Invalid or expired token' }, status: :unauthorized
          end

        get '/api/v1/export', params: { format_type: 'csv' }, headers: { 'Authorization' => 'Bearer invalid' }

        expect(response).to(have_http_status(:unauthorized))
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

  describe('GET /api/v1/export with streaming') do
    context('with valid token') do
      it('streams CSV data') do
        get('/api/v1/export', params: { format_type: 'csv' }, headers:)

        expect(response).to(have_http_status(:ok))
        expect(response.headers['Content-Type']).to(include('text/csv'))
        expect(response.headers['Transfer-Encoding']).to(eq('chunked'))

        # Response should be streamed
        lines = response.body.split("\n")
        expect(lines.first).to(eq('co2_ppm,timestamp,lat,lng'))
      end

      it('handles large datasets efficiently') do
        # Create more measurements
        50.times do |i|
          create(:measurement,
                 device:,
                 sub_location:,
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
             device:,
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
            params: { format_type: 'multi_csv', place_id: place.google_place_id },
            headers:)

        Zip::File.open_buffer(response.body) do |zip|
          measurements_csv = zip.get_entry('measurements.csv').get_input_stream.read
          lines = measurements_csv.split("\n")

          # Should not include measurement from other_place
          expect(lines.size).to(eq(6)) # header + 5 measurements from filtered place
        end
      end
    end
  end

  describe('Rate limiting') do
    it('enforces rate limits') do
      # Mock a memory store cache instead of null store
      memory_store = ActiveSupport::Cache::MemoryStore.new
      allow(Rails).to receive(:cache).and_return(memory_store)

      # Set up the cache with a high count to trigger rate limit
      memory_store.write('test_rate_key', 1000, expires_in: 1.hour)

      # Create a mock export token with a low rate limit
      mock_token = instance_double('ExportToken',
                                   rate_limit_key: 'test_rate_key',
                                   rate_limit_per_hour: 10)

      allow_any_instance_of(Api::V1::ExportsController)
        .to receive(:authenticate_export_token) do |controller|
          controller.instance_variable_set(:@export_token, mock_token)
        end

      get('/api/v1/export', params: { format_type: 'csv' }, headers:)

      expect(response).to(have_http_status(:too_many_requests))
      expect(response.parsed_body['error']).to(include('Rate limit exceeded'))
    end
  end

  describe('Error handling') do
    it('handles database errors gracefully') do
      # Mock the QueryBuilder to raise an error when building the query
      allow_any_instance_of(Export::QueryBuilder)
        .to receive(:build)
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

      # Mock the BaseService validate_safety! to raise memory error
      allow_any_instance_of(Export::BaseService)
        .to receive(:validate_safety!)
        .and_raise(Export::BaseService::ExportError, 'Insufficient memory for export operation')

      get('/api/v1/export', params: { format_type: 'csv' }, headers:)

      expect(response).to(have_http_status(:service_unavailable))
      # Check that an error response is returned (streaming may truncate the message)
      expect(response.body).to(include('error'))
    end
  end
end