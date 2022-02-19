class Api::V1::RealtimeMeasurementController < Api::V1::MeasurementController

    def create
        new_measurement = create_measurement_internal
        extra_info = new_measurement.build_extra_measurement_info(realtime: measurement_params.fetch(:realtime))
        byebug
        new_measurement.save!
        extra_info.save!
        render_empty
    end
end
