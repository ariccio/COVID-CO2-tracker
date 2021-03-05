# frozen_string_literal: true

class Measurement < ApplicationRecord
  belongs_to :device
  belongs_to :place
  # needs validation of positivity, fatal levels
end
