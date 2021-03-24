class CreateUniqueManufacturerIndex < ActiveRecord::Migration[6.1]
  def change
    add_index :manufacturers, :name, unique: true
    add_index :users, :email, unique: true
  end
end
