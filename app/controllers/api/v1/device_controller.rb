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
      def create
        # Rails.logger.debug("user: #{@user.email} trying to create device with params #{params}")
        # find(*args): https://api.rubyonrails.org/v6.1.3.1/classes/ActiveRecord/FinderMethods.html#method-i-find
        # "If one or more records cannot be found for the requested ids, then ActiveRecord::RecordNotFound will be raised"
        @model = ::Model.find(device_params.fetch(:model_id))

        return if check_for_duplicate_user_device?
        return if check_for_global_duplicate_device?
        return if check_user_logged_in?

        @new_device_instance = ::Device.create!(serial: device_params.fetch(:serial), model_id: device_params.fetch(:model_id), user: @user)
        render(
          json: device_create_response_as_json(@new_device_instance),
          status: :created
        )
      rescue ::ActiveRecord::RecordNotFound => e
        handle_model_not_found_error(e)
      rescue ::ActiveRecord::RecordInvalid => e
        handle_device_creation_error(e)
      end

      private

      def check_for_duplicate_user_device?
        serial = device_params.fetch(:serial)
        model_id = device_params.fetch(:model_id)
        if @user.devices.where(model_id: model_id).where(serial: serial).size.positive?
          error_message = "You already uploaded a #{@model.name} to your account with the serial # '#{serial}'! Use that to add measurements."
          Sentry.capture_message("User already uploaded a #{@model.name} to your account with the serial # '#{serial}'!")
          render(
            json: {
              errors: [single_error(error_message, nil)]
            }, status: :bad_request
          )
          return true
        end
        return false
      end

      def check_for_global_duplicate_device?
        serial = device_params.fetch(:serial)
        # this should be in a validator class:
        # TODO: check if @model.device is nil and then return error.
        if @model.device.where(serial: serial).any?
          error_message = "#{@model.name} with serial # '#{serial}' already exists in global database."
          Sentry.capture_message("#{@model.name} with serial # '#{serial}' already exists.")
          render(
            json: {
              errors: [single_error(error_message, nil)]
            }, status: :bad_request
          )
          return true
        end
        return false
      end

      def check_user_logged_in?
        if (@user.nil?)
          render_not_logged_in
          return true
        end
        return false
      end

      def handle_model_not_found_error(exception)
        ::Sentry.capture_exception(exception)
        render(
          json: {
            errors: [create_activerecord_notfound_error('Invalid model_id.', exception)]
          },
          status: :bad_request
        )
      end

      def handle_device_creation_error(exception)
        render(
          json: {
            errors: [create_activerecord_error('device creation failed!', exception)]
          },
          status: :bad_request
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
          json: {}, status: :ok
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
