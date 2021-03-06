
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

      def show_by_google_place_id
        # byebug
        @place = Place.find_by!(google_place_id: params[:google_place_id])
        measurements = @place.measurement.order('measurementtime DESC').each.map do |measurement|
          measurement_with_device_place_as_json(measurement, measurement.device)
        end
        render(
          json: {
            created: false,
            measurements: measurements
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        # TODO: query from the backend too to validate input is correct
        # byebug
        @place = Place.create!(google_place_id: params[:google_place_id])
        render(
          json: {
            created: true,
            measurements: @place.measurement
          }, status: :ok
        )
      end
    
      # POST /places
      # def create
      #   @place = Place.new(place_params)
    
      #   if @place.save
      #     render json: @place, status: :created, location: @place
      #   else
      #     render json: @place.errors, status: :unprocessable_entity
      #   end
      # end
    
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

