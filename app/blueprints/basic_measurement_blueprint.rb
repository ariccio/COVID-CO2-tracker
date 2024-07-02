# frozen_string_literal: true
class BasicMeasurementBlueprint < Blueprinter::Base
  identifier(:id)
  fields(:device_id, :co2ppm, :measurementtime, :sub_location_id)

end
