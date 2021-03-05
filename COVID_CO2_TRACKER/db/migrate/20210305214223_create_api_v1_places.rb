class CreateApiV1Places < ActiveRecord::Migration[6.1]
  def change
    create_table :api_v1_places do |t|
      t.string :google_place_id
      t.datetime :last_fetched

      t.timestamps
    end
  end
end
