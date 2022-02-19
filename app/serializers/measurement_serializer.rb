# frozen_string_literal: true

class MeasurementSerializer
  include ::JSONAPI::Serializer
  attributes :co2ppm, :measurementtime, :crowding, :created_at, :updated_at, :extra_measurement_info

  belongs_to :device
  belongs_to :sub_location
  set_type :measurement
end
