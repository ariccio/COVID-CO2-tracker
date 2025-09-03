# frozen_string_literal: true

require 'csv'

module Export
  class CsvService < BaseService
    BATCH_SIZE = 1000

    def export(fields: nil)
      validate_safety!
      export_to_string(@filters, fields: fields || @filters[:fields])
    end

    def perform(fields: nil)
      export(fields:)
    end

    def export_measurements(output_stream, filters = @filters, fields: nil)
      start_time = Time.current
      record_count = 0

      begin
        log_export_start('csv')

        # Parse and validate fields
        requested_fields = parse_fields(fields)

        # Write headers
        write_line(output_stream, CSV.generate_line(requested_fields))

        # Stream data in batches for memory efficiency
        measurements_query(filters).find_each(batch_size: BATCH_SIZE) do |measurement|
          row_data = build_csv_row(measurement, requested_fields)
          write_line(output_stream, CSV.generate_line(row_data))
          record_count += 1

          # Check memory periodically
          if (record_count % 5000).zero? && ENV['DYNO'].present?
            validate_safety!
          end
        end

        duration = Time.current - start_time
        log_export_complete('csv', record_count, duration)

        record_count
      rescue StandardError => e
        log_export_error('csv', e)
        raise
      end
    end

    def export_to_file(file_path, filters = @filters, fields: nil)
      File.open(file_path, 'w') do |file|
        export_measurements(file, filters, fields:)
      end
    end

    def export_to_string(filters = @filters, fields: nil)
      output = StringIO.new
      export_measurements(output, filters, fields:)
      output.string
    end

    private

    def write_line(stream, content)
      if stream.respond_to?(:write)
        stream.write(content)
      else
        stream.puts(content.chomp)
      end
    end

    def csv_headers
      %w[
        measurement_id co2_ppm timestamp crowding
        lat lng place_name place_google_id
        device_serial device_model manufacturer
        is_realtime
      ]
    end

    def build_csv_row(measurement, headers)
      data = build_measurement_data(measurement)

      # Return values in the same order as headers
      headers.map do |header|
        key = header.to_s.to_sym
        value = data[key]

        # Format specific values for CSV
        case key
        when :is_realtime
          value ? 'true' : 'false'
        when :lat, :lng
          value&.to_f&.round(6)
        else
          value
        end
      end
    end

    def parse_fields(fields)
      return DEFAULT_FIELDS if fields.blank?
      return ALLOWED_FIELDS if fields == 'all'

      if fields.is_a?(Array)
        valid_fields = fields & ALLOWED_FIELDS
        valid_fields.empty? ? DEFAULT_FIELDS : valid_fields
      else
        DEFAULT_FIELDS
      end
    end
  end
end