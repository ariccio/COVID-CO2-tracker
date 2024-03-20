COUNT = 50
class Api::V2::HighestMeasurementController < ApplicationController
  def index

    @ten_measurements = Measurement.order(co2ppm: :desc).select(:id, :device_id, :co2ppm, :measurementtime, :sub_location_id).first(COUNT)
    @ten_sublocations = SubLocation.joins(:measurement).order(co2ppm: :desc).select(:id, :description, :place_id).uniq.first(COUNT)
    @ten_places = Place.joins(sub_location: :measurement).order(co2ppm: :desc).select(:id, :google_place_id).uniq.first(COUNT)
    

    # ::MeasurementSerializer.new(@measurement).serializable_hash

    # byebug
    render(
      json: {
        ten_places: PlaceAndGooglePlaceIdBlueprint.render_as_json(@ten_places),
        ten_sublocations: SublocationBlueprint.render_as_json(@ten_sublocations),
        ten_measurements: BasicMeasurementBlueprint.render_as_json(@ten_measurements)
      }
    )
  end
end
