class AddLocationInsideDetailsAndCrowdingLevelToMeasurements < ActiveRecord::Migration[6.1]
  def change
    add_column :measurements, :location_where_inside_info, :string
    add_column :measurements, :crowding, :integer
  end
end
