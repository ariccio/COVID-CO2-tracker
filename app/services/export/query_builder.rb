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
      return query.order(measurementtime: :asc, id: :asc)
    end

    private

    def validate_numeric_filter(value, param_name)
      return nil if value.nil? || value == ''

      # Check if it's already numeric
      return value if value.is_a?(Numeric)

      # For strings, validate format
      string_value = value.to_s.strip
      unless string_value.match?(/\A-?\d+\z/)
        raise Export::BaseService::ExportError,
              "Invalid #{param_name}: expected numeric value, got '#{string_value}'"
      end

      return string_value.to_i
    end

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

      return query
    end

    def apply_co2_filters(query, filters)
      if filters[:above_ppm]
        # Validate and use parameterized query with named placeholder
        ppm_value = validate_numeric_filter(filters[:above_ppm], 'above_ppm')
        query = query.where('co2ppm > :ppm', ppm: ppm_value) if ppm_value
      end

      if filters[:below_ppm]
        # Validate and use parameterized query with named placeholder
        ppm_value = validate_numeric_filter(filters[:below_ppm], 'below_ppm')
        query = query.where('co2ppm < :ppm', ppm: ppm_value) if ppm_value
      end

      return query
    end

    def apply_location_filters(query, filters)
      query = filter_by_place_database_id(query, filters[:place_database_id])
      query = filter_by_google_place_id(query, filters[:google_place_id])
      query = filter_by_device_id(query, filters[:device_id])
      return filter_by_device_serial(query, filters[:device_serial])
    end

    def filter_by_place_database_id(query, place_database_id)
      return query unless place_database_id

      # Validate that it's a numeric ID
      place_id = validate_numeric_filter(place_database_id, 'place_database_id')
      return query unless place_id

      return query.joins(sub_location: :place)
                  .where(places: { id: place_id })
    end

    def filter_by_google_place_id(query, google_place_id)
      return query unless google_place_id

      google_place_id_clean = google_place_id.to_s.strip
      return query if google_place_id_clean.empty?

      # Rails will properly parameterize this to prevent SQL injection
      return query.joins(sub_location: :place)
                  .where(places: { google_place_id: google_place_id_clean })
    end

    def filter_by_device_id(query, device_id)
      return query unless device_id

      # Validate device_id before using in query
      validated_device_id = validate_numeric_filter(device_id, 'device_id')
      return query unless validated_device_id

      return query.where(device_id: validated_device_id)
    end

    def filter_by_device_serial(query, device_serial)
      return query unless device_serial

      # Filter by device serial number
      return query.joins(:device)
                  .where(devices: { serial: device_serial })
    end

    def necessary_includes(fields)
      # Always include these for efficiency
      includes = []

      includes << { device: { model: :manufacturer } } if needs_device_includes?(fields)
      includes << { sub_location: :place } if needs_location_includes?(fields)
      includes << :extra_measurement_info if needs_realtime_includes?(fields)

      return includes
    end

    def needs_device_includes?(fields)
      return true if fields.nil?

      return fields.any? { |f| f.to_s.match?(/device|serial|model|manufacturer/) }
    end

    def needs_location_includes?(fields)
      return true if fields.nil?

      return fields.any? { |f| f.to_s.match?(/place|lat|lng|google/) }
    end

    def needs_realtime_includes?(fields)
      return true if fields.nil?

      return fields.any? { |f| f.to_s == 'is_realtime' }
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
          return Date.strptime(date_string, '%Y-%m-%d')
        # Also accept MM/DD/YYYY format
        elsif %r{\A\d{1,2}/\d{1,2}/\d{4}\z}.match?(date_string)
          return Date.strptime(date_string, '%m/%d/%Y')
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