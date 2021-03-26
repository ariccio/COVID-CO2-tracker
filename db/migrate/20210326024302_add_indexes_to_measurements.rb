class AddIndexesToMeasurements < ActiveRecord::Migration[6.1]
  def change
    add_index(:measurements, :measurementtime)
  end
end
