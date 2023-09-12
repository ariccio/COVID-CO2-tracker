# frozen_string_literal: true

class Place < ApplicationRecord
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  has_many :sub_location, dependent: :restrict_with_exception
  has_many :measurement, dependent: :restrict_with_exception, through: :sub_location

  acts_as_mappable(default_units: :miles, default_formula: :sphere, distance_field_name: :distance, lat_column_name: :place_lat, lng_column_name: :place_lng)

  def self.ransackable_attributes(auth_object = nil)
    # https://activerecord-hackery.github.io/ransack/going-further/other-notes/#authorization-allowlistingdenylisting
    if auth_object == :admin
      # whitelist all attributes for admin
      super
    else
      # whitelist only the title and body attributes for other users
      super & %w(title body)
    end
  end

  def place_measurementtime_desc
    # TODO: This SUCKS
    sub_location.includes(:measurement).find_each.map do |loc|
      temp = ::MeasurementSerializer.new(loc.measurement.order('measurementtime DESC')).serializable_hash
      {
        sub_location_id: loc.id,
        description: loc.description,
        measurements: temp
      }
    end
    # byebug
  end

  def self.testing_data_migration
    # say('UGLY manual data migration...')
    ::Place.all.find_each do |place|
      place.measurement.each do |measurement|
        new_sub_location = place.sub_location.find_or_create_by!(description: measurement.location_where_inside_info)
        measurement.sub_location = new_sub_location
        measurement.save!
      end
    end
  end

  def place_needs_refresh?
    # byebug
    return true if place_lat.nil?

    return true if place_lng.nil?

    return true if last_fetched.nil?
    # (place.last_fetched < 30.days.ago) is true if last_fetched was MORE than 30.days.ago because that time is logically smaller.
    return true if (last_fetched && (last_fetched < 30.days.ago))

    # byebug

    false
  end
end
