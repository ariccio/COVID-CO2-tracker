# frozen_string_literal: true

class Device < ApplicationRecord
  belongs_to :model
  belongs_to :user
  has_many :measurements
end
