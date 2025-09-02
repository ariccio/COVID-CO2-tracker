# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('API::V1::Exports', type: :request) do
  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user: user, serial: 'TEST123') }
  let(:place) { create(:place, google_place_id: 'test_place_id') }
  let(:sub_location) { create(:sub_location, place: place) }
  
  let!(:measurements) do
    5.times.map do |i|
      create(:measurement,
        device: device,
        sub_location: sub_location,
        co2ppm: 400 + (i * 200),
        measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.hours
      )
    end
  end
  
  let(:valid_token) { 'test_export_token_123' }
  let(:headers) { { 'Authorization' => "Bearer #{valid_token}" } }
  
  before do
    # Mock token validation
    allow_any_instance_of(Api::V1::ExportsController)
      .to receive(:validate_export_token!)
      .and_return(true)
  end
  
  describe('GET /api/v1/exports/csv') do
    context('with valid token') do
      it('returns CSV data with default fields') do
        get '/api/v1/exports/csv', headers: headers
        
        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('text/csv'))
        
        lines = response.body.split("\n")
        expect(lines.first).to(eq('co2_ppm,timestamp,lat,lng'))
        expect(lines.size).to(eq(6)) # header + 5 measurements
      end
      
      it('accepts custom fields including user_name') do
        get '/api/v1/exports/csv', 
            params: { fields: 'co2_ppm,timestamp,user_name,device_serial' },
            headers: headers
        
        expect(response).to(have_http_status(:ok))
        lines = response.body.split("\n")
        expect(lines.first).to(eq('co2_ppm,timestamp,user_name,device_serial'))
        expect(lines[1]).to(include('Test User'))
        expect(lines[1]).to(include('TEST123'))
      end
      
      it('filters by date range') do
        get '/api/v1/exports/csv',
            params: { from: '2024-01-15', to: '2024-01-15' },
            headers: headers
        
        expect(response).to(have_http_status(:ok))
        lines = response.body.split("\n")
        expect(lines.size).to(eq(6)) # All measurements are on this date
      end
      
      it('filters by CO2 threshold') do
        get '/api/v1/exports/csv',
            params: { above_ppm: 800 },
            headers: headers
        
        expect(response).to(have_http_status(:ok))
        lines = response.body.split("\n")
        expect(lines.size).to(eq(3)) # header + 2 measurements >= 800
      end
      
      it('sets appropriate headers') do
        get '/api/v1/exports/csv', headers: headers
        
        expect(response.headers['Content-Disposition'])
          .to(match(/attachment; filename="covid_co2_measurements_\d{14}\.csv"/))
        expect(response.headers['Cache-Control']).to(eq('no-cache'))
      end
    end
    
    context('without authentication') do
      it('returns unauthorized') do
        get '/api/v1/exports/csv'
        
        expect(response).to(have_http_status(:unauthorized))
        expect(JSON.parse(response.body)['error']).to(eq('Missing or invalid export token'))
      end
    end
    
    context('with invalid token') do
      it('returns unauthorized') do
        get '/api/v1/exports/csv', headers: { 'Authorization' => 'Bearer invalid' }
        
        expect(response).to(have_http_status(:unauthorized))
      end
    end
    
    context('with validation errors') do
      it('returns bad request for invalid date range') do
        get '/api/v1/exports/csv',
            params: { from: '2024-01-15', to: '2024-01-14' },
            headers: headers
        
        expect(response).to(have_http_status(:bad_request))
        expect(JSON.parse(response.body)['error'])
          .to(include("Invalid date range"))
      end
    end
  end
  
  describe('GET /api/v1/exports/json') do
    context('with valid token') do
      it('returns JSON data with metadata') do
        get '/api/v1/exports/json', headers: headers
        
        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('application/json'))
        
        data = JSON.parse(response.body)
        expect(data['measurements']).to(be_an(Array))
        expect(data['measurements'].size).to(eq(5))
        expect(data['metadata']).to(include('total_records', 'export_time'))
      end
      
      it('includes user_name when requested') do
        get '/api/v1/exports/json',
            params: { fields: 'co2_ppm,timestamp,user_name' },
            headers: headers
        
        data = JSON.parse(response.body)
        expect(data['measurements'].first).to(include('user_name'))
        expect(data['measurements'].first['user_name']).to(eq('Test User'))
      end
      
      it('applies filters correctly') do
        get '/api/v1/exports/json',
            params: { above_ppm: 600, below_ppm: 1000 },
            headers: headers
        
        data = JSON.parse(response.body)
        expect(data['measurements'].size).to(eq(2))
        data['measurements'].each do |m|
          expect(m['co2_ppm']).to(be_between(600, 1000))
        end
      end
    end
  end
  
  describe('GET /api/v1/exports/stream') do
    context('with valid token') do
      it('streams CSV data') do
        get '/api/v1/exports/stream', headers: headers
        
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
            device: device,
            sub_location: sub_location,
            co2ppm: 400 + i,
            measurementtime: Time.current - i.hours
          )
        end
        
        get '/api/v1/exports/stream', headers: headers
        
        expect(response).to(have_http_status(:ok))
        lines = response.body.split("\n")
        expect(lines.size).to(eq(56)) # header + 55 measurements
      end
    end
  end
  
  describe('GET /api/v1/exports/multi') do
    let(:other_place) { create(:place, google_place_id: 'other_place_id') }
    let(:other_sub_location) { create(:sub_location, place: other_place) }
    
    before do
      create(:measurement,
        device: device,
        sub_location: other_sub_location,
        co2ppm: 900,
        measurementtime: Time.current
      )
    end
    
    context('with valid token') do
      it('returns ZIP file with multiple CSVs') do
        get '/api/v1/exports/multi', headers: headers
        
        expect(response).to(have_http_status(:ok))
        expect(response.content_type).to(include('application/zip'))
        expect(response.headers['Content-Disposition'])
          .to(match(/attachment; filename="covid_co2_export_\d{14}\.zip"/))
        
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
        get '/api/v1/exports/multi', headers: headers
        
        Zip::File.open_buffer(response.body) do |zip|
          users_csv = zip.get_entry('users.csv').get_input_stream.read
          lines = users_csv.split("\n")
          
          expect(lines.first).to(eq('user_id,name,measurements_count'))
          expect(lines[1]).to(include('Test User'))
        end
      end
      
      it('applies filters to all relevant CSVs') do
        get '/api/v1/exports/multi',
            params: { place_id: place.google_place_id },
            headers: headers
        
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
      # Mock rate limit exceeded
      allow_any_instance_of(Api::V1::ExportsController)
        .to receive(:check_rate_limit!)
        .and_raise(Api::V1::ExportsController::RateLimitExceeded)
      
      get '/api/v1/exports/csv', headers: headers
      
      expect(response).to(have_http_status(:too_many_requests))
      expect(JSON.parse(response.body)['error']).to(include('Rate limit exceeded'))
    end
  end
  
  describe('Error handling') do
    it('handles database errors gracefully') do
      allow(Measurement).to receive(:joins).and_raise(ActiveRecord::StatementInvalid)
      
      get '/api/v1/exports/csv', headers: headers
      
      expect(response).to(have_http_status(:internal_server_error))
      expect(JSON.parse(response.body)['error']).to(eq('Export failed'))
    end
    
    it('handles memory errors on Heroku') do
      allow(ENV).to receive(:[]).with('DYNO').and_return('web.1')
      allow_any_instance_of(Export::CsvService)
        .to receive(:validate_safety!)
        .and_raise(Export::BaseService::ExportError, 'Insufficient memory for export operation')
      
      get '/api/v1/exports/csv', headers: headers
      
      expect(response).to(have_http_status(:service_unavailable))
      expect(JSON.parse(response.body)['error']).to(include('Insufficient memory'))
    end
  end
end