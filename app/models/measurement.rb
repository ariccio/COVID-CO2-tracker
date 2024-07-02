# frozen_string_literal: true

class Measurement < ApplicationRecord
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  belongs_to :device
  belongs_to :sub_location
  belongs_to :extra_measurement_info, optional: true, inverse_of: :measurement


  # Note to self, from active record doctor:
  # add `NOT NULL` to measurements.sub_location_id - models validates its presence but it's not non-NULL in the database

  validates :co2ppm, presence: true
  validates :measurementtime, presence: true
  validates :device_id, presence: true
  validates :crowding, presence: true, :unless => :is_realtime?


  validates :co2ppm, numericality: { greater_than_or_equal_to: 0 }
  validates :co2ppm, numericality: { less_than: 80_000, message: "co2ppm is greater than lethal level, if you're not dead, your meter is wrong." }
  validates :co2ppm, numericality: { less_than: 50_000, message: "co2ppm is greater than level where it's immediately dangerous to life or health, if you're not feeling sick, check your meter." }
  validates :co2ppm, numericality: { less_than: 40_000, message: "co2ppm is greater than level where it's immediately dangerous to life or health, if you're not feeling sick, check your meter." }
  validates :co2ppm, numericality: { less_than: 30_000, message: "co2ppm is greater than American Conference of Governmental Industrial Hygienists short term Threshold Limit Value of 30,000ppm, if you're not feeling sick, check your meter." }
  validates :crowding, numericality: { greater_than_or_equal_to: 1 }, :unless => :is_realtime?
  validates :crowding, numericality: { less_than_or_equal_to: 5 }, :unless => :is_realtime?

  validates_datetime :measurementtime
  validates_datetime :measurementtime, on_or_before: -> { ::Time.current }, invalid_datetime_message: 'Measurement is in future, what?'
  validates_datetime :measurementtime, on_or_after: -> { EARLIEST_TIME }, invalid_datetime_message: 'Measurement was taken before COVID pandemic, are you sure you entered it correctly?'

  validates_associated :device, :sub_location

  EARLIEST_TIME = ::Time.parse('2020-01-01')

  def is_realtime?
    return false unless extra_measurement_info

    # byebug

    true
  end

end
