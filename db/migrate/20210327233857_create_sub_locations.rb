class CreateSubLocations < ActiveRecord::Migration[6.1]
  def change
    create_table :sub_locations do |t|
      t.string :description
      t.references :place, null: false, foreign_key: true

      t.timestamps
    end
  end
end
