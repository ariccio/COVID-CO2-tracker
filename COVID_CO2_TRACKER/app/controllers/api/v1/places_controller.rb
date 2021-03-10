# require 'httparty'

module Api
  module V1
    class PlacesController < ApplicationController
      include ::GooglePlaces

      before_action :setup_places_client
      # before_action :set_place, only: [:show, :update, :destroy]
      # Don't want much of the scaffolding generated stuff

      # # GET /places
      # def index
      #   @places = Place.all
    
      #   render json: @places
      # end
    
      
      # GET /places/1
      def show
        @place = Place.find(params[:id])

        if @place.last_fetched < 30.days.ago
          Rails.logging.warn("Last fetched #{time_ago_in_words(@place.last_fetch)} - Need to update to comply with google caching restrictions!")
        end
        render json: @place
      rescue ::ActiveRecord::RecordNotFound => e
        # TODO: query from the backend too to validate input is correct

      end

      def place_by_google_place_id_exists
        @place = Place.find_by!(google_place_id: params[:google_place_id])
        render(
          json: {
            exists: true
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => _e
        render(
          json: {
            exists: false
          }, status: :ok
        )
      end

      def show_by_google_place_id
        # byebug
        @place = Place.find_by!(google_place_id: params[:google_place_id])
        measurements = @place.measurement.order('measurementtime DESC').each.map do |measurement|
          Measurement.measurement_with_device_place_as_json(measurement, measurement.device)
        end
        render(
          json: {
            created: false,
            measurements: measurements,
            place_id: @place.id
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        # TODO: query from the backend too to validate input is correct
        # byebug
        error_array = [create_error("#{params[:google_place_id]} does not exist in database. Not necessarily an error!", :not_acceptable.to_s)]
        error_array << create_activerecord_notfound_error("not found", e)
        render(
          json: {
            errors: error_array
          }, status: :not_found
        )
        # @place = Place.create!(google_place_id: params[:google_place_id])
        # render(
        #   json: {
        #     created: true,
        #     measurements: @place.measurement,
        #     place_id: @place.id
        #   }, status: :ok
        # )
      end
    
      # POST /places
      def create
        options = {
          fields: 'geometry'
        }
        # byebug
        @spot = @place_client.spot(place_params[:google_place_id], options)
        # byebug
        # @spot.lat, @spot.lng

        @place = Place.create!(google_place_id: place_params[:google_place_id])
        render(
          json: {
            place_id: @place.id
          }, status: :created
        )
        # From: C:\Ruby30-x64\lib\ruby\gems\3.0.0\gems\google_places-2.0.0\lib\google_places\request.rb
      # when 'OVER_QUERY_LIMIT'
      #   raise OverQueryLimitError.new(@response)
      # when 'REQUEST_DENIED'
      #   raise RequestDeniedError.new(@response)
      # when 'INVALID_REQUEST'
      #   raise InvalidRequestError.new(@response)
      # when 'UNKNOWN_ERROR'
      #   raise UnknownError.new(@response)
      # when 'NOT_FOUND'
      #   raise NotFoundError.new(@response)
      # end

      rescue GooglePlaces::OverQueryLimitError => e
        render(
          json: {
            errors: [google_places_error("Too many queries for backend API!", e)]
          }, status: :bad_request
        )
      rescue GooglePlaces::RequestDeniedError => e
        render(
          json: {
            errors: [google_places_error("backend request denied", e)]
          }, status: :bad_request
        )
      rescue GooglePlaces::InvalidRequestError => e
        render(
          json: {
            errors: [google_places_error("backend invalid request to google places", e)]
          }, status: :bad_request
        )
      rescue GooglePlaces::UnknownError => e
        render(
          json: {
            errors: [google_places_error("unknown error on backend querying google", e)]
          }, status: :bad_request
        )
      rescue GooglePlaces::NotFoundError => e
        render(
          json: {
            errors: [google_places_error("place not found on backend?", e)]
          }
        )
      rescue GooglePlaces::APIConnectionError => e
        render(
          json: {
            errors: [google_places_error("Some kind of lower level API break in google places gem", e)]
          }
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error("creation failed!", e)]
          }, status: :bad_request
        )
      end
    
      # PATCH/PUT /places/1
      # def update
      #   if @place.update(place_params)
      #     render json: @place
      #   else
      #     render json: @place.errors, status: :unprocessable_entity
      #   end
      # end
    
      # DELETE /places/1
      # def destroy
      #   @place.destroy
      # end
    
      private
        # # Use callbacks to share common setup or constraints between actions.
        # def set_place
        #   @place = Place.find(params[:id])
        # end
    
        # Only allow a list of trusted parameters through.
        def place_params
          params.require(:place).permit(:google_place_id, :last_fetched)
        end

        def setup_places_client
          options = {
            fields: 'geometry'
          }
            @place_client ||= GooglePlaces::Client.new(Rails.application.credentials.maps![:places_backend_api_key], options)
        end
  
      end
  end
end

