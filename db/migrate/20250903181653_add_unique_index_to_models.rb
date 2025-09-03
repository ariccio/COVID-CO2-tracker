class AddUniqueIndexToModels < ActiveRecord::Migration[7.1]
  def change
    add_index :models, [:name, :manufacturer_id], unique: true, name: 'index_models_on_name_and_manufacturer_id'
  end
end
