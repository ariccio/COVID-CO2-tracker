class Measurement < ApplicationRecord
  belongs_to :device
  # needs validation of positivity, fatal levels
end
