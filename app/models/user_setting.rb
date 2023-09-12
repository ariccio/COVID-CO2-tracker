class UserSetting < ApplicationRecord
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  # https://thejspr.com/blog/add-reference-with-different-model-name-in-rails-5/
  belongs_to :realtime_upload_place, class_name: 'Place'
  belongs_to :realtime_upload_sub_location, class_name: 'SubLocation'
  belongs_to :user


  def google_place_id
    return nil unless realtime_upload_place
    realtime_upload_place.google_place_id
  end
end
