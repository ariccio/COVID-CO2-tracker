module Api
    module V1
        class ModelController < ApplicationController

            def create
                @new_model = Model.create!(name: model_params[:name], manufacturer: model_params[:manufacturer_id])
                render json: {
                    model_id: @new_model.id,
                    manufacturer_id: @new_model.manufacturer,
                    name: @new_mode.name
                }, status: :created
            rescue ActiveRecord::RecordInvalid => e
                render json: {
                    errors: [create_activerecord_error("device model creation failed!", e)]
                }, status: :bad_request
            end

            def show
                @model = Model.find(model_params[:id])
                render json: {
                    model_id: @model.id,
                    name: @model.name,
                    manufacturer: @model.manufacturer.id
                    # total number of measurements?
                }, status: :ok
            rescue ActiveRecord::RecordNotFound => e
                render json: {
                    errors[create_activerecord_error("model not found!", e)]
                }, status: :not_found
            end

            def model_params
                params.require[:model].permit(:id, :name, :manufacturer_id)
            end
        end
    end
end