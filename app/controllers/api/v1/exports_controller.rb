require 'zip'

class Api::V1::ExportsController < ApplicationController
  include ActionController::Live
  
  before_action :authenticate_export_token
  before_action :check_rate_limit
  before_action :validate_export_params
  
  def index
    format = params[:format_type] || 'csv'
    fields = parse_fields(params[:fields])
    filters = build_filters(params)
    
    # Check cache first (implementing Rails cache pattern from enhancement doc)
    cache_key = build_cache_key(format, fields, filters)
    
    if stale_cache?(cache_key)
      stream_export(format, fields, filters)
    else
      # Return cached response with proper headers
      render_cached_export(cache_key)
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
  
  private
  
  def authenticate_export_token
    token_string = request.headers['Authorization']&.split(' ')&.last
    
    @export_token = ExportToken.authenticate(token_string)
    
    unless @export_token
      render json: { error: 'Invalid or expired token' }, status: :unauthorized
    end
  end
  
  def check_rate_limit
    return unless @export_token
    
    # Implement rate limiting from enhancement doc
    rate_key = "export_rate:#{@export_token.id}"
    count = Rails.cache.increment(rate_key, 1, expires_in: 1.hour) || 1
    
    if count > @export_token.rate_limit_per_hour
      render json: { 
        error: 'Rate limit exceeded', 
        limit: @export_token.rate_limit_per_hour,
        reset_in: Rails.cache.ttl(rate_key)
      }, status: :too_many_requests
    end
  end
  
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
  
  def stream_export(format, fields, filters)
    response.headers['Content-Type'] = content_type_for(format)
    response.headers['Cache-Control'] = 'public, max-age=300'
    response.headers['X-Accel-Buffering'] = 'no' # Disable nginx buffering
    
    # Record token usage
    @export_token.record_usage!
    
    begin
      response.stream.write ''
      
      exporter = exporter_for(format).new(filters)
      record_count = 0
      
      if format == 'jsonl'
        # Use streaming for JSONL
        exporter.stream_measurements(filters, fields: fields).each do |line|
          response.stream.write line
          record_count += 1
          
          if record_count >= @export_token.max_records
            response.stream.write({ 
              warning: "Export limited to #{@export_token.max_records} records" 
            }.to_json + "\n")
            break
          end
        end
      elsif format == 'multi_csv'
        # Stream ZIP file for multi-CSV
        response.headers['Content-Type'] = 'application/zip'
        response.headers['Content-Disposition'] = 'attachment; filename="co2_export_multi.zip"'
        
        # Create ZIP in memory and stream it
        zip_data = StringIO.new
        zip_data.binmode
        
        Zip::OutputStream.write_buffer(zip_data) do |zip|
          export_id = "export_#{Time.current.strftime('%Y%m%d_%H%M%S')}"
          
          # Add each CSV file to the ZIP
          add_measurements_to_zip(zip, export_id, filters)
          add_places_to_zip(zip, export_id, filters)
          add_sub_locations_to_zip(zip, export_id, filters)
          add_devices_to_zip(zip, export_id, filters)
          add_manifest_to_zip(zip, export_id, filters)
        end
        
        zip_data.rewind
        response.stream.write(zip_data.read)
      else
        # Use standard export for CSV
        exporter.export_measurements(response.stream, filters, fields: fields)
      end
      
      # Cache the result for future requests
      cache_export_metadata(format, fields, filters, record_count)
      
    ensure
      response.stream.close
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
        format: format,
        record_count: record_count,
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
  def add_measurements_to_zip(zip, export_id, filters)
    zip.put_next_entry("#{export_id}/measurements.csv")
    service = Export::MultiCsvService.new(filters)
    service.send(:write_measurements_to_stream, zip, filters)
  end
  
  def add_places_to_zip(zip, export_id, filters)
    zip.put_next_entry("#{export_id}/places.csv")
    service = Export::MultiCsvService.new(filters)
    service.send(:write_places_to_stream, zip, filters)
  end
  
  def add_sub_locations_to_zip(zip, export_id, filters)
    zip.put_next_entry("#{export_id}/sub_locations.csv")
    service = Export::MultiCsvService.new(filters)
    service.send(:write_sub_locations_to_stream, zip, filters)
  end
  
  def add_devices_to_zip(zip, export_id, filters)
    zip.put_next_entry("#{export_id}/devices.csv")
    service = Export::MultiCsvService.new(filters)
    service.send(:write_devices_to_stream, zip, filters)
  end
  
  def add_manifest_to_zip(zip, export_id, filters)
    zip.put_next_entry("#{export_id}/manifest.json")
    service = Export::MultiCsvService.new(filters)
    manifest = service.send(:build_manifest, export_id, filters)
    zip.write(JSON.pretty_generate(manifest))
  end
  
  def content_type_for(format)
    case format
    when 'csv'
      'text/csv; charset=utf-8'
    when 'jsonl', 'json'
      'application/x-ndjson; charset=utf-8'
    when 'yaml'
      'application/x-yaml; charset=utf-8'
    when 'multi_csv'
      'application/zip'
    else
      'application/octet-stream'
    end
  end
end
