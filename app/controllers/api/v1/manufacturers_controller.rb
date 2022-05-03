# frozen_string_literal: true

# Ok, I need to write the serializers!
def first_ten(id)
  models = ::Model.where(manufacturer_id: id).first(10)
  # byebug
  # Device.where(model_id: model.id)
  # TODO: write a damn serializer
  models.each.map do |model|
    {
      model_id: model.id,
      manufacturer_id: model.manufacturer.id,
      name: model.name,
      count: ::Device.where(model_id: model.id).count
      # model.count instances
      # total number of measurements?
    }
  end
end

module Api
  module V1
    class ManufacturersController < ApiController
      skip_before_action :authorized, only: [:show, :all_manufacturers]
      def create
        # byebug
        @new_manufacturer = ::Manufacturer.create!(name: manufacturer_params.fetch(:name))
        render(
          json: {
            manufacturer_id: @new_manufacturer.id,
            name: @new_manufacturer.name
          },
          status: :created
        )
      rescue ::ActiveRecord::RecordInvalid => e
        render(
          json: {
            errors: [create_activerecord_error('manufacturer creation failed!', e)]
          },
          status: :bad_request
        )
      rescue ::ActionController::ParameterMissing => e
        Sentry.capture_exception(e)
        raise
      end

      def show
        @manufacturer = ::Manufacturer.find(params.fetch(:id))
        render(
          json: {
            manufacturer_id: @manufacturer.id,
            name: @manufacturer.name,
            models: first_ten(@manufacturer.id)
          },
          status: :ok
        )
      rescue ::ActiveRecord::RecordNotFound => e
        render(
          json: {
            errors: [create_activerecord_error('manufacturer not found!', e)]
          },
          status: :not_found
        )
      end

      def all_manufacturers
        render(
          json: {
            manufacturers: ::Manufacturer.all.order(:name).as_json(only: [:name, :id])
          },
          status: :ok
        )
      end

      def manufacturer_params
        params.require(:manufacturer).permit(:name, :id)
      end
    end
  end
end
