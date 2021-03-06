# frozen_string_literal: true

def measurements_serializer(measurements, device_id)
  measurements.each.map do |measurement|
    {
      device_id: measurement.device.id, # device_id?
      measurement_id: measurement.id,
      co2ppm: measurement.co2ppm,
      measurementtime: measurement.id
    }
  end
end

def first_ten_measurements(device_id)
  measurements = ::Measurement.where(device_id: device_id).first(10)
  measurements_serializer(measurements, device_id)
end

module Api
  module V1
    class DeviceController < ApplicationController
      skip_before_action :authorized, only: [:show]
      def create
        @model = Model.find_by(id: device_params[:model_id])
        @new_device_instance = ::Device.create!(serial: device_params[:serial], model_id: device_params[:model_id], user: current_user)
        render(
          json: {
            serial: @new_device_instance.serial,
            model_id: @new_device_instance.model.id,
            user_id: @new_device_instance.user.id,
            device_id: @new_device_instance.id
          },
          status: :created
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_notfound_error("Couldn't find record while creating new device instance. Wrong model? Possible bug", e)]
          },
          status: :bad_request
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('device creation failed!', e)]
          },
          status: :bad_request
        )
      end

      def show
        # byebug
        @device_instance = ::Device.find(params[:id])
        render(
          json: {
            device_id: @device_instance.id,
            serial: @device_instance.serial,
            device_model: @device_instance.model.name,
            user_id: @device_instance.user.id,
            measurements: first_ten_measurements(@device_instance.id)
            # total number of measurements
          },
          status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('device not found!', e)]
          },
          status: :not_found
        )
      end

      def destroy
        @device_instance = ::Device.find(params[:id])
        # byebug
        if @device_instance.user != current_user
          return render(
            json: {
              errors: [create_error("you can only delete your own devices!")]
            }, status: :unauthorized
          )
        end
        measurement_count = @device_instance.measurement.count
        if measurement_count > 0
          return render(
            json: {
              errors: [create_error("I haven't built the functionality to delete devices with measurements yet. Device has #{measurement_count} measurements")]
            }, status: :not_implemented
          )
        end
        @device_instance.destroy!
        render(
          json: {

          }, status: :ok
        )
      end

      def device_params
        # this isn't right?
        ::Rails.logger.error('todo, check this symbol in parenthesis?')
        # byebug
        params.require(:device).permit(:id, :serial, :model_id)
      end
    end
  end
end
