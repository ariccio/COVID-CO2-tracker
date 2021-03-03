# frozen_string_literal: true

require_relative '../utils/errors'

KEY_PATH = ::Rails.root.join('config', 'keys', 'private_key.key')

def encode_with_jwt(payload)
  key = ::IO.binread(::KEY_PATH)
  if key.blank?
    ::Rails.logging.error("Check your key file in #{::KEY_PATH}")
    # Not meant to be handled in a way that renders to user. This is a true internal server error.
    raise(::StandardError)
  end

  ::JWT.encode(payload, key)
end

def decode_with_jwt(payload)
  key = ::IO.binread(::KEY_PATH)
  if key.blank?
    ::Rails.logging.error("Check your key file in #{::KEY_PATH}")
    # Not meant to be handled in a way that renders to user. This is a true internal server error.
    raise(::StandardError)
  end
  ::JWT.decode(payload, key, true, algorithm: 'HS256')
end

class NoJWTCookieError < ::StandardError
  def message
    'this is the simplest way to do this control flow methinks'
  end
end

class ApplicationController < ::ActionController::API
  include ::ActionController::Cookies
  include ::Errors
  before_action :authorized
  def encode_token(payload)
    encode_with_jwt(payload)
  end

  def authenticate_user
    # byebug
    if (cookies.signed[:jwt].nil?)
      return nil
    end
    jwt = cookies.signed[:jwt]
    decode_with_jwt(jwt)
  end

  def user_id_from_jwt_token
    # byebug
    result = authenticate_user
    if (result.nil?)
      return nil
    end
    result[0]['user_id']
  end

  def render_falsy_decoded_token
    render(
      json: {
        errors: [create_missing_auth_header('hmmm, decoded_token is falsy')]
      },
      status: :internal_server_error
    )
  end

  def render_jwt_error(exception)
    render(
      json: {
        errors: [create_jwt_error('something went wrong with parsing the JWT', exception)]
      },
      status: :internal_server_error
    )
  end

  def render_activerecord_notfound_error(exception)
    render(
      json: {
        errors: [create_activerecord_notfound_error('user_id not found while looking up from decoded_token!', exception)]
      },
      status: :not_found
    )
  end

  def cookie?
    return false if user_id_from_jwt_token.nil?
    true
  end

  def current_user
    # byebug
    if (!cookie?)
      return nil
    end
    @id_from_token = user_id_from_jwt_token

    if (!@id_from_token)
      render_falsy_decoded_token
    end
    # byebug
    user_id = @id_from_token
    # byebug
    @user = ::User.find(user_id)
    @user
  rescue ::JWT::DecodeError => _e
    render_jwt_error
  rescue ::ActiveRecord::RecordNotFound => _e
    # TODO: is this the most specific error?
    render_activerecord_notfound_error
  end

  def logged_in?
    !!current_user
  end

  def please_log_in
    error_array = [create_error('Please log in', :unauthorized.to_s)]
    render(
      json: {
        errors: error_array
      },
      status: :unauthorized
    )
  end

  def authorized
    return if logged_in?
    please_log_in
  rescue ::NoJWTCookieError => _e
    please_log_in
  end
end
