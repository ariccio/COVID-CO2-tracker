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

  def activemodel_recordinvalid_record_error(active_record_error)
    {
      active_model_error_info: {
        attribute: active_record_error.record.errors.errors[0].attribute
      }
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

  def create_activerecord_recordinvalid_error(message, active_record_error)
    # (byebug) pp e.record.errors.errors
    # [#<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>,
    #  #<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>,
    #  #<ActiveModel::Error attribute=crowding, type=blank, options={}>,
    #  #<ActiveModel::Error attribute=device, type=invalid, options={:value=>#<Device id: 10, serial: "2123", model_id: 7, user_id: 3, created_at: "2021-03-21 05:27:16.309051000 +0000", updated_at: "2021-03-21 05:27:16.309051000 +0000">}>,
    #  #<ActiveModel::Error attribute=sub_location, type=invalid, options={:value=>#<SubLocation id: 57, description: "farts", place_id: 52, created_at: "2021-08-06 19:43:17.617688000 +0000", updated_at: "2021-08-06 19:43:17.617688000 +0000">}>]

    # ----

    # (byebug) pp e.record.errors.errors[0]
    # #<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>
    # #<ActiveModel::Error attribute=crowding, type=not_a_number, options={:value=>""}>
    # (byebug) pp e.record.errors.errors[0].attribute
    # :crowding
    # :crowding
    errors = active_record_error.record.errors.full_messages
    # byebug
    # puts "errors: #{errors}"
    return {
      **multiple_errors(message, errors),
      other_information: {
        **activemodel_recordinvalid_record_error(active_record_error)
      }
    }
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
