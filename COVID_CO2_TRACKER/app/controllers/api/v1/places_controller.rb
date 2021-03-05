class Api::V1::PlacesController < ApplicationController
  before_action :set_api_v1_place, only: [:show, :update, :destroy]

  # GET /api/v1/places
  def index
    @api_v1_places = Api::V1::Place.all

    render json: @api_v1_places
  end

  # GET /api/v1/places/1
  def show
    render json: @api_v1_place
  end

  # POST /api/v1/places
  def create
    @api_v1_place = Api::V1::Place.new(api_v1_place_params)

    if @api_v1_place.save
      render json: @api_v1_place, status: :created, location: @api_v1_place
    else
      render json: @api_v1_place.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/places/1
  def update
    if @api_v1_place.update(api_v1_place_params)
      render json: @api_v1_place
    else
      render json: @api_v1_place.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/places/1
  def destroy
    @api_v1_place.destroy
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_api_v1_place
      @api_v1_place = Api::V1::Place.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def api_v1_place_params
      params.require(:api_v1_place).permit(:google_place_id, :last_fetched)
    end
end
