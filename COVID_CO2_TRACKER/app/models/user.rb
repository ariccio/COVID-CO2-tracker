# frozen_string_literal: true

class User < ApplicationRecord
  # has_secure_password
  # app/models/user.rb:6:3: C: Rails/HasManyOrHasOneDependent: Specify a :dependent option.
  has_many :devices, dependent: :restrict_with_exception
  has_many :measurement, -> { distinct }, through: :devices
  # app/models/user.rb:7:3: C: Rails/UniqueValidationWithoutIndex: Uniqueness validation should be with a unique index.
  validates :email, presence: true, uniqueness: true
  # validates :password_digest, presence: true
  validates :name, presence: true
  validates :sub_google_uid, presence: true, uniqueness: true, length: {minimum: 1}
  def my_devices
    user_devices = devices
    user_devices.each.map do |device|
      {
        device_id: device.id,
        serial: device.serial,
        device_model_id: device.model.id,
        device_model: device.model.name,
        device_manufacturer: device.model.manufacturer.name,
        device_manufacturer_id: device.model.manufacturer_id
      }
    end
  end

  def my_measurements
    # @user = current_user
    measurements = []
    devices.each.map do |device|
      # byebug
      @mine = device.measurement.order('measurementtime DESC')

      # NOTE: this can be a very slow query TODO: faster
      result = ::Measurement.measurements_as_json(@mine)
      # byebug
      measurements << result.flatten
    end
    # byebug
    measurements.flatten
  end
end
