class UserSettingSerializer
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  include JSONAPI::Serializer

  attributes( :realtime_upload_place, :realtime_upload_sub_location)
  # has_one(:place)

  # {:data=>{
    # :id=>"6",
    # :type=>:user_setting,
    # :attributes=>{
        # :realtime_upload_place=>#<
          # Place id: 22,
          # google_place_id: "ChIJAbAvU8dYwokRwAvBDqWmDMo",
          # last_fetched: "2022-01-25 22:25:15.667697000 +0000",
          # created_at: "2021-03-11 02:41:38.899104000 +0000",
          # updated_at: "2022-01-25 22:25:15.669135000 +0000",
          # place_lat: 0.40770339e2,
          # place_lng: -0.73953588e2>,
        #  :realtime_upload_sub_location=>#<
          # SubLocation id: 18,
          # description: "None",
          # place_id: 22,
          # created_at: "2021-03-28 00:41:23.623733000 +0000",
          # updated_at: "2021-03-28 02:14:01.550823000 +0000">
    # }
  # }}

  attributes :realtime_upload_place, :realtime_upload_sub_location
end
