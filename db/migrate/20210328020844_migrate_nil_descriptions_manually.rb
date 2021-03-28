class MigrateNilDescriptionsManually < ActiveRecord::Migration[6.1]
  def change
    SubLocation.where(description: nil) each do |sl|
      sl.description = "None"
      sl.save!
    end
  end
end
