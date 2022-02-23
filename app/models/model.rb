# frozen_string_literal: true

class Model < ApplicationRecord
  belongs_to :manufacturer
  has_many :device, dependent: :restrict_with_exception
  # https://guides.rubyonrails.org/association_basics.html#has-many-association-reference
  has_many :measurement, -> { distinct }, through: :device


  validates :name, presence: true

  # May need to be a distinct relation?

  def self.show_as_json(model)
    {
      model_id: model.id,
      name: model.name,
      manufacturer: model.manufacturer.id,
      count: ::Device.where(model_id: model.id).count,
      measurement_count: model.measurement.count,
      manufacturer_name: model.manufacturer.name
    }
  end
end
