# frozen_string_literal: true

class Manufacturer < ApplicationRecord
  has_many :device_models
end
