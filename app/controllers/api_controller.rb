# frozen_string_literal: true

# https://blog.heroku.com/a-rock-solid-modern-web-stack
# http://www.carlosramireziii.com/how-to-add-active-admin-to-a-rails-5-api-application.html

require_relative '../utils/errors'

KEY_PATH = ::Rails.root.join('config', 'keys', 'private_key.key')

def encode_with_jwt(payload)
  # Ugly hack for heroku, idc right now.
  key = ENV['PRIVATE_KEY_JWT'] || ::IO.binread(::KEY_PATH)
  if key.blank?
    ::Rails.logger.error("Check your key file in #{::KEY_PATH}")
    # Not meant to be handled in a way that renders to user. This is a true internal server error.
    raise(::StandardError)
  end

  ::JWT.encode(payload, key)
end

def decode_with_jwt(payload)
  # Ugly hack for heroku, idc right now.
  key = ENV['PRIVATE_KEY_JWT'] || ::IO.binread(::KEY_PATH)
  if key.blank?
    ::Rails.logger.error("Check your key file in #{::KEY_PATH}")
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

class ApiController < ::ActionController::API
  include ::ActionController::Cookies
  include ::Errors
  before_action :authorized
  def encode_token(payload)
    encode_with_jwt(payload)
  end

  def auth_header
    request.headers['Authorization']
  end

  def jwt_from_auth_header
    # NOTE TO SELF: You're actually supposed to use the 'bearer ' format!
    # It's in the spec!
    # See: https://security.stackexchange.com/a/120244
    # And: https://www.ietf.org/rfc/rfc2617.txt

    # ALSO note to self: can I use built in rails methods like: https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Token.html

    auth_header.split(' ')[1]
  end

  def authenticate_user
    # byebug
    return decode_with_jwt(jwt_from_auth_header) if auth_header

    return if (cookies.signed[:jwt].nil?)

    jwt = cookies.signed[:jwt]
    decode_with_jwt(jwt)
  end

  def user_id_from_jwt_token
    # byebug
    result = authenticate_user
    return if result.nil?

    result[0]['user_id']
  end

  def render_falsy_decoded_token
    ::Sentry.capture_message('decoded_token is falsy?')
    render(
      json: {
        errors: [create_missing_auth_header('hmmm, decoded_token is falsy')]
      },
      status: :internal_server_error
    )
  end

  def render_jwt_error(exception)
    ::Sentry.capture_exception(exception)
    render(
      json: {
        errors: [create_jwt_error('something went wrong with parsing the JWT', exception)]
      },
      status: :bad_request
    )
  end

  def render_activerecord_notfound_error(exception)
    ::Sentry.capture_exception(exception)
    render(
      json: {
        errors: [create_activerecord_notfound_error('user_id not found while looking up from decoded_token!', exception)]
      },
      status: :not_found
    )
  end

  def render_empty
    render(
      json: {},
      status: :ok
    )
  end

  def cookie?
    return false if user_id_from_jwt_token.nil?

    true
  end

  # Might help for faster lookups in ActiveRecord
  def current_user_id
    return unless cookie? || auth_header

    @id_from_token = user_id_from_jwt_token

    render_falsy_decoded_token unless @id_from_token

    # byebug
    @id_from_token
  end

  def current_user
    # https://docs.sentry.io/platforms/ruby/guides/rails/enriching-events/identify-user/
    @user = ::User.find(current_user_id)
    Sentry.set_user(id: @user&.id, email: @user&.email)
    @user
  rescue ::ActiveRecord::RecordNotFound => _e
    # TODO: is this the most specific error?
    # NOPd out because else we have double render

    # No need to log this, else we're just logging any time someone is browsing the site when not logged in.
    # Rails.logger.warn('user not found!')
    # render_activerecord_notfound_error(_e)
    nil
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
  rescue ::JWT::DecodeError => e
    ::Sentry.capture_exception(e)
    # Rails.logger.warn('jwt invalid!')
    render_jwt_error(e)
    nil
  end
end
