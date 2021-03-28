class AddNonNullToDescription < ActiveRecord::Migration[6.1]
  def change
    change_column_null(:sub_locations, :description, false)
  end
end
