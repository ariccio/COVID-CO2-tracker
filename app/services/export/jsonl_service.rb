require 'json'

module Export
  class JsonlService < BaseService
    BATCH_SIZE = 1000
    
    def export_measurements(output_stream, filters = @filters, fields: nil)
      start_time = Time.current
      record_count = 0
      
      begin
        log_export_start('jsonl')
        
        # Stream data in batches for memory efficiency
        measurements_query(filters).find_each(batch_size: BATCH_SIZE) do |measurement|
          json_data = build_json_record(measurement, fields)
          write_line(output_stream, json_data.to_json + "\n")
          record_count += 1
          
          # Check memory periodically
          if record_count % 5000 == 0 && ENV['DYNO'].present?
            validate_safety!
          end
        end
        
        duration = Time.current - start_time
        log_export_complete('jsonl', record_count, duration)
        
        record_count
      rescue => e
        log_export_error('jsonl', e)
        raise
      end
    end
    
    def export_to_file(file_path, filters = @filters, fields: nil)
      File.open(file_path, 'w') do |file|
        export_measurements(file, filters, fields: fields)
      end
    end
    
    def export_to_string(filters = @filters, fields: nil)
      output = StringIO.new
      export_measurements(output, filters, fields: fields)
      output.string
    end
    
    def stream_measurements(filters = @filters, fields: nil)
      Enumerator.new do |yielder|
        measurements_query(filters).find_each(batch_size: BATCH_SIZE) do |measurement|
          json_data = build_json_record(measurement, fields)
          yielder << json_data.to_json + "\n"
        end
      end
    end
    
    private
    
    def write_line(stream, content)
      if stream.respond_to?(:write)
        stream.write(content)
      else
        stream.puts(content.chomp)
      end
    end
    
    def build_json_record(measurement, fields)
      full_data = build_measurement_data(measurement)
      
      # If specific fields requested, filter the output
      if fields.present?
        field_symbols = fields.map(&:to_sym)
        full_data.select { |key, _| field_symbols.include?(key) }
      else
        full_data
      end
    end
  end
end