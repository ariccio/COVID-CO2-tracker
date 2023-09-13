# frozen_string_literal: true

class GooglePlaceIDSerializer
    include ::JSONAPI::Serializer
    attributes :google_place_id
  
    set_type :place
  end
  