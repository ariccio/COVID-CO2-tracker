class ModelMeasurementSerializer
  include JSONAPI::Serializer
  attributes :measurement
  has_many :measurement
end
