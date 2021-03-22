# frozen_string_literal: true

def measurement_controller_create_response_as_json(new_measurement)
  {
    measurement_id: new_measurement.id,
    device_id: new_measurement.device.id,
    co2ppm: new_measurement.co2ppm,
    place_id: new_measurement.place,
    measurementtime: new_measurement.measurementtime
  }
end

module Api
  module V1
    class MeasurementController < ApplicationController
      skip_before_action :authorized, only: [:show]
      def create
        # byebug
        @place = ::Place.find_by!(google_place_id: measurement_params.fetch(:google_place_id))

        # places_backend_api_key

        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/15
        # ALSO, TODO: check to see if I should disable timezone conversion on backend?
        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/15
        @new_measurement = ::Measurement.create!(device_id: measurement_params.fetch(:device_id), co2ppm: measurement_params.fetch(:co2ppm), measurementtime: ::Time.current, place_id: @place.id, crowding: measurement_params.fetch(:crowding), location_where_inside_info: measurement_params.fetch(:location_where_inside_info))

        render(
          json: measurement_controller_create_response_as_json(@new_measurement),
          status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('measurement creation failed!', e)]
          },
          status: :bad_request
        )
      end

      def show
        # TODO: what reaches this route?
        ::Rails.loggger.debug('What hit this route?')
        byebug
        @measurement = ::Measurement.find(measurement_params.fetch(:id))
        as_json_result = ::Measurement.measurement_with_device_place_as_json(@measurement)
        render(
          json: as_json_result,
          status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('measurement not found!', e)]
          },
          status: :not_found
        )
      end

      def destroy
        measurement = @user.measurement.find(params[:id])
        measurement.destroy!
        render(
          json: {

          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error("couldn't find measurement #{params[:id]} for deletion.", e)]
          },
          status: :not_found
        )
      end

      def measurement_params
        params.require(:measurement).permit(:id, :device_id, :co2ppm, :measurementtime, :google_place_id, :crowding, :location_where_inside_info)
      end
    end
  end
end
