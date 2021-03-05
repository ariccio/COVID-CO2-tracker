class ChangeDeviceColumn < ActiveRecord::Migration[6.1]
  def change
    change_column :measurements, :device_id, :bigint
  end
end
