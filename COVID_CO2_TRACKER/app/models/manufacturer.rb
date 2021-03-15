# frozen_string_literal: true

class Manufacturer < ApplicationRecord
  # app/models/manufacturer.rb:5:3: C: Rails/HasManyOrHasOneDependent: Specify a :dependent option.
  has_many :model
  has_many :device, through: :model

  validates :name, presence: true, uniqueness: true
  
end
