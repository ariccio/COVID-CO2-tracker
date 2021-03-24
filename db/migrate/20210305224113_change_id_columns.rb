class ChangeIdColumns < ActiveRecord::Migration[6.1]
  def change
    # Accidentally introduced unused table, and neglected to remove in https://github.com/ariccio/COVID-CO2-tracker/commit/8920193a9269596d0f806270f455c2b22a9dc0eb
    # change_column :device_models, :manufacturer_id, :bigint 
    change_column :devices, :model_id, :bigint
    change_column :devices, :user_id, :bigint
    change_column :models, :manufacturer_id, :bigint
    
  end
end
