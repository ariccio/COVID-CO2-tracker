#!/usr/bin/env ruby
# frozen_string_literal: true

# Script to identify and fix duplicate models in the database
# Run with: rails runner scripts/fix_duplicate_models.rb

puts "Checking for duplicate models..."

# Find all duplicate model entries
duplicates = Model.select(:name, :manufacturer_id)
                  .group(:name, :manufacturer_id)
                  .having('COUNT(*) > 1')
                  .pluck(:name, :manufacturer_id)

if duplicates.empty?
  puts "✓ No duplicate models found!"
  exit 0
end

puts "\nFound #{duplicates.count} sets of duplicate models:"
puts "=" * 60

duplicates.each do |name, manufacturer_id|
  puts "\nModel: '#{name}', Manufacturer ID: #{manufacturer_id}"

  # Get all duplicate records
  duplicate_records = Model.where(name: name, manufacturer_id: manufacturer_id)
                           .order(:created_at)

  puts "  Found #{duplicate_records.count} duplicate records:"

  # Show details of each duplicate
  duplicate_records.each_with_index do |model, index|
    device_count = model.devices.count
    measurement_count = Measurement.joins(:device).where(devices: { model_id: model.id }).count

    status = index == 0 ? "[KEEP]" : "[DUPLICATE]"
    puts "  #{status} ID: #{model.id}, Created: #{model.created_at.strftime('%Y-%m-%d %H:%M')}"
    puts "          Devices: #{device_count}, Measurements: #{measurement_count}"
  end

  # Keep the first (oldest) record
  keeper = duplicate_records.first
  duplicates_to_merge = duplicate_records.offset(1)

  puts "\n  Plan: Keep model ##{keeper.id}, merge #{duplicates_to_merge.count} duplicates"
end

puts "\n" + "=" * 60
print "\nDo you want to proceed with merging duplicates? (yes/no): "

response = STDIN.gets.chomp.downcase
unless response == 'yes' || response == 'y'
  puts "Operation cancelled."
  exit 0
end

puts "\nMerging duplicates..."

ActiveRecord::Base.transaction do
  duplicates.each do |name, manufacturer_id|
    duplicate_records = Model.where(name: name, manufacturer_id: manufacturer_id)
                             .order(:created_at)

    keeper = duplicate_records.first
    duplicates_to_merge = duplicate_records.offset(1)

    duplicates_to_merge.each do |duplicate|
      # Update all devices that reference the duplicate to point to the keeper
      Device.where(model_id: duplicate.id).update_all(model_id: keeper.id)

      # Delete the duplicate
      duplicate.destroy!
      puts "  ✓ Merged model ##{duplicate.id} into ##{keeper.id}"
    end
  end

  puts "\n✓ Successfully merged all duplicates!"
end

# Verify the fix
remaining_duplicates = Model.select(:name, :manufacturer_id)
                            .group(:name, :manufacturer_id)
                            .having('COUNT(*) > 1')
                            .count

if remaining_duplicates.empty?
  puts "✓ Verification passed: No duplicate models remain"
  puts "\nYou can now safely deploy the migration that adds the unique index."
else
  puts "✗ ERROR: #{remaining_duplicates.count} duplicate sets still remain!"
  puts "Please investigate manually."
  exit 1
end