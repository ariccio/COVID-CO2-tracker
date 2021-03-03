# frozen_string_literal: true

module Api
  module V1
    class ModelController < ApplicationController
      def create
        @new_model = ::Model.create!(name: model_params[:name], manufacturer_id: model_params[:manufacturer_id])
        render(
          json: {
            model_id: @new_model.id,
            manufacturer_id: @new_model.manufacturer,
            name: @new_model.name
          },
          status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('device model creation failed!', e)]
          },
          status: :bad_request
        )
      end

      def show
        # byebug
        # TODO: write a damn serializer
        @model = ::Model.find(params[:id])
        render(
          json: {
            model_id: @model.id,
            name: @model.name,
            manufacturer: @model.manufacturer.id,
            count: ::Device.where(model_id: @model.id).count,
            measurement_count: @model.measurement.count,
            manufacturer_name: @model.manufacturer.name
          },
          status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('model not found!', e)]
          },
          status: :not_found
        )
      end

      def model_params
        # byebug
        params.require(:model).permit(:id, :name, :manufacturer_id)
      end
    end
  end
end
