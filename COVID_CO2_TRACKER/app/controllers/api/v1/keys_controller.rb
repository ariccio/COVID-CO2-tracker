PLACES_SCRIPT_URL_API_KEY_PATH = ::Rails.root.join('config', 'keys', 'google_places_api_key.txt.key')
MAPS_JAVASCRIPT_API_KEY_PATH = ::Rails.root.join('config', 'keys', 'google_maps_javascript_api_key.txt.key')


def places_script_url_api_key_from_disk
  key = ::IO.binread(::PLACES_SCRIPT_URL_API_KEY_PATH)
  if key.blank?
    ::Rails.logging.error("Check your key file in #{::PLACES_SCRIPT_URL_API_KEY_PATH}")
    # Not meant to be handled in a way that renders to user. This is a true internal server error.
    raise(::StandardError)
  end
  key
end

def maps_javascript_api_key_from_disk
  key = ::IO.binread(::MAPS_JAVASCRIPT_API_KEY_PATH)
  if key.blank?
    ::Rails.logging.error("Check your key file in #{::MAPS_JAVASCRIPT_API_KEY_PATH}")
    # Not meant to be handled in a way that renders to user. This is a true internal server error.
    raise(::StandardError)
  end
  key
end

module Api
  module V1
    class KeysController < ApplicationController
      skip_before_action :authorized, only: [:show]
      def show
        api_name_requested = params[:id]
        case api_name_requested
        when 'PLACES_SCRIPT_URL_API_KEY'
          render(
            json: {
              key: places_script_url_api_key_from_disk
            },
            status: :ok
          )
        when 'MAPS_JAVASCRIPT_API_KEY'
          render(
            json: {
              key: maps_javascript_api_key_from_disk
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
