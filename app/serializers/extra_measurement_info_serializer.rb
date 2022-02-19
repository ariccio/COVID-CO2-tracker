class ExtraMeasurementInfoSerializer
  include JSONAPI::Serializer
  attributes :realtime
  belongs_to :measurement
end
