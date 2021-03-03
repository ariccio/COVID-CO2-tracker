# frozen_string_literal: true

class Model < ApplicationRecord
  belongs_to :manufacturer
  has_many :device
  # https://guides.rubyonrails.org/association_basics.html#has-many-association-reference
  has_many :measurement, -> { distinct }, through: :device

  # May need to be a distinct relation?
end
