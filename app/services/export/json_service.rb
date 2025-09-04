# frozen_string_literal: true

module Export
  class JsonService < BaseService
    def export(fields: nil, format_type: 'json')
      validate_safety!

      # Parse requested fields
      requested_fields = parse_fields(fields || @filters[:fields])

      # Build and execute query
      measurements = measurements_query(@filters)

      # Format based on type
      if format_type == 'jsonl'
        export_jsonl(measurements, requested_fields)
      else
        export_json(measurements, requested_fields)
      end
    end

    def perform(fields: nil, format_type: 'json')
      export(fields:, format_type:)
    end

    private

    def export_json(measurements, fields)
      log_export_start('json')
      start_time = Time.current

      measurement_data = measurements.map do |measurement|
        format_measurement_for_json(measurement, fields)
      end

      result = {
        measurements: measurement_data,
        metadata: build_metadata(measurement_data.size)
      }.to_json

      log_export_complete('json', measurement_data.size, Time.current - start_time)
      result
    rescue StandardError => e
      log_export_error('json', e)
      raise
    end

    def export_jsonl(measurements, fields)
      log_export_start('jsonl')
      start_time = Time.current
      count = 0

      result = measurements.map do |measurement|
        count += 1
        format_measurement_for_json(measurement, fields).to_json
      end.join("\n")

      log_export_complete('jsonl', count, Time.current - start_time)
      result
    rescue StandardError => e
      log_export_error('jsonl', e)
      raise
    end

    def format_measurement_for_json(measurement, fields)
      data = {}

      fields.each do |field|
        data[field] = case field
                      when 'measurement_id'
                        measurement.id
                      when 'co2_ppm'
                        measurement.co2ppm
                      when 'timestamp'
                        format_timestamp(measurement.measurementtime)
                      when 'crowding'
                        measurement.crowding
                      when 'lat'
                        measurement.sub_location&.place&.place_lat&.to_f
                      when 'lng'
                        measurement.sub_location&.place&.place_lng&.to_f
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
      end

      data
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

    def build_metadata(record_count)
      {
        total_records: record_count,
        export_time: Time.current.iso8601,
        filters: @filters || {}
      }
    end
  end
end