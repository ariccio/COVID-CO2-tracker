class CreateUserSettings < ActiveRecord::Migration[6.1]
  def change
    create_table(:user_settings) do |t|
      # https://thejspr.com/blog/add-reference-with-different-model-name-in-rails-5/
      t.references(:realtime_upload_place, null: false, foreign_key: {to_table: :places})
      t.references(:realtime_upload_sub_location, null: false, foreign_key: {to_table: :sub_locations})

      t.timestamps
    end
  end
end
