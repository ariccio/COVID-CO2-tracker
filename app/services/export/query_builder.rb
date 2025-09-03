# frozen_string_literal: true

module Export
  class QueryBuilder
    def build(base_scope: Measurement, fields: nil, filters: {})
      query = base_scope.includes(necessary_includes(fields))

      # Apply date filters
      query = apply_date_filters(query, filters)

      # Apply CO2 threshold filters
      query = apply_co2_filters(query, filters)

      # Apply location filters
      query = apply_location_filters(query, filters)

      # Order by measurement time for consistent exports
      query.order(measurementtime: :asc, id: :asc)
    end

    private

    def apply_date_filters(query, filters)
      if filters[:from]
        from_date = parse_date(filters[:from])
        # Use parameterized query with named placeholder for extra safety
        query = query.where(measurementtime: from_date.beginning_of_day..)
      end

      if filters[:to]
        to_date = parse_date(filters[:to])
        # Use parameterized query with named placeholder for extra safety
        query = query.where('measurementtime <= :to_date', to_date: to_date.end_of_day)
      end

      query
    end

    def apply_co2_filters(query, filters)
      if filters[:above_ppm]
        # Sanitize and use parameterized query with named placeholder
        ppm_value = filters[:above_ppm].to_i
        query = query.where('co2ppm > :ppm', ppm: ppm_value)
      end

      if filters[:below_ppm]
        # Sanitize and use parameterized query with named placeholder
        ppm_value = filters[:below_ppm].to_i
        query = query.where('co2ppm < :ppm', ppm: ppm_value)
      end

      query
    end

    def apply_location_filters(query, filters)
      if filters[:place_id]
        # Handle both numeric ID and google_place_id string
        if filters[:place_id].to_s.match?(/^\d+$/)
          # Numeric ID
          place_id = filters[:place_id].to_i
          query = query.joins(sub_location: :place)
                       .where(places: { id: place_id })
        else
          # Google place ID string - SECURITY: Sanitize to prevent SQL injection
          # ActiveRecord will parameterize this, but we add extra validation
          sanitized_place_id = filters[:place_id].to_s.gsub(/[';-]/, '')
          query = query.joins(sub_location: :place)
                       .where(places: { google_place_id: sanitized_place_id })
        end
      end

      if filters[:device_id]
        # Sanitize device_id before using in query
        device_id = filters[:device_id].to_i
        query = query.where(device_id:)
      end

      if filters[:device_serial]
        # Filter by device serial number
        query = query.joins(:device)
                     .where(devices: { serial: filters[:device_serial] })
      end

      query
    end

    def necessary_includes(fields)
      # Always include these for efficiency
      includes = []

      # Determine what to include based on requested fields
      if fields.nil? || fields.any? { |f| f.to_s.match?(/device|serial|model|manufacturer/) }
        includes << { device: { model: :manufacturer } }
      end

      if fields.nil? || fields.any? { |f| f.to_s.match?(/place|lat|lng|google/) }
        includes << { sub_location: :place }
      end

      if fields.nil? || fields.any? { |f| f.to_s == 'is_realtime' }
        includes << :extra_measurement_info
      end

      includes
    end

    def parse_date(date_param)
      return date_param if date_param.is_a?(Date) || date_param.is_a?(Time)
      
      # SECURITY: Strict date validation to prevent SQL injection
      # Date.parse is too lenient and accepts strings like "' OR '1'='1"
      date_string = date_param.to_s.strip
      
      # Reject any string containing SQL keywords or special characters
      if date_string =~ /[';]|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\bEXEC\b/i
        raise Export::BaseService::ExportError, 'Invalid date format provided'
      end
      
      # Only accept standard date formats
      begin
        # Try ISO 8601 format first (YYYY-MM-DD)
        if date_string =~ /\A\d{4}-\d{2}-\d{2}\z/
          Date.strptime(date_string, '%Y-%m-%d')
        # Also accept MM/DD/YYYY format
        elsif date_string =~ /\A\d{1,2}\/\d{1,2}\/\d{4}\z/
          Date.strptime(date_string, '%m/%d/%Y')
        else
          raise ArgumentError, 'Unrecognized date format'
        end
      rescue ArgumentError
        # SECURITY: Never include raw user input in error messages
        raise Export::BaseService::ExportError, 'Invalid date format provided'
      end
    end
  end
end