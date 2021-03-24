class CreateMeasurements < ActiveRecord::Migration[6.1]
  def change
    create_table :measurements do |t|
      t.references :device, null: false, foreign_key: true
      t.integer :co2ppm
      t.datetime :measurementtime

      t.timestamps
    end
  end
end
