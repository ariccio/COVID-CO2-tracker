class ExtraMeasurementInfo < ApplicationRecord
  belongs_to :measurement, optional: true
end
