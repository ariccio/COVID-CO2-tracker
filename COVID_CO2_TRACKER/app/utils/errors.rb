
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

  def create_error(message, error)
    # puts error.class
    anError = single_error(message, error)
    anError
  end
  
  def create_jwt_error(message, jwtError)
    errors = jwtError.message
    multiple_errors(message, errors)
  end
  
  def create_activerecord_error(message, activeRecordError)
    errors = activeRecordError.record.errors.full_messages;
    # puts "errors: #{errors}"
    multiple_errors(message, errors)
  end
  
  def create_activerecord_notfound_error(message, activeRecordError)
    errors = [activeRecordError.id, activeRecordError.model];
    # puts "errors: #{errors}"
    multiple_errors(message, errors)
  end
  
  def create_missing_auth_header(message)
    errors = []
    multiple_errors(message, errors)
  end

end