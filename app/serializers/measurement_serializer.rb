class MeasurementSerializer
  include JSONAPI::Serializer
  attributes :co2ppm, :measurementtime, :crowding
  
  belongs_to :device
  belongs_to :sub_location
  set_type :measurement
end
