# frozen_string_literal: true

class GooglePlaceIdSerializer
    include ::JSONAPI::Serializer
    attributes :google_place_id

    set_type :place
  end
