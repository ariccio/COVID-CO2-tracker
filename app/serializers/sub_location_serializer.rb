# frozen_string_literal: true

class SubLocationSerializer
  include ::JSONAPI::Serializer
  attributes :measurement

  belongs_to :place
  has_many :measurement
  set_type :sub_location
end
