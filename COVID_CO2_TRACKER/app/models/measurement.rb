# frozen_string_literal: true

class Measurement < ApplicationRecord
  belongs_to :device
  belongs_to :place
  # needs validation of positivity, fatal levels


  # GODDAMNIT I NEED TO WRITE A SERIALIZER
  def self.measurement_with_device_place_as_json(measurement, device)
    {
      device_id: device.id,
      measurement_id: measurement.id,
      co2ppm: measurement.co2ppm,
      measurementtime: measurement.measurementtime,
      place: {
        id: measurement.place.id,
        google_place_id: measurement.place.google_place_id
      }
    }
  end
end
