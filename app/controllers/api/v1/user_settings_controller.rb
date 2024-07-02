# frozen_string_literal: true

module Api
  module V1
    class UserSettingsController < ApiController
      def show
        us = @user.user_setting
        # byebug
        uss = ::UserSettingSerializer.new(us).serializable_hash
        # byebug
        # TODO: should be serializer?
        render(
          json: uss,
          status: :ok
        )
      end

      def create
        # Will need to rewrite to use update if I have any other settings.
        place = Place.find_by(google_place_id: user_settings_params.fetch(:realtime_upload_google_place_id))
        sublocation = SubLocation.find(user_settings_params.fetch(:realtime_upload_sub_location_id))
        if (sublocation.place != place)
          Sentry.capture_message("Bug? Trying to create user settings with sublocation (#{sublocation.id}, #{sublocation.place.id}) in a different place #{place.id}?")
          return render(
            json: {
              errors: [create_place_differs_sublocation_place(place, sublocation)]
            }, status: :bad_request
          )
        end
        # , realtime_upload_place_id: place.id, realtime_upload_sub_location_id: sublocation.place.id
        settings = UserSetting.find_by(user_id: @user.id)
        if settings == nil
          settings = UserSetting.create!(user_id: @user.id, realtime_upload_place: place, realtime_upload_sub_location: sublocation)
        else
          settings.realtime_upload_place = place
            settings.realtime_upload_sub_location = sublocation
            # settings = UserSetting.find_or_create_by(user_id: @user.id, realtime_upload_place: place, realtime_upload_sub_location: sublocation)
            settings.save!
        end
        # byebug
        # byebug
        render(
          json: {},
          status: :created
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
            errors: [create_activerecord_notfound_error("couldn't find place (#{user_settings_params.fetch(:realtime_upload_google_place_id)}) OR sublocation (#{user_settings_params.fetch(:realtime_upload_sub_location_id)}) to create settings for. Possible bug.", e)]
          },
          status: :bad_request
        )
      end
      def destroy
        # byebug
        us = @user.user_setting
        if (us == nil)
          return render_empty
        end

        us.destroy!
        render_empty
      rescue ::ActiveRecord::RecordNotFound => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_notfound_error("Failed to destroy record, it doesn't exist? Possible bug, reported automatically.", e)]
          },
          status: :bad_request
        )
      rescue ::ActiveRecord::RecordNotDestroyed => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_error('Destroying user settings failed, reason unknown/unexpected! Reported automatically.', e)]
          },
          status: :internal_server_error
        )
      end


      def user_settings_params
        params.require(:user_settings).permit(:realtime_upload_place_id, :realtime_upload_sub_location_id, :realtime_upload_google_place_id)
      end
    end
  end
end
