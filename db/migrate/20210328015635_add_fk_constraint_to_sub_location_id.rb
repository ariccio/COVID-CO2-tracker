class AddFkConstraintToSubLocationId < ActiveRecord::Migration[6.1]
  def change
    add_foreign_key(:measurements, :sub_location)
  end
end
