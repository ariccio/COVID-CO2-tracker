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
        # Rails.logger.debug("user: #{@user.email} trying to create device with params #{params}")
        # find(*args): https://api.rubyonrails.org/v6.1.3.1/classes/ActiveRecord/FinderMethods.html#method-i-find
        # "If one or more records cannot be found for the requested ids, then ActiveRecord::RecordNotFound will be raised"
        @model = ::Model.find(device_params.fetch(:model_id))

        if @user.devices.where(model_id: device_params.fetch(:model_id)).where(serial: device_params.fetch(:serial)).size.positive?
          Sentry.capture_message("User already uploaded a #{@model.name} to your account with the serial # '#{device_params.fetch(:serial)}'!")
          return render(
            json: {
              errors: [single_error("You already uploaded a #{@model.name} to your account with the serial # '#{device_params.fetch(:serial)}'! Use that to add measurements.", nil)]
            }, status: :bad_request
          )
        end
        # this should be in a validator class:
        # TODO: check if @model.device is nil and then return error.
        if @model.device.where(serial: device_params.fetch(:serial)).count.positive?
          Sentry.capture_message("#{@model.name} with serial # '#{device_params.fetch(:serial)}' already exists.")
          return render(
            json: {
              errors: [single_error("#{@model.name} with serial # '#{device_params.fetch(:serial)}' already exists in global database.", nil)]
            }, status: :bad_request
          )
        end

        if (@user.nil?)
          render_not_logged_in
          return
        end
        @new_device_instance = ::Device.create!(serial: device_params.fetch(:serial), model_id: device_params.fetch(:model_id), user: @user)
        render(
          json: device_create_response_as_json(@new_device_instance),
          status: :created
        )
      rescue ::ActiveRecord::RecordNotFound => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_notfound_error("Invalid model_id.", e)]
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

        # TODO: duh, When I have more than ten measurements!
        render(
          json: {
            device_id: @device_instance.id,
            serial: @device_instance.serial,
            device_model: @device_instance.model.name,
            device_model_id: @device_instance.model.id,
            user_id: @device_instance.user.id,
            measurements: @device_instance.first_ten_measurements
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
          ::Sentry.capture_message('Build device deletion code!')
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
        # ::Rails.logger.error('todo, check this symbol in parenthesis?')
        # byebug
        params.require(:device).permit(:id, :serial, :model_id)
      end
    end
  end
end
