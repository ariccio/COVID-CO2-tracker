# frozen_string_literal: true

class Device < ApplicationRecord
  # TODO: add normalizer https://edgeguides.rubyonrails.org/7_1_release_notes.html#add-activerecord-base-normalizes
  belongs_to :model
  belongs_to :user
  # app/models/device.rb:7:3: C: Rails/HasManyOrHasOneDependent: Specify a :dependent option.
  has_many :measurement, dependent: :restrict_with_exception

  # TODO: should this be enforced in the database too?
  validates :serial, presence: true
  validates :model_id, presence: true
  validates :user_id, presence: true

  # This doesn't work correctly. It fails if the device shares a serial number with a device of a different model/manufacturer
  # TODO: write a validator that checks if the serial is unique *for the device model*
  # validates :user_id, uniqueness: { scope: :serial, message: 'each device can only belong to single user!' }

  def first_ten_measurements
    # measurements = measurement.first(10)
    # measurements = ::Measurement.where(device_id: device_id).first(10).include(:device, :sub_location)
    # NOTE: this can be a very slow query TODO: faster
    # measurements.each.map do |measurement|
    #   ::Measurement.measurement_with_device_as_json(measurement)
    # end
    ::MeasurementSerializer.new(measurement).serializable_hash
  end
end
