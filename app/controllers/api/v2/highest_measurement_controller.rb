# frozen_string_literal: true

COUNT = 50
class Api::V2::HighestMeasurementController < ApplicationController
  def index
    @ten_measurements = fetch_top_measurements
    @ten_sublocations = fetch_top_sublocations
    @ten_places = fetch_top_places

    render(
      json: {
        ten_places: PlaceAndGooglePlaceIdBlueprint.render_as_json(@ten_places),
        ten_sublocations: SublocationBlueprint.render_as_json(@ten_sublocations),
        ten_measurements: BasicMeasurementBlueprint.render_as_json(@ten_measurements)
      }
    )
  end

  private

  def fetch_top_measurements
    Measurement.order(co2ppm: :desc)
               .select(:id, :device_id, :co2ppm, :measurementtime, :sub_location_id)
               .first(COUNT)
  end

  def fetch_top_sublocations
    sublocation_ids = fetch_sublocation_ids_by_max_co2
    return SubLocation.none if sublocation_ids.empty?

    order_clause = build_order_clause(sublocation_ids)
    SubLocation.where(id: sublocation_ids)
               .select(:id, :description, :place_id)
               .order(Arel.sql("CASE id #{order_clause} END"))
  end

  def fetch_top_places
    place_ids = fetch_place_ids_by_max_co2
    return Place.none if place_ids.empty?

    order_clause = build_order_clause(place_ids)
    Place.where(id: place_ids)
         .select(:id, :google_place_id)
         .order(Arel.sql("CASE id #{order_clause} END"))
  end

  def fetch_sublocation_ids_by_max_co2
    Measurement.joins(:sub_location)
               .group('sub_locations.id')
               .order('MAX(measurements.co2ppm) DESC')
               .limit(COUNT)
               .pluck('sub_locations.id')
  end

  def fetch_place_ids_by_max_co2
    Measurement.joins(sub_location: :place)
               .group('places.id')
               .order('MAX(measurements.co2ppm) DESC')
               .limit(COUNT)
               .pluck('places.id')
  end

  def build_order_clause(ids)
    ids.map.with_index { |id, index| "WHEN #{id} THEN #{index}" }.join(' ')
  end
end
