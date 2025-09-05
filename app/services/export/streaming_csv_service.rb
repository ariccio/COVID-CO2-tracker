# frozen_string_literal: true

require 'csv'

module Export
  class StreamingCsvService < BaseService
    BATCH_SIZE = Rails.env.test? ? 3 : 1000 # Much smaller batch size for testing

    def stream(fields: nil)
      validate_safety!

      # Parse requested fields
      requested_fields = parse_fields(fields || @filters[:fields])

      log_export_start('streaming_csv')
      start_time = Time.current
      record_count = 0

      # Build query
      query = measurements_query(@filters)

      # Stream CSV header first
      header_csv = CSV.generate do |csv|
        csv << requested_fields
      end
      yield header_csv

      # Stream data in batches for memory efficiency
      query.find_in_batches(batch_size: BATCH_SIZE) do |batch|
        csv_chunk = CSV.generate do |csv|
          batch.each do |measurement|
            record_count += 1
            csv << format_measurement_for_csv(measurement, requested_fields)
          end
        end
        yield csv_chunk
      end

      log_export_complete('streaming_csv', record_count, Time.current - start_time)
    end

    def perform(fields: nil, &)
      stream(fields:, &)
    end

    private

    def format_measurement_for_csv(measurement, fields)
      fields.map do |field|
        value = extract_field_value_for_csv(measurement, field)
        # CSV-safe formatting
        value.nil? ? '' : value.to_s
      end
    end

    def extract_field_value_for_csv(measurement, field)
      case field
      when 'measurement_id'
        return measurement.id
      when 'co2_ppm'
        return measurement.co2ppm
      when 'timestamp'
        return format_timestamp(measurement.measurementtime)
      when 'crowding'
        return measurement.crowding
      when 'lat'
        return extract_measurement_latitude(measurement)
      when 'lng'
        return extract_measurement_longitude(measurement)
      when 'place_name'
        return sanitize_measurement_place_name_for_export(measurement)
      when 'place_google_id'
        return sanitize_measurement_google_place_id_for_export(measurement)
      when 'device_serial'
        return sanitize_measurement_device_serial_for_export(measurement)
      when 'device_model'
        return sanitize_measurement_device_model_name_for_export(measurement)
      when 'manufacturer'
        return sanitize_measurement_manufacturer_name_for_export(measurement)
      when 'is_realtime'
        return measurement.realtime? || false
      when 'user_name'
        return sanitize_measurement_user_name_for_export(measurement)
      end
    end

    def extract_measurement_latitude(measurement)
      return measurement.sub_location&.place&.place_lat
    end

    def extract_measurement_longitude(measurement)
      return measurement.sub_location&.place&.place_lng
    end

    def sanitize_measurement_place_name_for_export(measurement)
      return sanitize_for_export(measurement.sub_location&.description)
    end

    def sanitize_measurement_google_place_id_for_export(measurement)
      return sanitize_for_export(measurement.sub_location&.place&.google_place_id)
    end

    def sanitize_measurement_device_serial_for_export(measurement)
      return sanitize_for_export(measurement.device&.serial)
    end

    def sanitize_measurement_device_model_name_for_export(measurement)
      return sanitize_for_export(measurement.device&.model&.name)
    end

    def sanitize_measurement_manufacturer_name_for_export(measurement)
      device_model = measurement.device&.model
      manufacturer_name = device_model&.manufacturer&.name
      return sanitize_for_export(manufacturer_name)
    end

    def sanitize_measurement_user_name_for_export(measurement)
      return sanitize_for_export(measurement.device&.user&.name)
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