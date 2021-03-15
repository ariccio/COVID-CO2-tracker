class AddNonNullConstraintToPlacesTableColumns < ActiveRecord::Migration[6.1]
  def change
    change_column_null(:places, :google_place_id, false)
    change_column_null(:places, :last_fetched, false)
  end
end
