class DeviceNameSerialSerializer
  include JSONAPI::Serializer
  attributes :serial # , :model
  # belongs_to :model
end
