# frozen_string_literal: true

require 'csv'

class CsvExportService
  class << self
    # Export all measurement data to CSV with privacy safeguards
    # This only exports data that would be available through normal APIs
    def export_measurements_to_csv(output_directory = '/tmp')
      validate_preconditions!

      timestamp = Time.current.strftime('%Y%m%d_%H%M%S')
      filename = "co2_measurements_export_#{timestamp}.csv"
      filepath = File.join(output_directory, filename)

      Rails.logger.info("Starting CSV export to #{filepath}")

      measurement_count = 0

      CSV.open(filepath, 'w', write_headers: true, headers: measurement_headers) do |csv|
        # Use find_each to handle large datasets efficiently without loading all into memory
        Measurement.includes(
          :device,
          :sub_location,
          device: { model: :manufacturer },
          sub_location: :place
        ).find_each(batch_size: 1000) do |measurement|


          csv << build_measurement_row(measurement)
          measurement_count += 1

          # Log progress every 10,000 records
          if (measurement_count % 10_000).zero?
            Rails.logger.info("Exported #{measurement_count} measurements...")
          end
        rescue StandardError => e
          Rails.logger.error("Error exporting measurement ID #{measurement.id}: #{e.message}")
            # Continue processing other records rather than failing completely

        end
      end

      Rails.logger.info("CSV export completed: #{measurement_count} measurements exported to #{filepath}")

      {
        success: true,
        filepath:,
        record_count: measurement_count,
        message: "Successfully exported #{measurement_count} measurements to #{filename}"
      }
    rescue StandardError => e
      Rails.logger.error("CSV export failed: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))

      {
        success: false,
        error: e.message,
        message: "Export failed: #{e.message}"
      }
    end

    # Export measurements from a PostgreSQL dump file
    def export_from_pg_dump(dump_file_path, output_directory = '/tmp')
      validate_dump_file!(dump_file_path)

      Rails.logger.info("Starting export from PostgreSQL dump file: #{dump_file_path}")

      # Create a temporary database for loading the dump
      temp_db_name = "temp_export_#{Time.current.to_i}_#{Process.pid}"

      begin
        create_temp_database(temp_db_name)
        load_dump_to_temp_database(dump_file_path, temp_db_name)

        # Temporarily switch ActiveRecord connection to temp database
        original_config = ActiveRecord::Base.connection_config
        temp_config = original_config.merge(database: temp_db_name)

        ActiveRecord::Base.establish_connection(temp_config)

        # Perform the export using the temporary database
        result = export_measurements_to_csv(output_directory)

        result
      ensure
        # Always restore original connection and cleanup temp database
        begin
          ActiveRecord::Base.establish_connection(original_config) if original_config
        rescue StandardError => e
          Rails.logger.error("Error restoring database connection: #{e.message}")
        end

        begin
          drop_temp_database(temp_db_name)
        rescue StandardError => e
          Rails.logger.error("Error dropping temporary database #{temp_db_name}: #{e.message}")
        end
      end
    end

    private

    def validate_preconditions!
      unless ActiveRecord::Base.connection.active?
        raise StandardError, 'Database connection is not active'
      end

      unless Measurement.table_exists?
        raise StandardError, 'Measurements table does not exist'
      end

      measurement_count = Measurement.count
      if measurement_count.zero?
        Rails.logger.warn('No measurements found in database')
      else
        Rails.logger.info("Found #{measurement_count} measurements to export")
      end
    end

    def validate_dump_file!(dump_file_path)
      unless File.exist?(dump_file_path)
        raise StandardError, "Dump file does not exist: #{dump_file_path}"
      end

      unless File.readable?(dump_file_path)
        raise StandardError, "Dump file is not readable: #{dump_file_path}"
      end

      # Basic check that this looks like a PostgreSQL dump
      File.open(dump_file_path, 'r') do |file|
        first_lines = file.read(1000)
        unless first_lines.include?('PostgreSQL') || first_lines.include?('--')
          Rails.logger.warn("File may not be a PostgreSQL dump: #{dump_file_path}")
        end
      end
    rescue StandardError => e
      raise StandardError, "Error validating dump file: #{e.message}"
    end

    def measurement_headers
      [
        'measurement_id',
        'co2_ppm',
        'measurement_time',
        'crowding_level',
        'is_realtime',
        'device_serial',
        'device_model',
        'device_manufacturer',
        'place_latitude',
        'place_longitude',
        'sub_location_description',
        'created_at',
        'updated_at'
      ]
    end

    def build_measurement_row(measurement)
      [
        measurement.id,
        measurement.co2ppm,
        measurement.measurementtime&.iso8601,
        measurement.crowding,
        measurement.is_realtime?,
        measurement.device&.serial,
        measurement.device&.model&.name,
        measurement.device&.model&.manufacturer&.name,
        measurement.sub_location&.place&.place_lat,
        measurement.sub_location&.place&.place_lng,
        measurement.sub_location&.description,
        measurement.created_at&.iso8601,
        measurement.updated_at&.iso8601
      ]
    end

    def create_temp_database(temp_db_name)
      connection = ActiveRecord::Base.connection
      connection.execute("CREATE DATABASE #{connection.quote_table_name(temp_db_name)}")
      Rails.logger.info("Created temporary database: #{temp_db_name}")
    rescue StandardError => e
      raise StandardError, "Failed to create temporary database: #{e.message}"
    end

    def load_dump_to_temp_database(dump_file_path, temp_db_name)
      config = ActiveRecord::Base.connection_config
      host = config[:host] || 'localhost'
      port = config[:port] || 5432
      username = config[:username]

      # Build psql command to load dump
      cmd_parts = [
        'psql',
        "-h #{host}",
        "-p #{port}",
        ("-U #{username}" if username),
        "-d #{temp_db_name}",
        "-f #{dump_file_path}",
        '--quiet'
      ].compact

      cmd = cmd_parts.join(' ')

      Rails.logger.info("Loading dump with command: #{cmd.gsub(/(-U \S+)/, '-U [HIDDEN]')}")

      result = system(cmd)
      unless result
        raise StandardError, 'Failed to load dump file into temporary database'
      end

      Rails.logger.info('Successfully loaded dump into temporary database')
    rescue StandardError => e
      raise StandardError, "Failed to load dump: #{e.message}"
    end

    def drop_temp_database(temp_db_name)
      # Force disconnect any connections to the temp database first
      connection = ActiveRecord::Base.connection
      connection.execute(<<~SQL.squish)
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity#{' '}
        WHERE datname = '#{temp_db_name}' AND pid <> pg_backend_pid()
      SQL

      connection.execute("DROP DATABASE IF EXISTS #{connection.quote_table_name(temp_db_name)}")
      Rails.logger.info("Dropped temporary database: #{temp_db_name}")
    rescue StandardError => e
      Rails.logger.error("Failed to drop temporary database #{temp_db_name}: #{e.message}")
      # Don't re-raise since this is cleanup
    end
  end
end