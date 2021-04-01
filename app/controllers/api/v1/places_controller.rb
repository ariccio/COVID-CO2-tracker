# frozen_string_literal: true

module Api
  module V1
    class PlacesController < ApiController
      include ::GooglePlaces
      skip_before_action :authorized, only: [:show, :place_by_google_place_id_exists, :show_by_google_place_id, :in_bounds, :near]

      before_action :setup_places_client
      # after_action :refresh_latlng_from_google, only: [:place_by_google_place_id_exists, :show_by_google_place_id]
      # before_action :set_place, only: [:show, :update, :destroy]
      # Don't want much of the scaffolding generated stuff

      # # GET /places
      # def index
      #   @places = Place.all

      #   render json: @places
      # end

      def refresh_latlng_from_google
        # byebug
        return if @place.nil?

        return unless @place.place_needs_refresh?

        ::Rails.logger.debug("\r\n\tUpdating #{@place.google_place_id}...\r\n")
        # byebug
        @spot = get_spot(@place.google_place_id)
        @place.place_lat = @spot.lat
        @place.place_lng = @spot.lng
        # byebug
        @place.save!
      end

      # GET /places/1
      def show
        @place = ::Place.find(params.fetch(:id))
        refresh_latlng_from_google
        ::Rails.logger.warn("Last fetched #{time_ago_in_words(@place.last_fetch)} - Need to update to comply with google caching restrictions!") if @place.last_fetched < 30.days.ago
        render(json: @place)
      rescue ::ActiveRecord::RecordNotFound => e
        # TODO: query from the backend too to validate input is correct
        render(
          json: {
            errors: create_activerecord_notfound_error('Not found!', e)
          }, status: :not_found
        )
      end

      def place_by_google_place_id_exists
        @place = ::Place.find_by!(google_place_id: params.fetch(:google_place_id))
        refresh_latlng_from_google
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
        @place = ::Place.includes(:sub_location).find_by!(google_place_id: params.fetch(:google_place_id))
        refresh_latlng_from_google

        # TODO: place_measurementtime_desc discards the fetched info
        measurements = @place.place_measurementtime_desc
        render(
          json: {
            created: false,
            measurements_by_sublocation: measurements,
            # place_id: @place.id
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        error_array = [create_error("#{params.fetch(:google_place_id)} does not exist in database. Not necessarily an error!", :not_acceptable.to_s)]
        error_array << create_activerecord_notfound_error('not found', e)
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

      def get_spot(place_id)
        options = {
          fields: 'geometry'
        }
        @setup_places_client.spot(place_id, options)
      # From: C:\Ruby30-x64\lib\ruby\gems\3.0.0\gems\google_places-2.0.0\lib\google_places\request.rb
      rescue ::GooglePlaces::OverQueryLimitError => e
        render(
          json: {
            errors: [google_places_error('Too many queries for backend API!', e)]
          }, status: :bad_request
        )
      rescue ::GooglePlaces::RequestDeniedError => e
        render(
          json: {
            errors: [google_places_error('backend request denied', e)]
          }, status: :bad_request
        )
      rescue ::GooglePlaces::InvalidRequestError => e
        render(
          json: {
            errors: [google_places_error('backend invalid request to google places', e)]
          }, status: :bad_request
        )
      rescue ::GooglePlaces::UnknownError => e
        render(
          json: {
            errors: [google_places_error('unknown error on backend querying google', e)]
          }, status: :bad_request
        )
      rescue ::GooglePlaces::NotFoundError => e
        render(
          json: {
            errors: [google_places_error('place not found on backend?', e)]
          }
        )
      rescue ::GooglePlaces::APIConnectionError => e
        render(
          json: {
            errors: [google_places_error('Some kind of lower level API break in google places gem', e)]
          }
        )
      end

      # POST /places
      def create
        # byebug
        # byebug
        # @spot.lat, @spot.lng
        @spot = get_spot(place_params.fetch(:google_place_id))

        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/2
        @place = ::Place.create!(google_place_id: place_params.fetch(:google_place_id), place_lat: @spot.lat, place_lng: @spot.lng, last_fetched: ::Time.current)
        render(
          json: {
            place_id: @place.id
          }, status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('creation failed!', e)]
          }, status: :bad_request
        )
      end

      def near
        found = ::Place.within(
          1, units: :miles,
             origin: # no idea what rubocop wants here?
            [
              place_params.fetch(:lat),
              place_params.fetch(:lng)
            ]
        )
        places_as_json =
          found.each.map do |place|
            ::Place.as_json_for_markers(place)
          end
        # byebug
        render(
          json: {
            places: places_as_json
          }, status: :ok
        )
      end

      def in_bounds
        @sw = ::Geokit::LatLng.new(place_bounds_params.fetch(:south), place_bounds_params.fetch(:west))
        @ne = ::Geokit::LatLng.new(place_bounds_params.fetch(:north), place_bounds_params.fetch(:east))
        found = ::Place.in_bounds([@sw, @ne])
        places_as_json =
          found.each.map do |place|
            ::Place.as_json_for_markers(place)
          end
        # byebug
        render(
          json: {
            places: places_as_json
          }, status: :ok
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
        params.require(:place).permit(:google_place_id, :last_fetched, :lat, :lng)
      end

      def place_bounds_params
        params.require(:place).permit(:east, :north, :west, :south)
      end

      def setup_places_client
        options = {
          fields: 'geometry'
        }
        @setup_places_client ||= ::GooglePlaces::Client.new(::Rails.application.credentials.maps![:places_backend_api_key], options)
      end
    end
  end
end
