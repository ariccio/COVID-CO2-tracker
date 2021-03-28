class MigrateNilDescriptionsManually < ActiveRecord::Migration[6.1]
  def change
    say('Running UGLY manual data migration...')
    SubLocation.where(description: nil).each do |sl|
      sl.description = "None"
      sl.save!
    end
  end
end
