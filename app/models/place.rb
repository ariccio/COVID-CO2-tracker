# frozen_string_literal: true

class Place < ApplicationRecord
  has_many :sub_location, dependent: :restrict_with_exception
  has_many :measurement, dependent: :restrict_with_exception, through: :sub_location

  acts_as_mappable(default_units: :miles, default_formula: :sphere, distance_field_name: :distance, lat_column_name: :place_lat, lng_column_name: :place_lng)

  def self.as_json_for_markers(place)
    {
      place_id: place.id,
      google_place_id: place.google_place_id,
      place_lat: place.place_lat,
      place_lng: place.place_lng
    }
  end

  def each_subloc
    results = []
    sub_location.each do |loc|
      results << {
        sub_location_id: loc.id,
        description: loc.description,
        measurements: loc.as_measurementtime_desc
      }
    end
    results
  end

  def place_measurementtime_desc
    # byebug
    each_subloc
    # byebug
  end

  def self.testing_data_migration
    # say('UGLY manual data migration...')
    Place.all.find_each do |place|
      place.measurement.each do |measurement|
        new_sub_location = place.sub_location.find_or_create_by!(description: measurement.location_where_inside_info)
        measurement.sub_location = new_sub_location
        measurement.save!
      end
    end
  end

  def place_needs_refresh?
    # byebug
    return true if place_lat.nil?

    return true if place_lng.nil?

    return true if last_fetched.nil?
    # (place.last_fetched < 30.days.ago) is true if last_fetched was MORE than 30.days.ago because that time is logically smaller.
    return true if (last_fetched && (last_fetched < 30.days.ago))

    false
  end
end
