class ChangePlaceColumn < ActiveRecord::Migration[6.1]
  def change
    change_column :measurements, :place_id, :bigint, :null => false
  end
end
