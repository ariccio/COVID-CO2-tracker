class User < ApplicationRecord
    has_secure_password
    has_many :devices
    validates :email, presence: true, uniqueness: true
    validates :password_digest, presence: true

    def my_devices
      user_devices = devices
      user_devices.each.map do |device|
        {
          device_id: device.id,
          serial: device.serial,
          device_model_id: device.model.id,
          device_model: device.model.name,
          device_manufacturer: device.model.manufacturer.name,
          device_manufacturer_id: device.model.manufacturer_id
        }
      end
    end

      def my_measurements
        # @user = current_user
        measurements = []

        devices.each.map do |device|
          # byebug
          device.measurements.order('measurementtime DESC').each.map do |measurement|
            measurements << {
              device_id: device.id,
              measurement_id: measurement.id,
              co2ppm: measurement.co2ppm,
              measurementtime: measurement.measurementtime
            }
          end
        end
        measurements
      end

end
