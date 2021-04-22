# frozen_string_literal: true

module Api
  module V1
    class ModelController < ApiController
      skip_before_action :authorized, only: [:show, :measurements]
      def create
        @new_model = ::Model.create!(name: model_params.fetch(:name), manufacturer_id: model_params.fetch(:manufacturer_id))
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

      def measurements
        @model = ::Model.find(params.fetch(:id))
        render(
          json: {
            measurements: MeasurementSerializer.new(@model.measurement).serializable_hash
          }, status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('model not found!', e)]
          },
          status: :not_found
        )
      end

      def show
        @model = ::Model.find(params.fetch(:id))
        render(
          json: ::Model.show_as_json(@model),
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
