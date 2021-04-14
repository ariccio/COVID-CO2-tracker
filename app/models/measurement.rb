# frozen_string_literal: true

class Measurement < ApplicationRecord
  belongs_to :device
  # belongs_to :place
  belongs_to :sub_location

  # needs validation of positivity, fatal levels
  validates :co2ppm, numericality: { greater_than_or_equal_to: 0 }
  validates :co2ppm, numericality: { less_than: 80_000, message: "co2ppm is greater than lethal level, if you're not dead, your meter is wrong." }
  validates :co2ppm, numericality: { less_than: 50_000, message: "co2ppm is greater than level where it's immediately dangerous to life or health, if you're not feeling sick, check your meter." }
  validates :co2ppm, numericality: { less_than: 40_000, message: "co2ppm is greater than level where it's immediately dangerous to life or health, if you're not feeling sick, check your meter." }
  validates :co2ppm, numericality: { less_than: 30_000, message: "co2ppm is greater than American Conference of Governmental Industrial Hygienists short term Threshold Limit Value of 30,000ppm, if you're not feeling sick, check your meter." }
  validates :crowding, numericality: { greater_than_or_equal_to: 1 }
  validates :crowding, numericality: { less_than_or_equal_to: 5 }
  validates :device_id, presence: true
  validates :crowding, presence: true

  validates_associated :device, :sub_location

  # GODDAMNIT I NEED TO WRITE A SERIALIZER
  def self.measurement_with_device_as_json(measurement)
    # byebug
    {
      measurement_id: measurement.id,
      co2ppm: measurement.co2ppm,
      measurementtime: measurement.measurementtime,
      crowding: measurement.crowding,
      device_id: measurement.device.id,
      # device_name: measurement.device.model.name,
    }
  end
end
