# frozen_string_literal: true

class Measurement < ApplicationRecord
  belongs_to :device
  belongs_to :place

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

  validates_associated :device, :place

  # GODDAMNIT I NEED TO WRITE A SERIALIZER
  def self.measurement_with_device_place_as_json(measurement)
    {
      device_id: measurement.device.id,
      measurement_id: measurement.id,
      co2ppm: measurement.co2ppm,
      measurementtime: measurement.measurementtime,
      crowding: measurement.crowding,
      location_where_inside_info: measurement.location_where_inside_info,
      place: {
        id: measurement.place.id,
        google_place_id: measurement.place.google_place_id
      }
    }
  end

  def self.measurements_as_json(measurements)
    measurements.each.map do |measurement|
      measurement_with_device_place_as_json(measurement)
    end
  end
end
