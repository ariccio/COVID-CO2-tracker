#!/usr/bin/env ruby
# frozen_string_literal: true

# Test export functionality locally
# Usage: rails runner scripts/test_export_local.rb

require 'tempfile'

puts '=' * 60
puts 'Testing Export System Locally'
puts '=' * 60

# 1. Test basic data availability
puts "\n1. Database Check:"
puts "   Measurements: #{Measurement.count}"
puts "   Devices: #{Device.count}"
puts "   Users: #{User.count}"
puts "   Places: #{Place.count}"

# 2. Test CSV export with default fields
puts "\n2. CSV Export (default fields):"
service = Export::CsvService.new({})
csv_content = service.export_to_string
lines = csv_content.lines
puts "   Lines: #{lines.count}"
puts "   Header: #{lines.first.chomp}"
puts "   First data row: #{lines[1]&.chomp}"

# 3. Test CSV export with all fields
puts "\n3. CSV Export (all fields):"
all_fields = Export::BaseService::ALLOWED_FIELDS
service = Export::CsvService.new({})
csv_content = service.export_to_string({}, fields: all_fields)
lines = csv_content.lines
puts "   Lines: #{lines.count}"
puts "   Header: #{lines.first.chomp}"
puts "   First data row: #{lines[1]&.chomp}"

# 4. Test JSON export
puts "\n4. JSON Export:"
service = Export::JsonService.new({})
json_content = service.export(fields: all_fields)
json_data = JSON.parse(json_content)
puts "   Total records: #{json_data['measurements'].count}"
puts "   Fields present: #{json_data['measurements'].first&.keys&.join(', ')}"

# 5. Test ZIP generation
puts "\n5. ZIP File Generation:"
Tempfile.open(['export', '.zip'], binmode: true) do |tempfile|
  puts "   Creating ZIP at: #{tempfile.path}"

  # Create a simple token for testing
  token = ExportToken.first || ExportToken.create!(
    token_hash: SecureRandom.hex(32),
    description: 'Test token',
    permissions: { formats: ['multi_csv'] }
  )

  generator = Export::ZipGenerator.new(token, {})

  # Use a StringIO to capture output
  require 'stringio'
  output = StringIO.new
  output.binmode

  begin
    generator.generate_to_stream(output)
    output.rewind

    # Write to tempfile to test
    tempfile.write(output.read)
    tempfile.rewind

    puts "   ZIP size: #{tempfile.size} bytes"

    # Try to read the ZIP
    require 'zip'
    Zip::File.open(tempfile.path) do |zip_file|
      puts '   Entries in ZIP:'
      zip_file.each do |entry|
        puts "     - #{entry.name} (#{entry.size} bytes)"
      end
    end
  rescue StandardError => e
    puts "   ERROR: #{e.message}"
    puts "   Backtrace: #{e.backtrace.first(3).join("\n              ")}"
  end
end

# 6. Test controller parsing
puts "\n6. Controller Field Parsing:"
controller = Api::V1::ExportsController.new

# Simulate parsing
test_cases = [
  [nil, 'Expected: DEFAULT_FIELDS'],
  ['', 'Expected: DEFAULT_FIELDS'],
  ['all', 'Expected: ALLOWED_FIELDS'],
  ['co2_ppm,timestamp', 'Expected: [co2_ppm, timestamp]'],
  ['invalid,co2_ppm', 'Expected: [co2_ppm] (invalid removed)']
]

test_cases.each do |input, expected|
  # Use send to access private method
  result = controller.send(:parse_fields, input)
  puts "   Input: #{input.inspect} -> #{result.inspect} (#{expected})"
end

puts "\n" + ('=' * 60)
puts 'Export System Test Complete'
puts '=' * 60