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
    measurements = Measurement.where(device_id: device_id).first(10)
    measurements_serializer(measurements, device_id)
end

module Api
    module V1
        class DeviceController < ApplicationController
            skip_before_action :authorized, only: [:show]

            def create
                @new_device_instance = Device.create!(serial: device_params[:serial], model: device_params[:model_id], user: device_params[:user_id])
                render json: {
                    serial: @new_device_instance.serial,
                    model_id: @new_device_instance.model.id,
                    user_id: @new_device_instance.user.id,
                    device_id: @new_device_instance.id
                }, status: :created
            rescue ActiveRecord::RecordInvalid => e
                render json: {
                    errors: [create_activerecord_error("device creation failed!", e)]
                }, status: :bad_request
            end

            def show
                # byebug
                @device_instance = Device.find(params[:id])
                render json: {
                    device_id: @device_instance.id,
                    serial: @device_instance.serial,
                    device_model: @device_instance.model.name,
                    user_id: @device_instance.user.id,
                    measurements: first_ten_measurements(@device_instance.id)
                    # total number of measurements
                }
            rescue ActiveRecord::RecordNotFound => e
                render json: {
                    errors: [create_activerecord_error("device not found!", e)]
                }, status: :not_found
            end

            def device_params
                params.require[:device].permit(:id, :serial, :model_id, :user_id)
            end
        end
    end
end