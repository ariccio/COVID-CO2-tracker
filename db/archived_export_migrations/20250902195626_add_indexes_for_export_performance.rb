# frozen_string_literal: true

class AddIndexesForExportPerformance < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    # Index for date range queries - most common filter
    add_index :measurements, :measurementtime,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_measurementtime'

    # Composite index for date + CO2 filtering
    add_index :measurements, [:measurementtime, :co2ppm],
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_time_and_co2'

    # Index for device lookups (for user filtering)
    add_index :measurements, :device_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_device_id'

    # Index for sub_location lookups (for place filtering)
    add_index :measurements, :sub_location_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_sub_location_id'

    # Index for place queries
    add_index :places, :google_place_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_places_on_google_place_id'

    # Index for device serial lookups
    add_index :devices, :serial,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_devices_on_serial'

    # Index for user-device relationship
    add_index :devices, :user_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_devices_on_user_id'

    # Index for sub_location-place relationship
    add_index :sub_locations, :place_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_sub_locations_on_place_id'
  end
end