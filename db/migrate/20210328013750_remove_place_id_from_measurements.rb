class RemovePlaceIdFromMeasurements < ActiveRecord::Migration[6.1]
  def change
    remove_reference(:measurements, :place)
  end
end
