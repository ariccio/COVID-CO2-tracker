class AddSubAndNameToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :name, :string
    add_column :users, :sub_google_uid, :string
    add_index :users, :sub_google_uid, unique: true
  end
end
