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
        # SECURITY: Extract leading numeric portion and convert to integer
        # This prevents SQL injection by ensuring we only use integer IDs
        # Examples: '1 OR 1=1' -> 1, 'abc123' -> 0, '42' -> 42
        place_id_string = filters[:place_id].to_s.strip

        # Try to extract a numeric ID from the beginning of the string
        if /^\d+/.match?(place_id_string)
          # Extract just the numeric portion and convert to integer
          # This prevents any SQL injection as we're only using the numeric part
          place_id = place_id_string.to_i
          query = query.joins(sub_location: :place)
                       .where(places: { id: place_id })
        else
          # Non-numeric place_id, treat as google_place_id
          # Rails will properly parameterize this to prevent SQL injection
          query = query.joins(sub_location: :place)
                       .where(places: { google_place_id: place_id_string })
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

      includes << { device: { model: :manufacturer } } if needs_device_includes?(fields)
      includes << { sub_location: :place } if needs_location_includes?(fields)
      includes << :extra_measurement_info if needs_realtime_includes?(fields)

      includes
    end

    def needs_device_includes?(fields)
      return true if fields.nil?

      fields.any? { |f| f.to_s.match?(/device|serial|model|manufacturer/) }
    end

    def needs_location_includes?(fields)
      return true if fields.nil?

      fields.any? { |f| f.to_s.match?(/place|lat|lng|google/) }
    end

    def needs_realtime_includes?(fields)
      return true if fields.nil?

      fields.any? { |f| f.to_s == 'is_realtime' }
    end

    def parse_date(date_param)
      return date_param if date_param.is_a?(Date) || date_param.is_a?(Time)

      # SECURITY: Strict date validation
      # Rails' parameterization handles SQL injection prevention,
      # but we still validate the format to ensure only valid dates are accepted
      date_string = date_param.to_s.strip

      # Only accept standard date formats
      begin
        # Try ISO 8601 format first (YYYY-MM-DD)
        if /\A\d{4}-\d{2}-\d{2}\z/.match?(date_string)
          Date.strptime(date_string, '%Y-%m-%d')
        # Also accept MM/DD/YYYY format
        elsif %r{\A\d{1,2}/\d{1,2}/\d{4}\z}.match?(date_string)
          Date.strptime(date_string, '%m/%d/%Y')
        else
          # If it doesn't match our strict formats, reject it
          raise ArgumentError, 'Unrecognized date format'
        end
      rescue ArgumentError
        # SECURITY: Never include raw user input in error messages
        raise Export::BaseService::ExportError, 'Invalid date format provided'
      end
    end
  end
end