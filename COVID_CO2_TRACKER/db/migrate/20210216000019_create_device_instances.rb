class CreateDeviceInstances < ActiveRecord::Migration[6.1]
  def change
    create_table :device_instances do |t|
      t.string :serial
      t.references :devicemodel, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
