# frozen_string_literal: true

class PlaceMarkerSerializer
  include ::JSONAPI::Serializer
  attributes :google_place_id, :place_lat, :place_lng

  set_type :place
end
