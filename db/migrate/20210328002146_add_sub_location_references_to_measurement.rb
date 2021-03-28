class AddSubLocationReferencesToMeasurement < ActiveRecord::Migration[6.1]
  def change
    add_reference(:measurements, :sub_location)
  end
end
