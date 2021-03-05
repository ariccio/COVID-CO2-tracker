class AddPlaceRefToMeasurements < ActiveRecord::Migration[6.1]
  def change
    add_reference :measurements, :place, foreign_key: true
  end
end
