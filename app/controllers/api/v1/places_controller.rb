# frozen_string_literal: true

module Api
  module V1
    class PlacesController < ApiController
      include ::GooglePlaces
      skip_before_action :authorized, only: [:show, :place_by_google_place_id_exists, :show_by_google_place_id, :in_bounds]

      before_action :setup_places_client
      # after_action :refresh_latlng_from_google, only: [:place_by_google_place_id_exists, :show_by_google_place_id]
      # before_action :set_place, only: [:show, :update, :destroy]
      # Don't want much of the scaffolding generated stuff

      def index
        @places = Place.all.select(:google_place_id)
        pms = ::GooglePlaceIdSerializer.new(@places).serializable_hash
        render(
          json: {
            places: pms[:data]
          }, status: :ok
        )
      end

      def refresh_latlng_from_google
        # byebug
        return false if @place.nil?

        return false unless @place.place_needs_refresh?

        ::Rails.logger.debug("\r\n\tUpdating #{@place.google_place_id}...\r\n")
        # byebug
        @spot = get_spot(@place.google_place_id)
        return nil if @spot.nil?

        @place.place_lat = @spot.lat
        @place.place_lng = @spot.lng
        @place.last_fetched = ::Time.current
        @place.save!
        # byebug
      end

      # GET /places/1
      def show
        @place = ::Place.find(params.fetch(:id))
        refreshed = refresh_latlng_from_google
        if @place.last_fetched < 30.days.ago
          ::Rails.logger.warn("Last fetched #{time_ago_in_words(@place.last_fetch)} - Need to update to comply with google caching restrictions!")
          ::Sentry.capture_message("Last fetched #{time_ago_in_words(@place.last_fetch)} - Need to update to comply with google caching restrictions!")
        end
        return if refreshed.nil?

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
        # refresh_latlng_from_google
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
        @place = ::Place.find_by!(google_place_id: params.fetch(:google_place_id))
        refreshed = refresh_latlng_from_google
        return if refreshed.nil?

        # if Rails.env.development?
        #   # serial = ::PlaceSerializer.new(@place)
        #   # Much faster than current method!
        #   meas = ::MeasurementSerializer.new(@place.measurement)
        #   # pp meas
        #   byebug
        # end

        # TODO: place_measurementtime_desc discards the fetched info
        # TODO: use an ACTUAL place serializer, serializing sublocations and measurements
        measurements = @place.place_measurementtime_desc
        render(
          json: {
            created: false,
            measurements_by_sublocation: measurements
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
        # Note: basic data (geometry) is free!
        # https://developers.google.com/maps/documentation/places/web-service/usage-and-billing?hl=en_US#basic-data
        options = {
          fields: 'geometry'
        }
        @setup_places_client.spot(place_id, options)
      # From: C:\Ruby30-x64\lib\ruby\gems\3.0.0\gems\google_places-2.0.0\lib\google_places\request.rb
      rescue ::GooglePlaces::OverQueryLimitError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('Too many queries for backend API!', e)]
          }, status: :bad_request
        )
        return nil
      rescue ::GooglePlaces::RequestDeniedError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('backend request denied', e)]
          }, status: :bad_request
        )
        return nil
      rescue ::GooglePlaces::InvalidRequestError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('backend invalid request to google places', e)]
          }, status: :bad_request
        )
        return nil
      rescue ::GooglePlaces::UnknownError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('unknown error on backend querying google', e)]
          }, status: :bad_request
        )
        return nil
      rescue ::GooglePlaces::NotFoundError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('place not found on backend?', e)]
          }, status: :bad_request
        )
        return nil
      rescue ::GooglePlaces::APIConnectionError => e
        Sentry.capture_exception(e)
        render(
          json: {
            errors: [google_places_error('Some kind of lower level API break in google places gem', e)]
          }, status: :internal_server_error
        )
        return nil
      rescue SocketError => e
        if Rails.env.production?
          Sentry.capture_exception(e)
        end
        render(
          json: {
            errors: [multiple_errors('Backend server could not connect to GooglePlace API - network error between the backend and Places API', e)]
          }, status: :internal_server_error
        )
        return nil


      end

      # POST /places
      def create
        # byebug
        # byebug
        # @spot.lat, @spot.lng
        @spot = get_spot(place_params.fetch(:google_place_id))
        # https://discuss.rubyonrails.org/t/time-now-vs-time-current-vs-datetime-now/75183/2

        return nil if @spot.nil?

        # TODO: Perhaps I should do a find_or_create because of the possibility that two people try to create a place at the same time? Will need to be debounced to prevent dual measurement creation.
        @place = ::Place.create!(google_place_id: place_params.fetch(:google_place_id), place_lat: @spot.lat, place_lng: @spot.lng, last_fetched: ::Time.current)
        render(
          json: {
            place_id: @place.id
          }, status: :created
        )
      rescue ::ActiveRecord::RecordNotUnique => e
        # TODO: perhaps I should simply ignore this in the future, if I debounce the measurement creation this may be harmless?
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_error('place already created! Did you click twice?', e)]
          }, status: :bad_request
        )
      rescue ::ActiveRecord::RecordInvalid => e
        ::Sentry.capture_exception(e)
        render(
          json: {
            errors: [create_activerecord_error('creation failed!', e)]
          }, status: :bad_request
        )
      end

      def in_bounds
        #TODO: Rewrite this API as a GET not a POST. Way overdue.
        @sw = ::Geokit::LatLng.new(params[:south], params[:west])
        @ne = ::Geokit::LatLng.new(params[:north], params[:east])

        # (byebug) pp ::Place.in_bounds([@sw, @ne]).to_sql
        # nil
        # (byebug) "SELECT \"places\".* FROM \"places\" WHERE places.place_lat > 40.75877119144174 AND places.place_lat < 40.77716753537969 AND places.place_lng > -73.97284707946775 AND places.place_lng < -73.94555292053221"

        # Can I do this in RAW SQL with PG? https://josh.mn/2020/05/01/serializing-one-million-records/
        found = ::Place.in_bounds([@sw, @ne]).select(:id, :google_place_id, :place_lat, :place_lng)
        pms = ::PlaceMarkerSerializer.new(found).serializable_hash
        render(
          json: {
            places: pms[:data]
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

      # Only allow a list of trusted parameters through.
      def place_params
        params.require(:place).permit(:google_place_id, :last_fetched, :lat, :lng)
      end

      def place_bounds_params
        params.permit(:east, :north, :west, :south, :place, ':place')
      end

      def setup_places_client
        # Note: basic data (geometry) is free!
        # https://developers.google.com/maps/documentation/places/web-service/usage-and-billing?hl=en_US#basic-data
        options = {
          fields: 'geometry'
        }
        @setup_places_client ||= ::GooglePlaces::Client.new(::Rails.application.credentials.maps![:places_backend_api_key], options)
      end
    end
  end
end
