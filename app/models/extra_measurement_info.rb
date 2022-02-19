class ExtraMeasurementInfo < ApplicationRecord
  belongs_to :measurement, optional: true, inverse_of: :extra_measurement_info
end
