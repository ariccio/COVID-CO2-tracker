# frozen_string_literal: true

# See also: https://github.com/Netflix/fast_jsonapi/issues/160#issuecomment-379720985
class PlaceSerializer
  include ::JSONAPI::Serializer
  attributes :google_place_id
  set_type :place
  has_many :sub_location
  has_many :measurement
end
