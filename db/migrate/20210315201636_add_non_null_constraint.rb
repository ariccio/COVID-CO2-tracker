class AddNonNullConstraint < ActiveRecord::Migration[6.1]
  def change
    change_column_null(:device_models, :name, false)
    change_column_null(:devices, :serial, false)
    change_column_null(:manufacturers, :name, false)
    change_column_null(:measurements, :co2ppm, false)
    change_column_null(:measurements, :measurementtime, false)
    change_column_null(:models, :name, false)

    # places#last_fetched needs to be done on another migration
    
  end
end
