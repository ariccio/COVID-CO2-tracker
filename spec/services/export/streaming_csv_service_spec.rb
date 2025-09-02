# frozen_string_literal: true

require 'rails_helper'

RSpec.describe(Export::StreamingCsvService) do
  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user: user, serial: 'TEST123') }
  let(:place) { create(:place, place_lat: 40.7128, place_lng: -74.0060) }
  let(:sub_location) { create(:sub_location, place: place, description: 'Test Location') }
  
  describe('#stream') do
    let!(:measurements) do
      10.times.map do |i|
        create(:measurement,
          device: device,
          sub_location: sub_location,
          co2ppm: 400 + (i * 100),
          measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.hours,
          crowding: i % 5
        )
      end
    end
    
    subject(:service) { described_class.new(filters) }
    
    context('with basic streaming') do
      let(:filters) { {} }
      let(:output_stream) { StringIO.new }
      
      it('streams CSV data in chunks') do
        chunks = []
        service.stream do |chunk|
          chunks << chunk
        end
        
        # Should have multiple chunks (header + data chunks)
        expect(chunks.size).to(be > 1)
        
        # First chunk should be the header
        expect(chunks.first).to(eq("co2_ppm,timestamp,lat,lng\n"))
        
        # Combine all chunks and verify content
        full_csv = chunks.join
        lines = full_csv.split("\n")
        expect(lines.size).to(eq(11)) # header + 10 measurements
      end
      
      it('yields data progressively') do
        yielded_times = []
        service.stream do |chunk|
          yielded_times << Time.current
          sleep 0.01 # Small delay to ensure timing differences
        end
        
        # Verify that chunks were yielded at different times (streaming)
        expect(yielded_times.size).to(be > 1)
        time_differences = yielded_times.each_cons(2).map { |a, b| b - a }
        expect(time_differences.any? { |diff| diff > 0 }).to(be true)
      end
    end
    
    context('with custom fields including user_name') do
      let(:filters) { { fields: %w[co2_ppm timestamp user_name device_serial] } }
      
      it('streams with specified fields') do
        chunks = []
        service.stream { |chunk| chunks << chunk }
        
        full_csv = chunks.join
        lines = full_csv.split("\n")
        
        expect(lines.first).to(eq('co2_ppm,timestamp,user_name,device_serial'))
        expect(lines[1]).to(include('Test User'))
        expect(lines[1]).to(include('TEST123'))
      end
    end
    
    context('with filters applied') do
      let(:filters) { { above_ppm: 800 } }
      
      it('streams only filtered data') do
        chunks = []
        service.stream { |chunk| chunks << chunk }
        
        full_csv = chunks.join
        lines = full_csv.split("\n")
        
        # Should have fewer lines due to filtering
        expect(lines.size).to(eq(7)) # header + 6 measurements >= 800
        
        # Verify all measurements meet the filter
        data_lines = lines[1..-1]
        data_lines.each do |line|
          co2_value = line.split(',').first.to_i
          expect(co2_value).to(be >= 800)
        end
      end
    end
    
    context('with large dataset') do
      before do
        # Create many more measurements
        100.times do |i|
          create(:measurement,
            device: device,
            sub_location: sub_location,
            co2ppm: 400 + (i * 5),
            measurementtime: Time.parse('2024-01-16 10:00:00 UTC') + i.minutes
          )
        end
      end
      
      let(:filters) { {} }
      
      it('handles large datasets with batching') do
        chunk_count = 0
        total_lines = 0
        
        service.stream do |chunk|
          chunk_count += 1
          total_lines += chunk.count("\n")
        end
        
        # Should have multiple chunks for large dataset
        expect(chunk_count).to(be > 2)
        
        # Should have all measurements + header
        expect(total_lines).to(eq(111)) # header + 110 measurements
      end
      
      it('maintains memory efficiency') do
        max_chunk_size = 0
        
        service.stream do |chunk|
          max_chunk_size = [max_chunk_size, chunk.bytesize].max
        end
        
        # Each chunk should be reasonably sized (not entire dataset at once)
        expect(max_chunk_size).to(be < 100_000) # Less than 100KB per chunk
      end
    end
    
    context('error handling during streaming') do
      let(:filters) { {} }
      
      it('handles block errors gracefully') do
        processed_chunks = []
        
        expect do
          service.stream do |chunk|
            processed_chunks << chunk
            raise 'Stream processing error' if processed_chunks.size == 3
          end
        end.to(raise_error('Stream processing error'))
        
        # Should have processed some chunks before error
        expect(processed_chunks.size).to(eq(3))
      end
    end
    
    context('with empty results') do
      let(:filters) { { above_ppm: 10000 } }
      
      it('streams header only') do
        chunks = []
        service.stream { |chunk| chunks << chunk }
        
        expect(chunks.size).to(eq(1))
        expect(chunks.first).to(eq("co2_ppm,timestamp,lat,lng\n"))
      end
    end
    
    context('batch processing verification') do
      let(:filters) { {} }
      
      it('processes in batches of configured size') do
        # Create exactly 1000 measurements (batch size)
        Measurement.destroy_all
        1000.times do |i|
          create(:measurement,
            device: device,
            sub_location: sub_location,
            co2ppm: 400 + i,
            measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.minutes
          )
        end
        
        chunk_counts = []
        service.stream do |chunk|
          # Count non-header chunks
          chunk_counts << chunk.count("\n") unless chunk.include?('co2_ppm,timestamp')
        end
        
        # Should have processed in one batch
        expect(chunk_counts.sum).to(eq(1000))
      end
    end
  end
  
  describe('memory safety') do
    let(:filters) { {} }
    
    it('checks memory usage before processing') do
      allow(ENV).to receive(:[]).with('DYNO').and_return('web.1')
      allow_any_instance_of(described_class).to receive(:`).with(/ps -o rss/).and_return('460800') # 450MB
      
      service = described_class.new(filters)
      
      expect { service.stream { |_| } }.to(raise_error(
        Export::BaseService::ExportError,
        'Insufficient memory for export operation'
      )
    end
  end
end