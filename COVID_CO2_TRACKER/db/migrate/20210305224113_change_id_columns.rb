class ChangeIdColumns < ActiveRecord::Migration[6.1]
  def change
    change_column :device_models, :manufacturer_id, :bigint
    change_column :devices, :model_id, :bigint
    change_column :devices, :user_id, :bigint
    change_column :models, :manufacturer_id, :bigint
    
  end
end
