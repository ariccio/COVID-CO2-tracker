# frozen_string_literal: true

require 'open3'

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
    # MAX_DATE_RANGE_DAYS removed - no limit on export date range
    MAX_MEMORY_MB = ENV.fetch('MAX_EXPORT_MEMORY_MB', 450).to_i

    def initialize(filters = {})
      @filters = filters
      validate_filters!
    end

    protected

    def measurements_query(filters = @filters)
      return Export::QueryBuilder.new.build(filters:)
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
        Rails.logger.error("Export aborted: Memory usage #{memory_mb}MB exceeds safe threshold")
        raise ExportError, 'Insufficient memory for export operation'
      end

      # Enforce maximum export size limit
      query = measurements_query(@filters)
      estimated_count = estimate_query_count(query, MAX_EXPORT_RECORDS + 1)

      if estimated_count > MAX_EXPORT_RECORDS
        raise ExportError, "Export size exceeds maximum of #{MAX_EXPORT_RECORDS} records"
      end
    end

    def estimate_query_count(query, limit)
      # Use more efficient counting based on whether query is loaded
      # For loaded relations, use size; for unloaded, use limit + count
      if query.respond_to?(:loaded?) && query.loaded?
        Rails.logger.info('Export safety: Using size on already loaded query')
        return query.size
      else
        # Use limit to avoid counting entire table
        Rails.logger.info('Export safety: Using count with limit for unloaded query')
        return query.limit(limit).count
      end
    end

    def current_memory_usage_mb
      pid = Process.pid

      # Try ps command first (works on most Unix-like systems including Heroku)
      memory_mb = memory_usage_from_ps(pid)
      return memory_mb if memory_mb

      # Fallback: try /proc filesystem (Linux)
      return memory_usage_from_proc_filesystem(pid)
    end

    def memory_usage_from_ps(pid)
      stdout, stderr, status = Open3.capture3('ps', '-o', 'rss=', '-p', pid.to_s)

      if status.success?
        memory_kb = stdout.strip.to_i
        if memory_kb.positive?
          return memory_kb / 1024
        else
          Rails.logger.warn("Memory check: ps returned zero or invalid value: #{stdout.inspect} for pid #{pid}")
        end
      else
        Rails.logger.warn("Memory check: ps command failed with status #{status.exitstatus}: #{stderr} for pid #{pid}")
      end

      return nil
    end

    def memory_usage_from_proc_filesystem(pid)
      proc_status_path = "/proc/#{pid}/status"

      unless File.exist?(proc_status_path)
        # Unable to determine memory usage - fail the export for safety
        Rails.logger.error("Memory check failed for pid #{pid}: ps command failed, then /proc/#{pid}/status does not exist")
        raise ExportError, "Unable to determine memory usage for safety check (pid #{pid}): ps failed, then /proc/#{pid}/status not found"
      end

      begin
        memory_mb = extract_memory_from_proc_status(proc_status_path, pid)
        return memory_mb if memory_mb

        # Got through the file but didn't find VmRSS
        Rails.logger.error("Memory check failed for pid #{pid}: ps command failed, then VmRSS not found in /proc/#{pid}/status")
        raise ExportError, "Unable to determine memory usage for safety check (pid #{pid}): ps failed, then VmRSS not found in /proc/#{pid}/status"
      rescue StandardError => e
        Rails.logger.error("Memory check failed for pid #{pid}: ps command failed, then reading /proc/#{pid}/status failed: #{e.message}")
        raise ExportError, "Unable to determine memory usage for safety check (pid #{pid}): ps failed, then reading /proc/#{pid}/status failed: #{e.message}"
      end
    end

    def extract_memory_from_proc_status(proc_status_path, pid)
      File.readlines(proc_status_path).each do |line|
        next unless line.start_with?('VmRSS:')

        memory_kb = line.split[1].to_i
        if memory_kb.positive?
          Rails.logger.info("Memory check: Using /proc/status fallback for pid #{pid}, found #{memory_kb / 1024}MB")
          return memory_kb / 1024
        end
      end

      return nil
    end

    def validate_filters!
      # Ensure date ranges are reasonable
      validate_date_range(@filters[:from], @filters[:to])

      # Validate CO2 thresholds with explicit nil and conversion checks
      validate_above_ppm_threshold(@filters)
      validate_below_ppm_threshold(@filters)
      validate_co2_range(@filters)
    end

    def validate_date_range(from_filter, to_filter)
      return unless from_filter && to_filter

      from_date = parse_date(from_filter)
      to_date = parse_date(to_filter)

      # Date range validation - removed day limit per TODO
      if from_date > to_date
        raise ExportError, "Invalid date range: 'from' date must be before 'to' date"
      end
    end

    def validate_above_ppm_threshold(filters)
      return unless filters.key?(:above_ppm)

      if filters[:above_ppm].nil?
        raise ExportError, "Invalid CO2 threshold: 'above_ppm' parameter is present but nil"
      end

      above_ppm = filters[:above_ppm].to_i
      if above_ppm.negative?
        raise ExportError, "Invalid CO2 threshold: 'above_ppm' must be non-negative (got #{filters[:above_ppm]})"
      end
    end

    def validate_below_ppm_threshold(filters)
      return unless filters.key?(:below_ppm)

      if filters[:below_ppm].nil?
        raise ExportError, "Invalid CO2 threshold: 'below_ppm' parameter is present but nil"
      end

      below_ppm = filters[:below_ppm].to_i
      if below_ppm.negative?
        raise ExportError, "Invalid CO2 threshold: 'below_ppm' must be non-negative (got #{filters[:below_ppm]})"
      end
    end

    def validate_co2_range(filters)
      return unless filters[:above_ppm] && filters[:below_ppm]

      above_ppm = filters[:above_ppm].to_i
      below_ppm = filters[:below_ppm].to_i

      if above_ppm >= below_ppm
        raise ExportError, "Invalid CO2 range: 'above_ppm' (#{above_ppm}) must be less than 'below_ppm' (#{below_ppm})"
      end
    end

    def parse_date(date_param)
      return date_param if date_param.is_a?(Date) || date_param.is_a?(Time)

      begin
        return Date.parse(date_param.to_s)
      rescue ArgumentError
        raise ExportError, "Invalid date format: #{date_param}"
      end
    end

    def sanitize_for_export(value)
      return '' if value.nil?

      return value.to_s.strip
    end

    def format_timestamp(time)
      return '' if time.nil?

      return time.iso8601
    end

    def build_measurement_data(measurement)
      return {
        measurement_id: measurement.id,
        co2_ppm: measurement.co2ppm,
        timestamp: format_timestamp(measurement.measurementtime),
        crowding: measurement.crowding,
        lat: extract_measurement_latitude(measurement),
        lng: extract_measurement_longitude(measurement),
        place_name: extract_measurement_place_name(measurement),
        place_google_id: extract_measurement_place_google_id(measurement),
        device_serial: extract_measurement_device_serial(measurement),
        device_model: extract_measurement_device_model_name(measurement),
        manufacturer: extract_measurement_manufacturer_name(measurement),
        is_realtime: measurement.realtime?,
        user_name: extract_measurement_user_name(measurement)
      }
    end

    def extract_measurement_latitude(measurement)
      return measurement.sub_location&.place&.place_lat
    end

    def extract_measurement_longitude(measurement)
      return measurement.sub_location&.place&.place_lng
    end

    def extract_measurement_place_name(measurement)
      return sanitize_for_export(measurement.sub_location&.description)
    end

    def extract_measurement_place_google_id(measurement)
      return sanitize_for_export(measurement.sub_location&.place&.google_place_id)
    end

    def extract_measurement_device_serial(measurement)
      return sanitize_for_export(measurement.device&.serial)
    end

    def extract_measurement_device_model_name(measurement)
      device_model = measurement.device&.model
      return sanitize_for_export(device_model&.name)
    end

    def extract_measurement_manufacturer_name(measurement)
      device_model = measurement.device&.model
      manufacturer_name = device_model&.manufacturer&.name
      return sanitize_for_export(manufacturer_name)
    end

    def extract_measurement_user_name(measurement)
      return sanitize_for_export(measurement.device&.user&.name)
    end

    def log_export_start(format)
      return Rails.logger.info({
        event: 'export_started',
        format:,
        filters: @filters.slice(:from, :to, :place_id, :above_ppm, :below_ppm),
        timestamp: Time.current
      }.to_json)
    end

    def log_export_complete(format, record_count, duration)
      return Rails.logger.info({
        event: 'export_completed',
        format:,
        records: record_count,
        duration_seconds: duration,
        timestamp: Time.current
      }.to_json)
    end

    def log_export_error(format, error)
      return Rails.logger.error({
        event: 'export_failed',
        format:,
        error: error.message,
        error_class: error.class.name,
        timestamp: Time.current
      }.to_json)
    end
  end
end