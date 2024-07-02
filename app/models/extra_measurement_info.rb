# frozen_string_literal: true
class ExtraMeasurementInfo < ApplicationRecord
  has_one :measurement, required: false, inverse_of: :extra_measurement_info
end
