# frozen_string_literal: true

# This migration adds the unique index to the models table after duplicates have been cleaned up.
# It was originally intended to be part of CreateExportSystem (20250828000000) but was skipped
# due to existing duplicate records in production.
#
# Prerequisites:
#   - Run 'rails runner scripts/fix_duplicate_models.rb' on production first
#   - Verify no duplicates remain with:
#     Model.select(:name, :manufacturer_id).group(:name, :manufacturer_id).having('COUNT(*) > 1').pluck(:name, :manufacturer_id)
#
class AddUniqueIndexToModelsAfterCleanup < ActiveRecord::Migration[7.1]
  disable_ddl_transaction! # Required for concurrent index creation

  def up
    # Final safety check - ensure no duplicates exist before creating index
    duplicate_models = ActiveRecord::Base.connection.execute(<<-SQL.squish)
      SELECT name, manufacturer_id, COUNT(*) as count
      FROM models
      GROUP BY name, manufacturer_id
      HAVING COUNT(*) > 1
    SQL

    if duplicate_models.any?
      # Log the duplicates for debugging
      puts "\n✗ ERROR: Cannot add unique index - duplicate models still exist:"
      duplicate_models.each do |row|
        puts "  - Model '#{row['name']}' with manufacturer_id #{row['manufacturer_id']} has #{row['count']} copies"
      end

      # Raise an exception to stop the migration
      raise StandardError, <<~ERROR

        Duplicate models found in database!

        To fix this:
        1. Run: heroku run rails runner scripts/fix_duplicate_models.rb --app covid-co2-tracker
        2. Verify duplicates are gone
        3. Deploy this migration again

        IMPORTANT: Do not force this migration or data integrity will be compromised.
      ERROR
    end

    # Check if index already exists (in case of retry or local development)
    unless index_exists?(:models, [:name, :manufacturer_id], name: 'index_models_on_name_and_manufacturer_id')
      puts "Creating unique index on models(name, manufacturer_id)..."

      add_index :models, [:name, :manufacturer_id],
                unique: true,
                algorithm: :concurrently,
                name: 'index_models_on_name_and_manufacturer_id'

      puts "✓ Unique index successfully created on models table"
    else
      puts "ℹ Index already exists, skipping creation"
    end
  end

  def down
    if index_exists?(:models, [:name, :manufacturer_id], name: 'index_models_on_name_and_manufacturer_id')
      remove_index :models, name: 'index_models_on_name_and_manufacturer_id', algorithm: :concurrently
    end
  end
end