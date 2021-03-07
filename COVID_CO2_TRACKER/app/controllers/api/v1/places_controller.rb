
module Api
  module V1
    class PlacesController < ApplicationController
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
        @place = Place.create!(google_place_id: place_params[:google_place_id])
        render(
          json: {
            place_id: @place.id
          }, status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error("creation failed!", e)]
          }
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
    end
  end
end

