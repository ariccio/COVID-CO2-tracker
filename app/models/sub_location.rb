class SubLocation < ApplicationRecord
  belongs_to :place
  has_many :measurement, dependent: :restrict_with_exception
  validates :description, presence: true

  def as_measurementtime_desc
    measurement.order('measurementtime DESC').each.map do |measurement|
      ::Measurement.measurement_with_device_place_as_json(measurement)
    end
    # byebug
  end
end
