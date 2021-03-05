
module Api
  module V1
    class PlacesController < ApplicationController
      before_action :set_place, only: [:show, :update, :destroy]
      # Don't want much of the scaffolding generated stuff

      # # GET /places
      # def index
      #   @places = Place.all
    
      #   render json: @places
      # end
    
      # GET /places/1
      def show
        render json: @place
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
        # Use callbacks to share common setup or constraints between actions.
        def set_place
          @place = Place.find(params[:id])
        end
    
        # Only allow a list of trusted parameters through.
        def place_params
          params.require(:place).permit(:google_place_id, :last_fetched)
        end
    end
  end
end

