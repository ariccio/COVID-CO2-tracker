class CreateDeviceModels < ActiveRecord::Migration[6.1]
  def change
    create_table :device_models do |t|
      t.string :name
      t.references :manufacturer, null: false, foreign_key: true

      t.timestamps
    end
  end
end
