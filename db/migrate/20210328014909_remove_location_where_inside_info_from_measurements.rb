class RemoveLocationWhereInsideInfoFromMeasurements < ActiveRecord::Migration[6.1]
  def change
    remove_column(:measurements, :location_where_inside_info, type: :string)
  end
end
