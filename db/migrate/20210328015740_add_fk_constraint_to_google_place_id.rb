class AddFkConstraintToGooglePlaceId < ActiveRecord::Migration[6.1]
  def change
    add_foreign_key(:places, :google_place)
  end
end
