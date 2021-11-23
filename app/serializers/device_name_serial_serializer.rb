# frozen_string_literal: true

class DeviceNameSerialSerializer
  include JSONAPI::Serializer
  attributes :serial # , :model
  # belongs_to :model
end
