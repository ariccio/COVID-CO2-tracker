# frozen_string_literal: true

module Export
  class BaseService
    class ExportError < StandardError; end

    ALLOWED_FIELDS = %w[
      measurement_id co2_ppm timestamp crowding
      lat lng place_name place_google_id
      device_serial device_model manufacturer
      is_realtime user_name
    ].freeze

    DEFAULT_FIELDS = %w[co2_ppm timestamp lat lng].freeze

    # Resource limits for security and performance
    MAX_EXPORT_RECORDS = ENV.fetch('MAX_EXPORT_RECORDS', 1_000_000).to_i
    MAX_DATE_RANGE_DAYS = ENV.fetch('MAX_EXPORT_DAYS', 365).to_i
    MAX_MEMORY_MB = ENV.fetch('MAX_EXPORT_MEMORY_MB', 450).to_i

    def initialize(filters = {})
      @filters = filters
      validate_filters!
    end

    protected

    def measurements_query(filters = @filters)
      Export::QueryBuilder.new.build(filters:)
    end

    def validate_safety!
      # Skip transaction check in test environment when using DatabaseCleaner
      # Ensure no DELETE/UPDATE permissions by checking we're not in a transaction
      if !Rails.env.test? && ActiveRecord::Base.connection.transaction_open?
        raise ExportError, 'Cannot export during an open transaction'
      end

      # Check memory usage
      memory_mb = current_memory_usage_mb
      if memory_mb > MAX_MEMORY_MB
        Rails.logger.error "Export aborted: Memory usage #{memory_mb}MB exceeds safe threshold"
        raise ExportError, 'Insufficient memory for export operation'
      end

      # Enforce maximum export size limit
      query = measurements_query(@filters)
      estimated_count = query.limit(MAX_EXPORT_RECORDS + 1).count
      if estimated_count > MAX_EXPORT_RECORDS
        raise ExportError, "Export size exceeds maximum of #{MAX_EXPORT_RECORDS} records"
      end
    end

    def current_memory_usage_mb
      if ENV['DYNO'].present?
        # Heroku environment
        `ps -o rss= -p #{Process.pid}`.to_i / 1024
      else
        # Generic Unix/Linux
        begin
          (`ps -o rss= -p #{Process.pid}`.to_i / 1024)
        rescue StandardError
          0
        end
      end
    end

    def validate_filters!
      # Ensure date ranges are reasonable
      if @filters[:from] && @filters[:to]
        from_date = parse_date(@filters[:from])
        to_date = parse_date(@filters[:to])

        # Enforce maximum date range for resource protection
        days_diff = (to_date - from_date).to_i
        if days_diff > MAX_DATE_RANGE_DAYS
          raise ExportError, "Date range exceeds maximum of #{MAX_DATE_RANGE_DAYS} days"
        end

        if from_date > to_date
          raise ExportError, "Invalid date range: 'from' date must be before 'to' date"
        end

        days = (to_date - from_date).to_i
        if days > 365
          raise ExportError, 'Date range too large (max 365 days)'
        end
      end

      # Validate CO2 thresholds
      if @filters[:above_ppm]&.to_i&.negative?
        raise ExportError, 'Invalid CO2 threshold: must be non-negative'
      end

      if @filters[:below_ppm]&.to_i&.negative?
        raise ExportError, 'Invalid CO2 threshold: must be non-negative'
      end

      if @filters[:above_ppm] && @filters[:below_ppm] && @filters[:above_ppm].to_i >= (@filters[:below_ppm].to_i)
        raise ExportError, "Invalid CO2 range: 'above_ppm' must be less than 'below_ppm'"
      end
    end

    def parse_date(date_param)
      return date_param if date_param.is_a?(Date) || date_param.is_a?(Time)

      begin
        Date.parse(date_param.to_s)
      rescue ArgumentError
        raise ExportError, "Invalid date format: #{date_param}"
      end
    end

    def sanitize_for_export(value)
      return '' if value.nil?

      value.to_s.strip
    end

    def format_timestamp(time)
      return '' if time.nil?

      time.iso8601
    end

    def build_measurement_data(measurement)
      {
        measurement_id: measurement.id,
        co2_ppm: measurement.co2ppm,
        timestamp: format_timestamp(measurement.measurementtime),
        crowding: measurement.crowding,
        lat: measurement.sub_location&.place&.place_lat,
        lng: measurement.sub_location&.place&.place_lng,
        place_name: sanitize_for_export(measurement.sub_location&.description),
        place_google_id: sanitize_for_export(measurement.sub_location&.place&.google_place_id),
        device_serial: sanitize_for_export(measurement.device&.serial),
        device_model: sanitize_for_export(measurement.device&.model&.name),
        manufacturer: sanitize_for_export(measurement.device&.model&.manufacturer&.name),
        is_realtime: measurement.is_realtime?,
        user_name: sanitize_for_export(measurement.device&.user&.name)
      }
    end

    def log_export_start(format)
      Rails.logger.info({
        event: 'export_started',
        format:,
        filters: @filters.slice(:from, :to, :place_id, :above_ppm, :below_ppm),
        timestamp: Time.current
      }.to_json)
    end

    def log_export_complete(format, record_count, duration)
      Rails.logger.info({
        event: 'export_completed',
        format:,
        records: record_count,
        duration_seconds: duration,
        timestamp: Time.current
      }.to_json)
    end

    def log_export_error(format, error)
      Rails.logger.error({
        event: 'export_failed',
        format:,
        error: error.message,
        error_class: error.class.name,
        timestamp: Time.current
      }.to_json)
    end
  end
end