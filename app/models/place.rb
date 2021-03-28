# frozen_string_literal: true

class Place < ApplicationRecord
  has_many :sub_location
  has_many :measurement, dependent: :restrict_with_exception

  acts_as_mappable(default_units: :miles, default_formula: :sphere, distance_field_name: :distance, lat_column_name: :place_lat, lng_column_name: :place_lng)

  def self.as_json_for_markers(place)
    {
      place_id: place.id,
      google_place_id: place.google_place_id,
      place_lat: place.place_lat,
      place_lng: place.place_lng
    }
  end

  def self.testing_data_migration
    Place.all.each do |place|
      place.measurement.each do |measurement|
        
        # if place.sub_location.id == measurement.sub_location.id
        #   byebug
        # end
        # pp place
        new_sub_location = place.sub_location.find_or_create_by!(description: measurement.location_where_inside_info)
        # if measurement.sub_location != nil
        #   byebug
        # end
        measurement.sub_location = new_sub_location
        measurement.save!
        # pp measurement, new_sub_location
        # byebug
      end
      # pp place
      # pp place.sub_location.all.each{|loc| pp loc.measurement}
      # byebug
    end
    byebug
  end
end
