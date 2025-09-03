# frozen_string_literal: true

class Api::BaseController < ActionController::API
  # API controllers don't need CSRF protection
  # They inherit from ActionController::API which doesn't include cookies/sessions
end