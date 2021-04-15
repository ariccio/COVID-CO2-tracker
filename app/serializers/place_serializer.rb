# frozen_string_literal: true

class PlaceSerializer
  include JSONAPI::Serializer
  attributes

  set_type :place
  has_many :sub_location
  has_many :measurement
end
