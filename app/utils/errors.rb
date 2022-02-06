# frozen_string_literal: true

module Errors
  def single_error(message, error)
    {
      message: [message],
      error: [error]
    }
  end

  def multiple_errors(message, errors)
    {
      message: [message],
      error: errors
    }
  end

  def google_places_error(message, errors)
    single_error(message, errors)
  end

  def create_error(message, error)
    # puts error.class
    single_error(message, error)
  end

  def create_jwt_error(message, jwt_error)
    errors = jwt_error.message
    multiple_errors(message, errors)
  end

  def create_activerecord_error(message, active_record_error)
    errors = active_record_error.record.errors.full_messages
    # byebug
    # puts "errors: #{errors}"
    multiple_errors(message, errors)
  end

  def create_activerecord_notfound_error(message, active_record_error)
    errors = [active_record_error.id, active_record_error.model]
    # puts "errors: #{errors}"
    multiple_errors(message, errors)
  end

  def create_not_logged_in_error(message)
    # errors = []
    single_error(message, nil)
  end

  def create_missing_auth_header(message)
    errors = []
    multiple_errors(message, errors)
  end

  def create_place_differs_sublocation_place(place, sublocation)
    errorStr = "Bug? Trying to create user settings with sublocation (#{sublocation.id}, #{sublocation.place.id}) in a different place #{place.id}? This has been reported automatically."
    single_error(errorStr, nil)
  end
end
