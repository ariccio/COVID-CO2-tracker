class DeviceInstance < ApplicationRecord
  belongs_to :devicemodel
  belongs_to :user
end
