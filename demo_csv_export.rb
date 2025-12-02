#!/usr/bin/env ruby
# frozen_string_literal: true

# Demonstration script for CSV export functionality
# This script shows how to use the CsvExportService without requiring
# database setup, for testing and demonstration purposes.

require 'csv'
require 'fileutils'
require 'time'

# Mock models for demonstration
class MockMeasurement
  attr_accessor :id, :co2ppm, :measurementtime, :crowding, :device, :sub_location, :created_at, :updated_at
  
  def initialize(id, co2ppm, measurementtime, crowding)
    @id = id
    @co2ppm = co2ppm
    @measurementtime = measurementtime
    @crowding = crowding
    @created_at = Time.now
    @updated_at = Time.now
  end
  
  def is_realtime?
    false
  end
end

class MockDevice
  attr_accessor :serial, :model
  
  def initialize(serial, model)
    @serial = serial
    @model = model
  end
end

class MockModel
  attr_accessor :name, :manufacturer
  
  def initialize(name, manufacturer)
    @name = name
    @manufacturer = manufacturer
  end
end

class MockManufacturer
  attr_accessor :name
  
  def initialize(name)
    @name = name
  end
end

class MockPlace
  attr_accessor :place_lat, :place_lng
  
  def initialize(lat, lng)
    @place_lat = lat
    @place_lng = lng
  end
end

class MockSubLocation
  attr_accessor :description, :place
  
  def initialize(description, place)
    @description = description
    @place = place
  end
end

# Simplified CSV export logic for demonstration
class DemoCsvExport
  def self.export_demo_data(output_directory = '/tmp')
    puts "🚀 COVID-CO2-tracker CSV Export Demo"
    puts "===================================="
    puts
    
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    filename = "co2_measurements_demo_#{timestamp}.csv"
    filepath = File.join(output_directory, filename)
    
    puts "📁 Creating demo CSV export at: #{filepath}"
    puts
    
    # Create some sample data
    measurements = create_sample_measurements()
    
    puts "📊 Sample data created: #{measurements.length} measurements"
    puts
    
    # Export to CSV
    headers = [
      'measurement_id', 'co2_ppm', 'measurement_time', 'crowding_level',
      'is_realtime', 'device_serial', 'device_model', 'device_manufacturer',
      'place_latitude', 'place_longitude', 'sub_location_description',
      'created_at', 'updated_at'
    ]
    
    CSV.open(filepath, 'w', write_headers: true, headers: headers) do |csv|
      measurements.each do |measurement|
        csv << [
          measurement.id,
          measurement.co2ppm,
          measurement.measurementtime&.iso8601,
          measurement.crowding,
          measurement.is_realtime?,
          measurement.device&.serial,
          measurement.device&.model&.name,
          measurement.device&.model&.manufacturer&.name,
          measurement.sub_location&.place&.place_lat,
          measurement.sub_location&.place&.place_lng,
          measurement.sub_location&.description,
          measurement.created_at&.iso8601,
          measurement.updated_at&.iso8601
        ]
      end
    end
    
    puts "✅ Export completed successfully!"
    puts "📄 File: #{filepath}"
    puts "📊 Records exported: #{measurements.length}"
    puts
    
    # Display first few lines of the CSV
    puts "📋 Sample CSV content (first 5 lines):"
    puts "=" * 60
    File.readlines(filepath).first(5).each_with_index do |line, i|
      puts "#{i + 1}: #{line.chomp[0, 80]}#{'...' if line.length > 80}"
    end
    puts "=" * 60
    puts
    
    # Show file size
    file_size = File.size(filepath)
    puts "📏 File size: #{file_size} bytes (#{file_size / 1024.0}KB)"
    puts
    
    # Privacy check
    csv_content = File.read(filepath)
    puts "🔒 Privacy Check:"
    puts "  - Contains user emails: #{csv_content.include?('@') ? '❌ FAIL' : '✅ PASS'}"
    puts "  - Contains measurement data: #{csv_content.include?('co2_ppm') ? '✅ PASS' : '❌ FAIL'}"
    puts "  - Contains location data: #{csv_content.include?('place_latitude') ? '✅ PASS' : '❌ FAIL'}"
    puts
    
    {
      success: true,
      filepath: filepath,
      record_count: measurements.length,
      message: "Demo export completed successfully"
    }
  end
  
  private
  
  def self.create_sample_measurements
    # Create sample manufacturers, models and devices
    aranet = MockManufacturer.new('Aranet')
    sensirion = MockManufacturer.new('Sensirion')
    
    aranet4 = MockModel.new('Aranet4', aranet)
    scd30 = MockModel.new('SCD30', sensirion)
    
    device1 = MockDevice.new('AN4-123456', aranet4)
    device2 = MockDevice.new('SCD30-789012', scd30)
    
    # Create sample places and sub-locations
    office_place = MockPlace.new(40.7128, -74.0060)  # NYC coordinates
    home_place = MockPlace.new(37.7749, -122.4194)   # SF coordinates
    
    conference_room = MockSubLocation.new('Conference Room A', office_place)
    living_room = MockSubLocation.new('Living Room', home_place)
    
    # Create sample measurements
    measurements = []
    
    # Office measurements (higher CO2)
    base_time = Time.parse('2023-12-01 09:00:00')
    (1..15).each do |i|
      measurement = MockMeasurement.new(
        i,
        400 + (rand * 800).to_i,  # 400-1200 ppm
        base_time + (i * 30 * 60),  # 30 minutes in seconds
        rand(3) + 2  # crowding 2-4
      )
      measurement.device = device1
      measurement.sub_location = conference_room
      measurements << measurement
    end
    
    # Home measurements (lower CO2)
    (16..25).each do |i|
      measurement = MockMeasurement.new(
        i,
        350 + (rand * 400).to_i,  # 350-750 ppm
        base_time + (i * 45 * 60),  # 45 minutes in seconds
        rand(2) + 1  # crowding 1-2
      )
      measurement.device = device2
      measurement.sub_location = living_room
      measurements << measurement
    end
    
    measurements
  end
end

# Run the demo if this script is executed directly
if __FILE__ == $0
  output_dir = ARGV[0] || '/tmp'
  
  unless Dir.exist?(output_dir)
    puts "❌ Output directory does not exist: #{output_dir}"
    exit 1
  end
  
  unless File.writable?(output_dir)
    puts "❌ Output directory is not writable: #{output_dir}"
    exit 1
  end
  
  result = DemoCsvExport.export_demo_data(output_dir)
  
  if result[:success]
    puts "🎉 Demo completed successfully!"
    puts "💡 This demonstrates the CSV export format that would be generated"
    puts "   from real measurement data in the production database."
  else
    puts "❌ Demo failed: #{result[:error]}"
    exit 1
  end
end