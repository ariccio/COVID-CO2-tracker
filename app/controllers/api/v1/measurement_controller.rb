# frozen_string_literal: true

def measurement_controller_create_response_as_json(new_measurement)
  # byebug
  {
    measurement_id: new_measurement.id,
    device_id: new_measurement.device.id,
    co2ppm: new_measurement.co2ppm,
    place_id: new_measurement.sub_location.place.id,
    measurementtime: new_measurement.measurementtime
  }
end

class InvalidComboError < ::RuntimeError
end

def raise_if_invalid_parameter_combo(measurement_params)
  # byebug
  location_where_inside_info = measurement_params[:location_where_inside_info]
  sub_location_id = measurement_params[:sub_location_id]
  if (location_where_inside_info && (!location_where_inside_info.empty?)) && (sub_location_id.to_i != -1)
    # byebug
    Rails.logger.debug("location_where_inside_info: #{location_where_inside_info}, sub_location_id: #{sub_location_id}. all params: #{measurement_params}")
    raise(InvalidComboError)
  end
  if (sub_location_id.to_i != -1) && (location_where_inside_info && (!location_where_inside_info.empty?))
    # byebug
    Rails.logger.debug("location_where_inside_info: #{location_where_inside_info}, sub_location_id: #{sub_location_id}. all params: #{measurement_params}")
    raise(InvalidComboError)
  end

  # byebug
end

module Api
  module V1
    class MeasurementController < ApiController
      # Maybe I should refactor-out skip_before_action? https://vaidehijoshi.github.io/blog/2015/10/13/stop-worrying-and-start-being-concerned-activesupport-concerns/
      skip_before_action :authorized, only: [:show]
      def show
        # find(*args): https://api.rubyonrails.org/v6.1.3.1/classes/ActiveRecord/FinderMethods.html#method-i-find
        # "If one or more records cannot be found for the requested ids, then ActiveRecord::RecordNotFound will be raised"
        @measurement = ::Measurement.find(params.fetch(:id))
        # byebug

        # TODO: lots of these lookups can fail in the future (e.g. if device gets deleted, user gets deleted, etc...)
        render(
          json: {
            data: ::MeasurementSerializer.new(@measurement).serializable_hash,
            place_id: @measurement.sub_location.place.google_place_id,
            taken_by: @measurement.device.user.name
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        errors = [create_error("measurement #{params.fetch(:id)} not found"), create_activerecord_error('measurement not found!', e)]
        render(
          json: {
            errors:
          },
          status: :not_found
        )
      end
      def create
        # byebug
        create_measurement_internal

        @new_measurement.save!
        # byebug
        render(
          json: measurement_controller_create_response_as_json(@new_measurement),
          status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        # (byebug) pp e.record.errors.errors
        # [#<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>,
        #  #<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>,
        #  #<ActiveModel::Error attribute=crowding, type=blank, options={}>,
        #  #<ActiveModel::Error attribute=device, type=invalid, options={:value=>#<Device id: 10, serial: "2123", model_id: 7, user_id: 3, created_at: "2021-03-21 05:27:16.309051000 +0000", updated_at: "2021-03-21 05:27:16.309051000 +0000">}>,
        #  #<ActiveModel::Error attribute=sub_location, type=invalid, options={:value=>#<SubLocation id: 57, description: "farts", place_id: 52, created_at: "2021-08-06 19:43:17.617688000 +0000", updated_at: "2021-08-06 19:43:17.617688000 +0000">}>]
        render(
          json: {
            errors: [create_activerecord_recordinvalid_error('measurement creation failed!', e)]
          },
          status: :bad_request
        )
      rescue ::ActiveRecord::RecordNotFound => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_notfound_error("couldn't find google_place_id: #{measurement_params.fetch(:google_place_id)} to create measurement for. Possible bug.", e)]
          },
          status: :bad_request
        )
      rescue InvalidComboError => e
        Rails.logger.debug("InvalidComboError params: #{measurement_params}")
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_error('invalid parameter combination: this is a bug. Automatically reported.', e)]
          },
          status: :bad_request
        )
      end

      def destroy
        measurement = @user.measurement.find(params[:id])
        measurement.destroy!
        render(
          json: {}, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_error("couldn't find measurement #{params[:id]} for deletion.", e)]
          },
          status: :not_found
        )
      end


      private

      def measurement_params
        params.require(:measurement).permit(:id, :device_id, :co2ppm, :measurementtime, :google_place_id, :crowding, :location_where_inside_info, :sub_location_id, :realtime)
      end

      def create_measurement_internal
        # TODO: handle ActionController::ParameterMissing: https://apidock.com/rails/ActionController/ParameterMissing
        @place = ::Place.find_by!(google_place_id: measurement_params.fetch(:google_place_id))
        raise_if_invalid_parameter_combo(measurement_params)
        # byebug
        sub_location = find_or_create_sublocation
        time = custom_time_or_now
        crowding = nil
        crowding = measurement_params.fetch(:crowding) if measurement_params[:realtime].blank?
        # byebug
        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/15
        # ALSO, TODO: check to see if I should disable timezone conversion on backend?
        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/15
        @new_measurement = ::Measurement.new(
          device_id: measurement_params.fetch(:device_id),
          co2ppm: measurement_params.fetch(:co2ppm),
          measurementtime: time,
          sub_location:,
          crowding:
        )
        return @new_measurement
      end

      def custom_time_or_now
        return measurement_params.fetch(:measurementtime) unless (measurement_params[:measurementtime].blank?)

        ::Time.current
      end

      def find_or_create_sublocation
        if (measurement_params[:sub_location_id].to_i != -1)
          return ::SubLocation.find(measurement_params.fetch(:sub_location_id))
        end

        ::Rails.logger.info('TODO: unique index for description in scope of sublocation, maybe needs partial index? Then validates_uniqueness_of')
        @place.sub_location.find_or_create_by!(description: measurement_params.fetch(:location_where_inside_info))
      end
    end
  end
end
