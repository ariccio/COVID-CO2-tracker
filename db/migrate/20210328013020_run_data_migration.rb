class RunDataMigration < ActiveRecord::Migration[6.1]
  def change
    # run data migration with a class method in Place:
    # def self.testing_data_migration
    #   Place.all.each do |place|
    #     place.measurement.each do |measurement|
    #       new_sub_location = place.sub_location.find_or_create_by!(description: measurement.location_where_inside_info)
    #       measurement.sub_location = new_sub_location
    #       measurement.save!
    #     end
    #   end
    # end
    # I KNOW THIS IS NOT A BEST PRACTICE!
    Place.testing_data_migration

  end
end
