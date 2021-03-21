# frozen_string_literal: true

# MAPS_JAVASCRIPT_API_KEY_PATH = ::Rails.root.join('config', 'keys', 'google_maps_javascript_api_key.txt.key')

def maps_javascript_api_key_from_disk
  # byebug
  ::Rails.application.credentials.maps![:maps_javascript_api_key]
  # key = ::IO.binread(::MAPS_JAVASCRIPT_API_KEY_PATH)
  # if key.blank?
  #   ::Rails.logging.error("Check your key file in #{::MAPS_JAVASCRIPT_API_KEY_PATH}")
  #   # Not meant to be handled in a way that renders to user. This is a true internal server error.
  #   raise(::StandardError)
  # end
  # key
end

module Api
  module V1
    class KeysController < ApplicationController
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
