# frozen_string_literal: true

module Api
  module V1
    class UserSettingsController < ApiController
      def show
        # byebug
        render json: {
            
        }
      end

      def destroy
        byebug
      end

      def create
        # Will need to rewrite to use update if I have any other settings.
        place = Place.find_by(google_place_id: user_settings_params.fetch(:realtime_upload_place_id))
        sublocation = SubLocation.find(user_settings_params.fetch(:realtime_upload_sub_location_id))
        if (sublocation.place != place)
          Sentry.capture_message("Bug? Trying to create user settings with sublocation (#{sublocation.id}, #{sublocation.place.id}) in a different place #{place.id}?")
          return render(
            json: {
              errors: [create_place_differs_sublocation_place(place, sublocation)]
            }, status: :bad_request
          )
        end
        settings = UserSetting.find_or_create_by!(user_id: @user.id, realtime_upload_place_id: place.id, realtime_upload_sub_location_id: sublocation.place.id)
        # byebug
        render(
            json: {},
            status: :ok
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('creating user settings failed!', e)]
          },
          status: :bad_request
        )
      rescue ::ActiveRecord::RecordNotFound => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_notfound_error("couldn't find place (#{user_settings_params.fetch(:realtime_upload_place_id)}) OR sublocation (#{user_settings_params.fetch(:realtime_upload_sub_location_id)}) to create settings for. Possible bug.", e)]
          },
          status: :bad_request
        )
      end

      def user_settings_params
        params.require(:user_settings).permit(:realtime_upload_place_id, :realtime_upload_sub_location_id)
      end
    end
  end
end
