# frozen_string_literal: true

class User < ApplicationRecord
  # has_secure_password
  # app/models/user.rb:6:3: C: Rails/HasManyOrHasOneDependent: Specify a :dependent option.
  has_many :devices, dependent: :restrict_with_exception
  has_many :measurement, -> { distinct }, through: :devices
  has_one :user_setting

  # Note to self, from active record doctor:
  # add `NOT NULL` to users.email - models validates its presence but it's not non-NULL in the database
  # add `NOT NULL` to users.name - models validates its presence but it's not non-NULL in the database
  # add `NOT NULL` to users.sub_google_uid - models validates its presence but it's not non-NULL in the database


  # app/models/user.rb:7:3: C: Rails/UniqueValidationWithoutIndex: Uniqueness validation should be with a unique index.
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :sub_google_uid, presence: true, uniqueness: true, length: { minimum: 1 }



  def my_devices
    # byebug
    return [] if (devices.blank?)

    devices.includes(:model, model: :manufacturer).find_each.map do |device|
      # byebug
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
    # measurements = []
    # byebug
    return nil if (measurement.blank?)
    
    Rails.logger.warn("I really need to redo the extra measurement info/realtime info serialization... I will have to serialize separately, or do as a relationship instead of an attribute!")
    
    
    ordered = measurement.order('measurementtime DESC')

    # measurements = ordered.each.map do |measurement|
    #   ::Measurement.measurement_with_device_as_json(measurement)
    # end

    # byebug
    ::MeasurementSerializer.new(ordered).serializable_hash
    # ::MeasurementSerializer.new(ordered, include: [:extra_measurement_info]).serializable_hash
  end

  def last_measurement
    return nil if (measurement.blank?)
    
    measurement.order('measurementtime DESC').first
  end
end
