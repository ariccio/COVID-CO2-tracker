class UserSetting < ApplicationRecord
  belongs_to :realtime_upload_place
  belongs_to :realtime_upload_sub_location
end
