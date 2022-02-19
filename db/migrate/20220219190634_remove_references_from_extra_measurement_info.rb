class RemoveReferencesFromExtraMeasurementInfo < ActiveRecord::Migration[6.1]
  def change
    remove_reference(:extra_measurement_infos, :measurement, foreign_key: true)
  end
end
