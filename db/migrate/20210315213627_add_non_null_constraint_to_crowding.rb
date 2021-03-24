class AddNonNullConstraintToCrowding < ActiveRecord::Migration[6.1]
  def change
    change_column_null(:measurements, :crowding, false)
  end
end
