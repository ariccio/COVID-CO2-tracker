class CreateExtraMeasurementInfos < ActiveRecord::Migration[6.1]
  def change
    create_table :extra_measurement_infos do |t|
      t.boolean :realtime
      t.references :measurement, null: false, foreign_key: true

      t.timestamps
    end
  end
end
