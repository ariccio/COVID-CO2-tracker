# frozen_string_literal: true

# See also: https://github.com/Netflix/fast_jsonapi/issues/160#issuecomment-379720985
class PlaceSerializer
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  include ::JSONAPI::Serializer
  attributes :google_place_id, :sub_location, :measurement
  set_type :place
  has_many :sub_location
  has_many :measurement
end
