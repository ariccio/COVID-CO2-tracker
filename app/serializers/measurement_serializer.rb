# frozen_string_literal: true

class MeasurementSerializer
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  include ::JSONAPI::Serializer
  attributes :co2ppm, :measurementtime, :crowding, :created_at, :updated_at, :extra_measurement_info_id

  belongs_to :device
  belongs_to :sub_location
  # has_one :extra_measurement_info, required: false
  set_type :measurement
end
