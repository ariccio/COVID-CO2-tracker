# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CsvExportService, type: :service do
  describe '.export_measurements_to_csv' do
    let(:output_directory) { '/tmp/csv_export_test' }
    
    before do
      # Create test output directory
      FileUtils.mkdir_p(output_directory)
    end
    
    after do
      # Clean up test files
      FileUtils.rm_rf(output_directory)
    end
    
    context 'when database has no measurements' do
      it 'creates an empty CSV file with headers' do
        result = CsvExportService.export_measurements_to_csv(output_directory)
        
        expect(result[:success]).to be true
        expect(result[:record_count]).to eq 0
        expect(File.exist?(result[:filepath])).to be true
        
        # Check CSV content
        csv_content = File.read(result[:filepath])
        lines = csv_content.split("\n")
        
        # Should have header row only
        expect(lines.length).to eq 1
        expect(lines.first).to include('measurement_id,co2_ppm,measurement_time')
      end
    end
    
    context 'with invalid output directory' do
      it 'handles non-existent directory gracefully' do
        result = CsvExportService.export_measurements_to_csv('/non/existent/path')
        
        expect(result[:success]).to be false
        expect(result[:error]).to be_present
      end
    end
    
    context 'when database connection is not active' do
      before do
        allow(ActiveRecord::Base.connection).to receive(:active?).and_return(false)
      end
      
      it 'fails with appropriate error message' do
        result = CsvExportService.export_measurements_to_csv(output_directory)
        
        expect(result[:success]).to be false
        expect(result[:error]).to include('Database connection is not active')
      end
    end
  end
  
  describe '.export_from_pg_dump' do
    let(:output_directory) { '/tmp/csv_export_test' }
    let(:fake_dump_file) { '/tmp/fake_dump.sql' }
    
    before do
      FileUtils.mkdir_p(output_directory)
      # Create a fake dump file for testing
      File.write(fake_dump_file, "-- PostgreSQL database dump\n-- Fake content for testing")
    end
    
    after do
      FileUtils.rm_rf(output_directory) 
      FileUtils.rm_f(fake_dump_file)
    end
    
    context 'with non-existent dump file' do
      it 'fails with appropriate error message' do
        result = CsvExportService.export_from_pg_dump('/non/existent/dump.sql', output_directory)
        
        expect(result[:success]).to be false
        expect(result[:error]).to include('Dump file does not exist')
      end
    end
    
    context 'with valid dump file path' do
      it 'validates the dump file exists' do
        # This test will fail at database creation step, but should pass validation
        expect {
          CsvExportService.send(:validate_dump_file!, fake_dump_file)
        }.not_to raise_error
      end
    end
  end
  
  describe 'private methods' do
    describe '.validate_preconditions!' do
      context 'when measurements table does not exist' do
        before do
          allow(Measurement).to receive(:table_exists?).and_return(false)
        end
        
        it 'raises an error' do
          expect {
            CsvExportService.send(:validate_preconditions!)
          }.to raise_error(StandardError, 'Measurements table does not exist')
        end
      end
    end
    
    describe '.measurement_headers' do
      it 'returns expected CSV headers' do
        headers = CsvExportService.send(:measurement_headers)
        
        expected_headers = [
          'measurement_id', 'co2_ppm', 'measurement_time', 'crowding_level',
          'is_realtime', 'device_serial', 'device_model', 'device_manufacturer',
          'place_latitude', 'place_longitude', 'sub_location_description',
          'created_at', 'updated_at'
        ]
        
        expect(headers).to eq(expected_headers)
      end
    end
    
    describe '.build_measurement_row' do
      let(:manufacturer) { double('Manufacturer', name: 'Test Manufacturer') }
      let(:model) { double('Model', name: 'Test Model', manufacturer: manufacturer) }
      let(:device) { double('Device', serial: 'ABC123', model: model) }
      let(:place) { double('Place', place_lat: 40.7128, place_lng: -74.0060) }
      let(:sub_location) { double('SubLocation', description: 'Test Room', place: place) }
      let(:measurement) do
        double('Measurement',
               id: 1,
               co2ppm: 450,
               measurementtime: Time.parse('2023-01-01 12:00:00'),
               crowding: 3,
               is_realtime?: false,
               device: device,
               sub_location: sub_location,
               created_at: Time.parse('2023-01-01 12:00:00'),
               updated_at: Time.parse('2023-01-01 12:01:00'))
      end
      
      it 'builds correct CSV row data' do
        row = CsvExportService.send(:build_measurement_row, measurement)
        
        expect(row).to eq([
          1,                                      # measurement_id
          450,                                    # co2_ppm
          '2023-01-01T12:00:00Z',                # measurement_time
          3,                                      # crowding_level
          false,                                  # is_realtime
          'ABC123',                              # device_serial
          'Test Model',                          # device_model
          'Test Manufacturer',                   # device_manufacturer
          40.7128,                               # place_latitude
          -74.0060,                              # place_longitude
          'Test Room',                           # sub_location_description
          '2023-01-01T12:00:00Z',                # created_at
          '2023-01-01T12:01:00Z'                 # updated_at
        ])
      end
      
      it 'handles nil associations gracefully' do
        measurement_with_nils = double('Measurement',
                                       id: 1,
                                       co2ppm: 450,
                                       measurementtime: nil,
                                       crowding: 3,
                                       is_realtime?: false,
                                       device: nil,
                                       sub_location: nil,
                                       created_at: nil,
                                       updated_at: nil)
        
        row = CsvExportService.send(:build_measurement_row, measurement_with_nils)
        
        # Should handle nil values without error
        expect(row[2]).to be_nil  # measurementtime
        expect(row[5]).to be_nil  # device_serial
        expect(row[11]).to be_nil # created_at
      end
    end
  end
end