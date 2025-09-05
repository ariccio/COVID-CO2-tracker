# frozen_string_literal: true

require 'csv'
require 'fileutils'
require 'zip'

module Export
  class MultiCsvService < BaseService
    BATCH_SIZE = 1000

    def export_to_directory(output_dir, filters = @filters)
      start_time = Time.current
      export_path = setup_export_directory(output_dir)
      manifest = initialize_manifest(export_path, filters)

      begin
        log_export_start('multi_csv')
        export_all_entity_files(export_path, filters, manifest)
        write_manifest_file(export_path, manifest)
        finalize_export_logging(start_time, manifest)
        return export_path
      rescue StandardError => e
        handle_export_failure(e, export_path)
      end
    end

    def export_to_zip(zip_path, filters = @filters)
      # Create temporary directory for CSV files
      temp_dir = Dir.mktmpdir

      begin
        # Export to directory first
        export_dir = export_to_directory(temp_dir, filters)

        # Create ZIP file
        create_zip_file(export_dir, zip_path)

        zip_path
      ensure
        # Clean up temp directory
        FileUtils.rm_rf(temp_dir) if temp_dir && File.exist?(temp_dir)
      end
    end

    def stream_zip(output_stream, filters = @filters)
      # For streaming ZIP directly to response
      Zip::OutputStream.write_buffer(output_stream) do |zip|
        export_id = "export_#{Time.current.strftime('%Y%m%d_%H%M%S')}"

        # Add measurements.csv
        zip.put_next_entry("#{export_id}/measurements.csv")
        write_measurements_to_stream(zip, filters)

        # Add places.csv
        zip.put_next_entry("#{export_id}/places.csv")
        write_places_to_stream(zip, filters)

        # Add sub_locations.csv
        zip.put_next_entry("#{export_id}/sub_locations.csv")
        write_sub_locations_to_stream(zip, filters)

        # Add devices.csv
        zip.put_next_entry("#{export_id}/devices.csv")
        write_devices_to_stream(zip, filters)

        # Add manifest.json
        zip.put_next_entry("#{export_id}/manifest.json")
        manifest = build_manifest(export_id, filters)
        zip.write(JSON.pretty_generate(manifest))
      end
    end

    private

    def setup_export_directory(output_dir)
      export_id = generate_export_id
      export_path = File.join(output_dir, export_id)
      FileUtils.mkdir_p(export_path)
      return export_path
    end

    def generate_export_id
      return "export_#{Time.current.strftime('%Y%m%d_%H%M%S')}"
    end

    def initialize_manifest(export_path, filters)
      export_id = File.basename(export_path)
      return {
        export_id:,
        created_at: Time.current.iso8601,
        filters:,
        files: [],
        record_counts: {}
      }
    end

    def export_all_entity_files(export_path, filters, manifest)
      export_measurements_file(build_file_path(export_path, 'measurements.csv'), filters, manifest)
      export_places_file(build_file_path(export_path, 'places.csv'), filters, manifest)
      export_sub_locations_file(build_file_path(export_path, 'sub_locations.csv'), filters, manifest)
      export_devices_file(build_file_path(export_path, 'devices.csv'), filters, manifest)
    end

    def build_file_path(export_path, filename)
      return File.join(export_path, filename)
    end

    def write_manifest_file(export_path, manifest)
      manifest_path = File.join(export_path, 'manifest.json')
      File.write(manifest_path, JSON.pretty_generate(manifest))
      manifest[:files] << 'manifest.json'
    end

    def finalize_export_logging(start_time, manifest)
      duration = calculate_export_duration(start_time)
      total_records = sum_manifest_records(manifest)
      log_export_complete('multi_csv', total_records, duration)
    end

    def calculate_export_duration(start_time)
      return Time.current - start_time
    end

    def sum_manifest_records(manifest)
      return manifest[:record_counts].values.sum
    end

    def handle_export_failure(exception, export_path)
      log_export_error('multi_csv', exception)
      FileUtils.rm_rf(export_path)
      raise exception
    end

    def export_measurements_file(file_path, filters, manifest)
      count = 0

      CSV.open(file_path, 'w') do |csv|
        # Write headers
        csv << %w[measurement_id co2_ppm timestamp crowding device_id sub_location_id is_realtime]

        # Write data
        measurements_query(filters).find_each(batch_size: BATCH_SIZE) do |measurement|
          csv << [
            measurement.id,
            measurement.co2ppm,
            format_timestamp(measurement.measurementtime),
            measurement.crowding,
            measurement.device_id,
            measurement.sub_location_id,
            measurement.realtime?
          ]
          count += 1
        end
      end

      manifest[:files] << 'measurements.csv'
      manifest[:record_counts][:measurements] = count
    end

    def export_places_file(file_path, filters, manifest)
      # Get unique places from filtered measurements
      place_ids = measurements_query(filters)
                  .joins(sub_location: :place)
                  .reorder(nil) # Remove any order clauses for distinct
                  .distinct
                  .pluck('places.id')

      return if place_ids.empty?

      count = 0
      CSV.open(file_path, 'w') do |csv|
        csv << %w[place_id latitude longitude google_place_id last_fetched]

        Place.where(id: place_ids).find_each do |place|
          csv << [
            place.id,
            place.place_lat,
            place.place_lng,
            sanitize_for_export(place.google_place_id),
            format_timestamp(place.last_fetched)
          ]
          count += 1
        end
      end

      manifest[:files] << 'places.csv'
      manifest[:record_counts][:places] = count
    end

    def export_sub_locations_file(file_path, filters, manifest)
      # Get unique sub_locations from filtered measurements
      sub_location_ids = measurements_query(filters)
                         .where.not(sub_location_id: nil)
                         .reorder(nil) # Remove any order clauses for distinct
                         .distinct
                         .pluck(:sub_location_id)

      return if sub_location_ids.empty?

      count = 0
      CSV.open(file_path, 'w') do |csv|
        csv << %w[sub_location_id place_id description]

        SubLocation.where(id: sub_location_ids).find_each do |sub_location|
          csv << [
            sub_location.id,
            sub_location.place_id,
            sanitize_for_export(sub_location.description)
          ]
          count += 1
        end
      end

      manifest[:files] << 'sub_locations.csv'
      manifest[:record_counts][:sub_locations] = count
    end

    def export_devices_file(file_path, filters, manifest)
      device_ids = extract_unique_device_ids(filters)
      return if device_ids.empty?

      count = write_devices_csv(file_path, device_ids)
      update_manifest_for_devices(manifest, count)
    end

    def extract_unique_device_ids(filters)
      return measurements_query(filters)
             .where.not(device_id: nil)
             .reorder(nil)
             .distinct
             .pluck(:device_id)
    end

    def write_devices_csv(file_path, device_ids)
      count = 0
      CSV.open(file_path, 'w') do |csv|
        write_device_headers(csv)
        count = write_device_records(csv, device_ids)
      end
      return count
    end

    def write_device_headers(csv)
      csv << %w[device_id serial model_id model_name manufacturer_id manufacturer_name]
    end

    def write_device_records(csv, device_ids)
      count = 0
      Device.includes(model: :manufacturer).where(id: device_ids).find_each do |device|
        csv << build_device_row(device)
        count += 1
      end
      return count
    end

    def build_device_row(device)
      return [
        device.id,
        extract_device_serial(device),
        device.model_id,
        extract_device_model_name(device),
        extract_device_manufacturer_id(device),
        extract_device_manufacturer_name(device)
      ]
    end

    def extract_device_serial(device)
      return sanitize_for_export(device.serial)
    end

    def extract_device_model_name(device)
      return sanitize_for_export(device.model&.name)
    end

    def extract_device_manufacturer_id(device)
      return device.model&.manufacturer_id
    end

    def extract_device_manufacturer_name(device)
      return sanitize_for_export(device.model&.manufacturer&.name)
    end

    def update_manifest_for_devices(manifest, count)
      manifest[:files] << 'devices.csv'
      manifest[:record_counts][:devices] = count
    end

    # Public methods for streaming directly to ZIP (used by ExportsController)
    public

    def write_measurements_to_stream(stream, filters)
      # Write headers
      stream.write("measurement_id,co2_ppm,timestamp,crowding,device_id,sub_location_id,is_realtime\n")

      # Write data
      measurements_query(filters).find_each(batch_size: BATCH_SIZE) do |measurement|
        row = [
          measurement.id,
          measurement.co2ppm,
          format_timestamp(measurement.measurementtime),
          measurement.crowding,
          measurement.device_id,
          measurement.sub_location_id,
          measurement.realtime?
        ]
        stream.write(CSV.generate_line(row))
      end
    end

    def write_places_to_stream(stream, filters)
      place_ids = measurements_query(filters)
                  .joins(sub_location: :place)
                  .reorder(nil) # Remove any order clauses for distinct
                  .distinct
                  .pluck('places.id')

      return if place_ids.empty?

      stream.write("place_id,latitude,longitude,google_place_id,last_fetched\n")

      Place.where(id: place_ids).find_each do |place|
        row = [
          place.id,
          place.place_lat,
          place.place_lng,
          sanitize_for_export(place.google_place_id),
          format_timestamp(place.last_fetched)
        ]
        stream.write(CSV.generate_line(row))
      end
    end

    def write_sub_locations_to_stream(stream, filters)
      sub_location_ids = measurements_query(filters)
                         .where.not(sub_location_id: nil)
                         .reorder(nil) # Remove any order clauses for distinct
                         .distinct
                         .pluck(:sub_location_id)

      return if sub_location_ids.empty?

      stream.write("sub_location_id,place_id,description\n")

      SubLocation.where(id: sub_location_ids).find_each do |sub_location|
        row = [
          sub_location.id,
          sub_location.place_id,
          sanitize_for_export(sub_location.description)
        ]
        stream.write(CSV.generate_line(row))
      end
    end

    def write_devices_to_stream(stream, filters)
      device_ids = measurements_query(filters)
                   .where.not(device_id: nil)
                   .reorder(nil) # Remove any order clauses for distinct
                   .distinct
                   .pluck(:device_id)

      return if device_ids.empty?

      stream.write("device_id,serial,model_id,model_name,manufacturer_id,manufacturer_name\n")

      Device.includes(model: :manufacturer).where(id: device_ids).find_each do |device|
        row = [
          device.id,
          sanitize_for_export(device.serial),
          device.model_id,
          sanitize_for_export(device.model&.name),
          device.model&.manufacturer_id,
          sanitize_for_export(device.model&.manufacturer&.name)
        ]
        stream.write(CSV.generate_line(row))
      end
    end

    private

    def create_zip_file(source_dir, zip_path)
      Zip::File.open(zip_path, Zip::File::CREATE) do |zipfile|
        Dir[File.join(source_dir, '**', '*')].each do |file|
          relative_path = file.sub("#{source_dir}/", '')
          zipfile.add(relative_path, file)
        end
      end
    end

    def build_manifest(export_id, filters)
      {
        export_id:,
        created_at: Time.current.iso8601,
        filters:,
        schema_version: '1.0',
        relationships: {
          measurements: {
            foreign_keys: {
              device_id: 'devices.device_id',
              sub_location_id: 'sub_locations.sub_location_id'
            }
          },
          sub_locations: {
            foreign_keys: {
              place_id: 'places.place_id'
            }
          },
          devices: {
            foreign_keys: {
              model_id: 'models.model_id'
            }
          }
        }
      }
    end
  end
end