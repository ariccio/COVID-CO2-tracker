# frozen_string_literal: true

class Device < ApplicationRecord
  belongs_to :model
  belongs_to :user
  # app/models/device.rb:7:3: C: Rails/HasManyOrHasOneDependent: Specify a :dependent option.
  has_many :measurements
end
