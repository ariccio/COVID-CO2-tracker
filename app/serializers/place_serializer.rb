class PlaceSerializer
  include JSONAPI::Serializer
  attributes :id, :google_place_id, :place_lat, :place_lng
end
