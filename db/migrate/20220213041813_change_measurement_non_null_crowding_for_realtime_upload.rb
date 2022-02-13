class ChangeMeasurementNonNullCrowdingForRealtimeUpload < ActiveRecord::Migration[6.1]
  def up
    change_column_null(:measurements, :crowding, true)
  end

  def down
    change_column_null(:measurements, :crowding, false)
  end
end
