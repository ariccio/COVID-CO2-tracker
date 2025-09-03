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
      query.order(measurementtime: :desc, id: :desc)
    end
    
    private
    
    def apply_date_filters(query, filters)
      if filters[:from]
        from_date = parse_date(filters[:from])
        # Use parameterized query with named placeholder for extra safety
        query = query.where('measurementtime >= :from_date', from_date: from_date.beginning_of_day)
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
        # Sanitize place_id before using in query
        place_id = filters[:place_id].to_i
        query = query.joins(sub_location: :place)
                     .where(places: { id: place_id })
      end
      
      if filters[:device_id]
        # Sanitize device_id before using in query
        device_id = filters[:device_id].to_i
        query = query.where(device_id: device_id)
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
      
      begin
        Date.parse(date_param.to_s)
      rescue ArgumentError
        raise ArgumentError, "Invalid date format: #{date_param}"
      end
    end
  end
end