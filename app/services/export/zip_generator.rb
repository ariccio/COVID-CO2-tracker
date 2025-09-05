# frozen_string_literal: true

require 'csv'
require 'tempfile'
require 'zip'

module Export
  # Service for generating ZIP files with multiple CSV exports
  # Extracted from ExportsController to reduce controller complexity
  class ZipGenerator
    def initialize(export_token, filters = {})
      @export_token = export_token
      @filters = filters
      @query_builder = Export::QueryBuilder.new
    end

    def generate_to_stream(response_stream)
      Tempfile.open(['export', '.zip'], binmode: true) do |tempfile|
        # Write ZIP to tempfile
        Zip::OutputStream.open(tempfile) do |zip|
          add_measurements_to_zip(zip)
          add_places_to_zip(zip)
          add_sub_locations_to_zip(zip)
          add_devices_to_zip(zip)
          add_users_to_zip(zip)
          add_metadata_to_zip(zip)
        end

        # Stream tempfile in chunks to avoid loading entire file in memory
        tempfile.rewind
        chunk_size = 1.megabyte
        while (chunk = tempfile.read(chunk_size))
          response_stream.write(chunk)
          # Yield control to allow client read
          sleep(0) if chunk.size == chunk_size
        end
      end
    end

    private

    def add_measurements_to_zip(zip)
      zip.put_next_entry('measurements.csv')
      multi_csv_service = Export::MultiCsvService.new(@filters)
      multi_csv_service.write_measurements_to_stream(zip, @filters)
    end

    def add_places_to_zip(zip)
      zip.put_next_entry('places.csv')
      multi_csv_service = Export::MultiCsvService.new(@filters)
      multi_csv_service.write_places_to_stream(zip, @filters)
    end

    def add_sub_locations_to_zip(zip)
      zip.put_next_entry('sub_locations.csv')
      multi_csv_service = Export::MultiCsvService.new(@filters)
      multi_csv_service.write_sub_locations_to_stream(zip, @filters)
    end

    def add_devices_to_zip(zip)
      zip.put_next_entry('devices.csv')
      multi_csv_service = Export::MultiCsvService.new(@filters)
      multi_csv_service.write_devices_to_stream(zip, @filters)
    end

    def add_users_to_zip(zip, _include_names: true)
      zip.put_next_entry('users.csv')

      # Build users query - get distinct user IDs first
      # Remove ordering before using distinct to avoid SQL errors
      query = @query_builder.build
      user_ids = query.joins(:device).reorder(nil).distinct.pluck('devices.user_id')

      # Then query users with their measurement counts
      users = User.where(id: user_ids)
                  .left_joins(devices: :measurements)
                  .group('users.id')
                  .select('users.id as user_id',
                          'users.name as user_name',
                          'COUNT(measurements.id) as measurements_count')

      # Write header
      zip.write("user_id,name,measurements_count\n")

      # Write user data with CSV escaping
      users.find_each do |user|
        csv_line = CSV.generate_line(
          [user.user_id, user.user_name, user.measurements_count],
          force_quotes: true
        )
        zip.write(csv_line)
      end
    end

    def add_metadata_to_zip(zip)
      zip.put_next_entry('metadata.json')

      metadata = {
        export_time: Time.current.iso8601,
        filters: @filters,
        total_records: @query_builder.build.count,
        format_version: '2.0'
      }

      zip.write(JSON.pretty_generate(metadata))
    end
  end
end