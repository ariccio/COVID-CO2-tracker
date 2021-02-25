def first_ten(id)
    models = ::Model.where(manufacturer_id: id).first(10)
    models.each.map do |model|
        {
            model_id: model.id,
            manufacturer_id: model.manufacturer.id,
            name: model.name
            # total number of measurements?
        }
    end
end

module Api
    module V1
        class ManufacturersController < ApplicationController
            skip_before_action :authorized, only: [:show]

            def create
                # byebug
                @new_manufacturer = ::Manufacturer.create!(name: manufacturer_params[:name])
                render( json: {
                    manufacturer_id: @new_manufacturer.id,
                    name: @new_manufacturer.name
                }, status: :created)
            rescue ::ActiveRecord::RecordInvalid => e
                render( json: {
                    errors: [create_activerecord_error('manufacturer creation failed!', e)]
                }, status: :bad_request)
            end

            def show
                @manufacturer = ::Manufacturer.find(manufacturer_params[:id])
                render( json: {
                    manufacturer_id: @manufacturer.id,
                    name: @manufacturer.name,
                    models: first_ten(@manufacturer.id)
                }, status: :ok)
            rescue ::ActiveRecord::RecordNotFound => e
                render( json: {
                    errors: [create_activerecord_error('manufacturer not found!', e)]
                }, status: :not_found)
            end

            def all_manufacturers
                render( json: {
                    manufacturers: ::Manufacturer.all.as_json(only: [:name, :id])
                }, status: :ok)
            end

            def manufacturer_params
                params.require(:manufacturer).permit(:name, :id)
            end
        end

    end
end
