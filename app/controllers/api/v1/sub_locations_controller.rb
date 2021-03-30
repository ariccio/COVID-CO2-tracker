module Api
  module V1
    class SubLocationsController < ApplicationController
      before_action :set_sub_location, only: [:show, :update, :destroy]

      # GET /sub_locations/1
      def show
        render json: @sub_location
      end

      # POST /sub_locations
      def create
        @sub_location = SubLocation.new(sub_location_params)

        if @sub_location.save
          render json: @sub_location, status: :created, location: @sub_location
        else
          render json: @sub_location.errors, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /sub_locations/1
      def update
        if @sub_location.update(sub_location_params)
          render json: @sub_location
        else
          render json: @sub_location.errors, status: :unprocessable_entity
        end
      end

      # DELETE /sub_locations/1
      def destroy
        @sub_location.destroy
      end

      private

      # Use callbacks to share common setup or constraints between actions.
      def set_sub_location
        @sub_location = SubLocation.find(params[:id])
      end

      # Only allow a list of trusted parameters through.
      def sub_location_params
        params.require(:sub_location).permit(:description, :place_id)
      end
    end
  end
end
