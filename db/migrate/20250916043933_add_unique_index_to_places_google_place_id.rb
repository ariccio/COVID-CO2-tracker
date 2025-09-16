# frozen_string_literal: true

class AddUniqueIndexToPlacesGooglePlaceId < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    # First check if there are any duplicates that would prevent adding the unique index
    duplicate_ids = Place.group(:google_place_id)
                         .having('COUNT(*) > 1')
                         .pluck(:google_place_id)

    if duplicate_ids.any?
      puts "WARNING: Found duplicate google_place_ids: #{duplicate_ids.join(', ')}"
      puts "Please clean up duplicates before running this migration"

      # In production, we should fail the migration if duplicates exist
      if Rails.env.production?
        raise "Cannot add unique index: duplicate google_place_ids exist: #{duplicate_ids.join(', ')}"
      end

      # In development/test, clean up duplicates (keep the oldest one)
      duplicate_ids.each do |google_place_id|
        places = Place.where(google_place_id: google_place_id).order(:created_at)
        # Keep the first (oldest) place, delete the rest
        places.offset(1).destroy_all
      end
    end

    # Remove the existing non-unique index
    remove_index :places, :google_place_id, if_exists: true, algorithm: :concurrently

    # Add the unique index back using concurrent algorithm for production safety
    add_index :places, :google_place_id, unique: true, name: 'index_places_on_google_place_id', algorithm: :concurrently

    puts "Successfully added unique index on places.google_place_id"
  end

  def down
    # Remove the unique index using concurrent algorithm
    remove_index :places, :google_place_id, if_exists: true, algorithm: :concurrently

    # Add back a non-unique index using concurrent algorithm
    add_index :places, :google_place_id, name: 'index_places_on_google_place_id', algorithm: :concurrently
  end
end