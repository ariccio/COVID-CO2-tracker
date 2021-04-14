class DeviceSerializer
  include JSONAPI::Serializer
  attributes :id, :serial

  belongs_to :model
  belongs_to :user
  has_many :measurement
  set_type :device
end
