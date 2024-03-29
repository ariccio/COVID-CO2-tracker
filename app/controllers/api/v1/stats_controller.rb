# frozen_string_literal: true

module Api
  module V1
    class StatsController < ApplicationController
      def show
        # byebug
        render(
          json: {
            users: ::User.count,
            measurements: ::Measurement.count,
            devices: ::Device.count,
            manufacturers: ::Manufacturer.count,
            models: ::Model.count,
            places: ::Place.count,
            sublocations: ::SubLocation.count
          }
        )
      end
    end
  end
end
