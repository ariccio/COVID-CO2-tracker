class CreatePlaces < ActiveRecord::Migration[6.1]
  def change
    create_table :places do |t|
      t.string :google_place_id
      t.datetime :last_fetched

      t.timestamps
    end
    add_index :places, :google_place_id, unique: true
  end
end
