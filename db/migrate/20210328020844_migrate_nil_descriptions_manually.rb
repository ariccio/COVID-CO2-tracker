class MigrateNilDescriptionsManually < ActiveRecord::Migration[6.1]
  def change
    Rails.logger.warn('Running UGLY manual data migration...')
    SubLocation.where(description: nil).each do |sl|
      sl.description = "None"
      sl.save!
    end
  end
end
