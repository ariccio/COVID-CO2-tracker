class AddExtraMeasurementInfoRefToMeasurements < ActiveRecord::Migration[6.1]
  # ActiveRecord::Base.logger = Logger.new(STDOUT)
  def change
    add_reference(:measurements, :extra_measurement_info, null: true, foreign_key: true)
  end
end
