# frozen_string_literal: true
class Place < ApplicationRecord
    has_many :measurement
    acts_as_mappable(default_units: :miles, default_formula: :sphere, distance_field_name: :distance, lat_column_name: :place_lat, lng_column_name: :place_lng)

    def self.as_json_for_markers(place)
        {
            place_id: place.id,
            google_place_id: place.google_place_id,
            place_lat: place.place_lat,
            place_lng: place.place_lng
        }
    end
end
