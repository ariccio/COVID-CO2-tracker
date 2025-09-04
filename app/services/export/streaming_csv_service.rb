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
        value = case field
                when 'measurement_id'
                  measurement.id
                when 'co2_ppm'
                  measurement.co2ppm
                when 'timestamp'
                  format_timestamp(measurement.measurementtime)
                when 'crowding'
                  measurement.crowding
                when 'lat'
                  measurement.sub_location&.place&.place_lat
                when 'lng'
                  measurement.sub_location&.place&.place_lng
                when 'place_name'
                  sanitize_for_export(measurement.sub_location&.description)
                when 'place_google_id'
                  sanitize_for_export(measurement.sub_location&.place&.google_place_id)
                when 'device_serial'
                  sanitize_for_export(measurement.device&.serial)
                when 'device_model'
                  sanitize_for_export(measurement.device&.model&.name)
                when 'manufacturer'
                  sanitize_for_export(measurement.device&.model&.manufacturer&.name)
                when 'is_realtime'
                  measurement.realtime? || false
                when 'user_name'
                  sanitize_for_export(measurement.device&.user&.name)
                end

        # CSV-safe formatting
        value.nil? ? '' : value.to_s
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