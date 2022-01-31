# frozen_string_literal: true

def maps_javascript_api_key_from_disk
  ::Rails.application.credentials.maps![:maps_javascript_api_key]
end

module Api
  module V1
    class KeysController < ApiController
      skip_before_action :authorized, only: [:show]
      def show
        api_name_requested = params.fetch(:id)
        case api_name_requested
        when 'MAPS_JAVASCRIPT_API_KEY'
          render(
            json: {
              key: maps_javascript_api_key_from_disk
            },
            status: :ok
          )
        when 'GOOGLE_LOGIN_CLIENT_ID'
          render(
            json: {
              key: ::Rails.application.credentials.google_sign_in![:client_id]
            },
            status: :ok
          )
        else
          ::Sentry.capture_message("unknown api name: #{api_name_requested}")
          render(
            json: {
              errors: [create_error("unknown api name: #{api_name_requested}", nil)]
            },
            status: :bad_request
          )
        end
      end
      # def api_keys_params
      #     params.require(:api_name)
      # end
    end
  end
end
