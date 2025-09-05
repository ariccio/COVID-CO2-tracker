# frozen_string_literal: true

require 'zip'

class Api::V1::ExportsController < Api::BaseController
  include ActionController::Live
  include ExportAuthentication
  include ExportRateLimiting

  skip_before_action :authenticate_export_token, only: [:options]
  skip_before_action :check_export_rate_limit, only: [:options]
  before_action :validate_export_params, except: [:options]
  before_action :validate_date_range, only: [:index, :download]

  rescue_from ActiveRecord::StatementInvalid, with: :handle_database_error
  rescue_from Export::BaseService::ExportError, with: :handle_export_error

  def index
    format = params[:format_type] || 'csv'
    fields = parse_fields(params[:fields])
    filters = build_filters(params)

    # For JSON format (not JSONL), return structured response
    if format == 'json'
      render_json_export(fields, filters)
    else
      # Check cache first for other formats
      cache_key = build_cache_key(format, fields, filters)

      if stale_cache?(cache_key)
        stream_export(format, fields, filters)
      else
        # Return cached response with proper headers
        render_cached_export(cache_key)
      end
    end
  end

  def download
    format = params[:format_type] || 'csv'
    fields = parse_fields(params[:fields])
    filters = build_filters(params)

    # Use Rails conditional GET support from enhancement doc
    last_measurement = Measurement.maximum(:updated_at)

    if stale?(last_modified: last_measurement&.utc, public: false)
      stream_export_download(format, fields, filters)
    end
  end

  # Handle CORS preflight OPTIONS requests
  def options
    # Preflight requests should return empty body with CORS headers
    head :ok
  end

  private

  def render_json_export(fields, filters)
    @export_token.record_usage!

    service = Export::JsonService.new(filters)
    result_json = service.export(fields:, format_type: 'json')
    result = JSON.parse(result_json) if result_json.is_a?(String)

    render json: result, status: :ok
  rescue StandardError => e
    Rails.logger.error "JSON export error: #{e.message}"
    render json: { error: 'Export failed' }, status: :internal_server_error
  end

  # Authentication and rate limiting moved to concerns

  def validate_export_params
    format = params[:format_type] || 'csv'

    unless %w[csv jsonl json yaml multi_csv].include?(format)
      render json: { error: "Unsupported format: #{format}" }, status: :bad_request
      return
    end

    unless @export_token.can_export_format?(format)
      render json: { error: "Token not authorized for format: #{format}" }, status: :forbidden
    end
  end

  def validate_date_range
    from = params[:from]
    to = params[:to]

    return unless from.present? && to.present?

    begin
      from_date = Date.parse(from.to_s)
      to_date = Date.parse(to.to_s)

      if from_date > to_date
        render json: { error: 'Invalid date range: from date cannot be after to date' }, status: :bad_request
      end
    rescue ArgumentError
      render json: { error: 'Invalid date format' }, status: :bad_request
    end
  end

  def handle_database_error(exception)
    Rails.logger.error "Database error during export: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")
    render json: { error: 'Export failed' }, status: :internal_server_error
  end

  def handle_export_error(exception)
    Rails.logger.error "Export error: #{exception.message}"

    # Determine appropriate status code based on error type
    status = case exception.message
             when /memory|resource/i
               :service_unavailable
             when /Invalid|exceeds maximum|date range/i
               :unprocessable_entity
             when /Unauthorized|token/i
               :unauthorized
             else
               :internal_server_error
             end

    # Never include raw user input in error messages (security)
    # But we can provide specific error types without exposing the input
    safe_message = case status
                   when :unprocessable_entity
      # Provide specific error type without exposing user input
                     if exception.message.include?('date')
                       'Invalid date format'
                     elsif exception.message.include?('exceeds maximum')
                       'Request exceeds maximum limits'
                     else
                       'Invalid export parameters'
                     end
                   when :service_unavailable
                     'Service temporarily unavailable'
                   when :unauthorized
                     'Authentication required'
                   else
                     'Export failed'
                   end

    render json: { error: safe_message }, status:
  end

  def stream_export(format, fields, filters)
    response.headers['Content-Type'] = content_type_for(format)
    response.headers['Cache-Control'] = 'public, max-age=300'
    response.headers['X-Accel-Buffering'] = 'no' # Disable nginx buffering
    response.headers['Transfer-Encoding'] = 'chunked' if format == 'csv'

    # Record token usage
    @export_token.record_usage!

    # Track resources for cleanup
    exporter = nil

    begin
      exporter = exporter_for(format).new(filters)
      record_count = 0

      # Validate memory before starting to stream
      exporter.validate_safety! if exporter.respond_to?(:validate_safety!)

      # Start streaming after validation passes
      response.stream.write ''

      if format == 'jsonl'
        # Use streaming for JSONL
        exporter.stream_measurements(filters, fields:).each do |line|
          # Check if client is still connected
          begin
            response.stream.write(line)
            record_count += 1
          rescue IOError, Errno::EPIPE, Errno::ECONNRESET => e
            Rails.logger.warn "Export stream interrupted after #{record_count} records: #{e.class.name}"
            raise IOError, "Client disconnected during export"
          end

          next unless record_count >= @export_token.max_records

          response.stream.write("#{({
            warning: "Export limited to #{@export_token.max_records} records"
          }.to_json)}\n")
          break
        end
      elsif format == 'multi_csv'
        # Stream ZIP file for multi-CSV
        response.headers['Content-Type'] = 'application/zip'
        response.headers['Content-Disposition'] = 'attachment; filename="co2_export_multi.zip"'
        response.headers['Transfer-Encoding'] = 'chunked'

        # Use ZipGenerator service to create and stream ZIP
        zip_generator = Export::ZipGenerator.new(@export_token, filters)
        zip_generator.generate_to_stream(response.stream)
      else
        # Use standard export for CSV
        exporter.export_measurements(response.stream, filters, fields:)
      end

      # Cache the result for future requests
      cache_export_metadata(format, fields, filters, record_count)

    rescue IOError, Errno::EPIPE => e
      # Client disconnected during streaming
      Rails.logger.warn "Client disconnected during export: #{e.message}"
      # Don't cache incomplete results
    rescue StandardError => e
      # Log other errors
      Rails.logger.error "Export streaming error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise
    ensure
      # Ensure all resources are properly cleaned up
      begin
        response.stream.close
      rescue StandardError
        nil
      end

      # Ensure exporter cleanup if it has cleanup methods
      if exporter.respond_to?(:cleanup)
        begin
          exporter.cleanup
        rescue StandardError
          nil
        end
      end

      # Force garbage collection for large exports to free memory immediately
      if record_count && record_count > 10_000
        GC.start
      end
    end
  end

  def stream_export_download(format, fields, filters)
    filename = "co2_export_#{Time.current.strftime('%Y%m%d_%H%M%S')}.#{format}"

    response.headers['Content-Type'] = content_type_for(format)
    response.headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
    response.headers['X-Accel-Buffering'] = 'no'

    stream_export(format, fields, filters)
  end

  def render_cached_export(cache_key)
    cached_data = Rails.cache.read(cache_key)

    if cached_data
      response.headers['X-Cache'] = 'HIT'
      response.headers['Content-Type'] = cached_data[:content_type]

      send_data cached_data[:content],
                filename: cached_data[:filename],
                type: cached_data[:content_type],
                disposition: 'inline'
    else
      # Cache miss, generate fresh
      response.headers['X-Cache'] = 'MISS'
      format = params[:format_type] || 'csv'
      fields = parse_fields(params[:fields])
      filters = build_filters(params)
      stream_export(format, fields, filters)
    end
  end

  def parse_fields(fields_param)
    return Export::BaseService::DEFAULT_FIELDS if fields_param.blank?
    return Export::BaseService::ALLOWED_FIELDS if fields_param == 'all'

    requested = fields_param.to_s.split(',').map(&:strip)
    requested & Export::BaseService::ALLOWED_FIELDS
  end

  def build_filters(params)
    {
      from: params[:from],
      to: params[:to],
      place_id: params[:place_id],
      device_id: params[:device_id],
      above_ppm: params[:above_ppm]&.to_i,
      below_ppm: params[:below_ppm]&.to_i
    }.compact
  end

  def build_cache_key(format, fields, filters)
    # Include latest measurement timestamp for automatic invalidation
    latest_measurement = Measurement.maximum(:updated_at)

    [
      'export',
      format,
      latest_measurement&.to_i,
      Digest::MD5.hexdigest("#{fields.sort.join(',')}:#{filters.to_json}")
    ].join('/')
  end

  def stale_cache?(cache_key)
    !Rails.cache.exist?(cache_key)
  end

  def cache_export_metadata(format, fields, filters, record_count)
    cache_key = build_cache_key(format, fields, filters)

    # Determine cache duration based on filters (from enhancement doc)
    cache_duration = if filters[:from] && Date.parse(filters[:from].to_s) < 30.days.ago
                       24.hours # Historical data changes less
                     elsif filters[:above_ppm] && filters[:above_ppm] > 1500
                       5.minutes # High CO2 alerts need freshness
                     else
                       15.minutes # Default
                     end

    Rails.cache.write(
      cache_key,
      {
        format:,
        record_count:,
        generated_at: Time.current,
        expires_at: cache_duration.from_now
      },
      expires_in: cache_duration
    )
  end

  def exporter_for(format)
    case format
    when 'csv'
      Export::CsvService
    when 'jsonl', 'json'
      Export::JsonlService
    when 'multi_csv'
      Export::MultiCsvService
    else
      raise "Unsupported format: #{format}"
    end
  end

  # Helper methods for multi-CSV ZIP export
  # ZIP generation methods moved to Export::ZipGenerator service

  def apply_filters_to_query(query, filters)
    query = query.where(measurements: { measurementtime: (filters[:from]).. }) if filters[:from].present?
    query = query.where(measurements: { measurementtime: ..(filters[:to]) }) if filters[:to].present?
    query = query.joins(sub_location: :place).where(places: { google_place_id: filters[:place_id] }) if filters[:place_id].present?
    query = query.where(measurements: { device_id: filters[:device_id] }) if filters[:device_id].present?
    query = query.where('measurements.co2ppm > ?', filters[:above_ppm]) if filters[:above_ppm].present?
    query = query.where(measurements: { co2ppm: ...(filters[:below_ppm]) }) if filters[:below_ppm].present?
    query
  end

  def content_type_for(format)
    case format
    when 'csv'
      'text/csv; charset=utf-8'
    when 'jsonl'
      'application/x-ndjson; charset=utf-8'
    when 'json'
      'application/json; charset=utf-8'
    when 'yaml'
      'application/x-yaml; charset=utf-8'
    when 'multi_csv'
      'application/zip'
    else
      'application/octet-stream'
    end
  end
end
