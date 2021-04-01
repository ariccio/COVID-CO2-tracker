# frozen_string_literal: true


def device_create_response_as_json(new_device_instance)
  {
    serial: new_device_instance.serial,
    model_id: new_device_instance.model.id,
    user_id: new_device_instance.user.id,
    device_id: new_device_instance.id
  }
end

module Api
  module V1
    class DeviceController < ApiController
      skip_before_action :authorized, only: [:show]
      def create
        @model = ::Model.find_by!(id: device_params.fetch(:model_id))

        # this should be in a validator class:
        if @model.device.where(serial: device_params.fetch(:serial)).count.positive?
          return render(
            json: {
              errors: [single_error("#{@model.name} with serial #{device_params.fetch(:serial)} already exists.", nil)]
            }, status: :bad_request
          )
        end

        @new_device_instance = ::Device.create!(serial: device_params.fetch(:serial), model_id: device_params.fetch(:model_id), user: current_user)
        render(
          json: device_create_response_as_json(@new_device_instance),
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
        # .includes(:model, :user, :measurement, measurement: :sub_location)
        @device_instance = ::Device.includes(:model, :user, :measurement, measurement: :sub_location).find(params.fetch(:id))
        # byebug
        render(
          json: {
            device_id: @device_instance.id,
            serial: @device_instance.serial,
            device_model: @device_instance.model.name,
            user_id: @device_instance.user.id,
            measurements: @device_instance.first_ten_measurements()
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
        @device_instance = @user.devices.find(params.fetch(:id))
        if @device_instance.user != current_user
          return render(
            json: {
              errors: [create_error('you can only delete your own devices!')]
            }, status: :unauthorized
          )
        end
        measurement_count = @device_instance.measurement.count
        if measurement_count.positive?
          return render(
            json: {
              errors: [create_error("I haven't built the functionality to delete devices with measurements yet. Device has #{measurement_count} measurements. Delete them first.", nil)]
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
