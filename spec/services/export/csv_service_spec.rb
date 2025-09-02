# frozen_string_literal: true

require 'rails_helper'

RSpec.describe(Export::CsvService) do
  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user: user, serial: 'TEST123') }
  let(:place) { create(:place, place_lat: 40.7128, place_lng: -74.0060, google_place_id: 'ChIJOwg_06VPwokRYv534QaPC8g') }
  let(:sub_location) { create(:sub_location, place: place, description: 'Conference Room A') }
  
  describe('#export') do
    let!(:measurement1) do
      create(:measurement,
        device: device,
        sub_location: sub_location,
        co2ppm: 800,
        measurementtime: Time.parse('2024-01-15 10:00:00 UTC'),
        crowding: 3
      )
    end
    
    let!(:measurement2) do
      create(:measurement,
        device: device,
        sub_location: sub_location,
        co2ppm: 1200,
        measurementtime: Time.parse('2024-01-15 11:00:00 UTC'),
        crowding: 5
      )
    end
    
    subject(:service) { described_class.new(filters) }
    
    context('with default fields') do
      let(:filters) { {} }
      
      it('exports CSV with default fields') do
        csv_data = service.export
        lines = csv_data.split("\n")
        
        expect(lines[0]).to(eq('co2_ppm,timestamp,lat,lng'))
        expect(lines[1]).to(include('800,2024-01-15T10:00:00Z,40.7128,-74.006'))
        expect(lines[2]).to(include('1200,2024-01-15T11:00:00Z,40.7128,-74.006'))
      end
    end
    
    context('with custom fields including user_name') do
      let(:filters) { { fields: %w[co2_ppm timestamp user_name device_serial place_name] } }
      
      it('includes user name in export') do
        csv_data = service.export
        lines = csv_data.split("\n")
        
        expect(lines[0]).to(eq('co2_ppm,timestamp,user_name,device_serial,place_name'))
        expect(lines[1]).to(include('Test User'))
        expect(lines[1]).to(include('TEST123'))
        expect(lines[1]).to(include('Conference Room A'))
      end
    end
    
    context('with date range filter') do
      let(:filters) { { from: '2024-01-15', to: '2024-01-15' } }
      
      it('filters measurements by date') do
        # Create measurement outside range
        create(:measurement,
          device: device,
          sub_location: sub_location,
          co2ppm: 600,
          measurementtime: Time.parse('2024-01-16 10:00:00 UTC')
        )
        
        csv_data = service.export
        lines = csv_data.split("\n")
        
        expect(lines.size).to(eq(3)) # header + 2 measurements
        expect(lines[1]).to(include('800'))
        expect(lines[2]).to(include('1200'))
      end
    end
    
    context('with CO2 threshold filters') do
      let(:filters) { { above_ppm: 1000 } }
      
      it('filters by CO2 threshold') do
        csv_data = service.export
        lines = csv_data.split("\n")
        
        expect(lines.size).to(eq(2)) # header + 1 measurement
        expect(lines[1]).to(include('1200'))
      end
    end
    
    context('with place filter') do
      let(:other_place) { create(:place) }
      let(:other_sub_location) { create(:sub_location, place: other_place) }
      let(:filters) { { place_id: place.google_place_id } }
      
      before do
        create(:measurement,
          device: device,
          sub_location: other_sub_location,
          co2ppm: 900,
          measurementtime: Time.parse('2024-01-15 12:00:00 UTC')
        )
      end
      
      it('filters by place') do
        csv_data = service.export
        lines = csv_data.split("\n")
        
        expect(lines.size).to(eq(3)) # header + 2 measurements from same place
        expect(lines[1]).not_to(include('900'))
      end
    end
    
    context('error handling') do
      context('with invalid date range') do
        let(:filters) { { from: '2024-01-15', to: '2024-01-14' } }
        
        it('raises validation error') do
          expect { service.export }.to(raise_error(
            Export::BaseService::ExportError,
            "Invalid date range: 'from' date must be before 'to' date"
          )
        end
      end
      
      context('with date range exceeding 365 days') do
        let(:filters) { { from: '2023-01-01', to: '2024-01-02' } }
        
        it('raises validation error') do
          expect { service.export }.to(raise_error(
            Export::BaseService::ExportError,
            'Date range too large (max 365 days)'
          )
        end
      end
      
      context('with invalid CO2 threshold') do
        let(:filters) { { above_ppm: -100 } }
        
        it('raises validation error') do
          expect { service.export }.to(raise_error(
            Export::BaseService::ExportError,
            'Invalid CO2 threshold: must be non-negative'
          )
        end
      end
      
      context('with invalid field name') do
        let(:filters) { { fields: %w[co2_ppm email password] } }
        
        it('ignores invalid fields') do
          csv_data = service.export
          lines = csv_data.split("\n")
          
          expect(lines[0]).to(eq('co2_ppm'))
          expect(lines[0]).not_to(include('email'))
          expect(lines[0]).not_to(include('password'))
        end
      end
    end
    
    context('performance considerations') do
      before do
        # Create many measurements
        100.times do |i|
          create(:measurement,
            device: device,
            sub_location: sub_location,
            co2ppm: 400 + (i * 10),
            measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.hours
          )
        end
      end
      
      let(:filters) { {} }
      
      it('handles large datasets efficiently') do
        expect { service.export }.not_to(raise_error)
        
        csv_data = service.export
        lines = csv_data.split("\n")
        expect(lines.size).to(eq(103)) # header + 102 measurements
      end
    end
  end
end