class AddGeokitRailsFunctionality < ActiveRecord::Migration[6.1]
  def change
    # https://benny-ng.medium.com/location-based-searching-in-rails-5-part-1-using-geokit-rails-61a074367cfd
    add_column(:places, :place_lat, :decimal, precision: 10, scale: 6)
    add_column(:places, :place_lng, :decimal, precision: 10, scale: 6)
    add_index(:places, :place_lat)
    add_index(:places, :place_lng)
  end
end
