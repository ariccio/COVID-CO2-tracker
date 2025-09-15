# frozen_string_literal: true

# Squashed migration for the entire export system
# Combines 7 migrations from 2025-08-28 to 2025-09-10:
#   - 20250828091545_create_export_tokens
#   - 20250902195626_add_indexes_for_export_performance
#   - 20250903001159_add_token_hash_to_export_tokens
#   - 20250903035656_remove_token_from_export_tokens
#   - 20250903181653_add_unique_index_to_models
#   - 20250909032108_add_revocation_and_creator_to_export_tokens
#   - 20250910203748_add_revocation_reason_to_export_tokens
class CreateExportSystem < ActiveRecord::Migration[7.1]
  disable_ddl_transaction! # Needed for concurrent index creation

  def change
    # Create the export_tokens table with ALL final columns
    unless table_exists?(:export_tokens)
      create_table :export_tokens do |t|
        t.string :description
        t.datetime :expires_at
        t.integer :usage_count, default: 0, null: false
        t.datetime :last_used_at
        t.jsonb :permissions, default: {}, null: false
        t.datetime :created_at, null: false
        t.datetime :updated_at, null: false
        t.string :token_hash, null: false
        t.datetime :revoked_at
        t.string :created_by
        t.string :revocation_reason
      end
    end

    # Add all indexes for the export_tokens table
    add_index :export_tokens, :token_hash, unique: true,
              algorithm: :concurrently,
              if_not_exists: true
    add_index :export_tokens, :expires_at,
              algorithm: :concurrently,
              if_not_exists: true
    add_index :export_tokens, :revoked_at,
              algorithm: :concurrently,
              if_not_exists: true
    add_index :export_tokens, [:token_hash, :revoked_at],
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_export_tokens_on_token_hash_and_revoked_at'
    add_index :export_tokens, :created_by,
              algorithm: :concurrently,
              if_not_exists: true

    # Add performance indexes for export queries
    # Note: Using actual column name 'measurementtime' not 'measurement_timestamp'
    add_index :measurements, :measurementtime,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_measurementtime'

    add_index :measurements, [:measurementtime, :co2ppm],
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_time_and_co2'

    add_index :measurements, :device_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_device_id'

    add_index :measurements, :sub_location_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_measurements_on_sub_location_id'

    # NOTE: index_places_on_google_place_id already exists as unique index

    # Add indexes to devices table
    add_index :devices, :serial,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_devices_on_serial'

    add_index :devices, :user_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_devices_on_user_id'

    # Add indexes to sub_locations table
    add_index :sub_locations, :place_id,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_sub_locations_on_place_id'

    # Add unique constraint to models table
    add_index :models, [:name, :manufacturer_id],
              unique: true,
              algorithm: :concurrently,
              if_not_exists: true,
              name: 'index_models_on_name_and_manufacturer_id'
  end
end