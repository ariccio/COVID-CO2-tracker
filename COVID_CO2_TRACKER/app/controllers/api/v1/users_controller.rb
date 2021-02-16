module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :authorized, only: [:create]


# Note to self: https://philna.sh/blog/2020/01/15/test-signed-cookies-in-rails/
      def create
        @user = User.create!(user_params)
        token = encode_token(user_id: @user.id)

        # for good advice on httponly: https://www.thegreatcodeadventure.com/jwt-storage-in-rails-the-right-way/
        cookies.signed[:jwt] = {value: token, httponly: true}
        render json: { email: @user.email }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          errors: [create_activerecord_error('User info not valid!', e)]
        }, status: :unauthorized
      end

      def my_measurements
        @user = current_user
        measurements = []

        @user.devices.each.map do |device|
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

      def my_devices
        my_devices = @user.devices
        results = my_devices.each.map do |device|
          {
            device_id: device.id,
            serial: device.serial,
            device_model_id: device.model.id,
            device_model: device.model.name,
            device_manufacturer: device.model.manufacturer.name,
            device_manufacturer_id: device.model.manufacturer_id
          }
        end
        results
      end
    
      def show
        @user = current_user
        device_ids = my_devices 
        # byebug
        render json: {
          user_info: @user.as_json(only: [:email]),
          devices: device_ids,
          measurements: my_measurements
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          errors: [create_activerecord_error('User somehow not found.', e)]
        }, status: :unauthorized    
      end
    
    
      def user_params
        params.require(:user).permit(:email, :password)
      end
    end    
  end
end
