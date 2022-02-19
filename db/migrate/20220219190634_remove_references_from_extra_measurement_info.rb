class RemoveReferencesFromExtraMeasurementInfo < ActiveRecord::Migration[6.1]
  def change
    remove_reference(:extra_measurement_info, :measurement, foreign_key: true)
  end
end
