require_relative '../utils/errors.rb'


KEY_PATH = Rails.root.join('config', 'keys', 'private_key.key')

def encode_with_jwt(payload)
  key = IO.binread(KEY_PATH)
  if key.nil? || key.empty?
    raise StandardError
  end

  JWT.encode(payload, key)
end

def decode_with_jwt(payload)
  key = IO.binread(KEY_PATH)
  if key.nil? || key.empty?
    puts "Check your key file in #{KEY_PATH}"
    raise StandardError
  end
  JWT.decode(payload, key, true, algorithm: 'HS256')
end



class ApplicationController < ActionController::API
    include ::ActionController::Cookies
    include Errors

    before_action :authorized

    def encode_token(payload)
        encode_with_jwt(payload)
      end

    def authenticate_user
        jwt = cookies.signed[:jwt]
        byebug
        decode_jwt(jwt)
    end
    
    def user_id_from_jwt_token
        byebug
        user_id = authenticate_user[0]['user_id']
    end

    def current_user
        if user_id_from_jwt_token
          begin
            # byebug
            user_id = user_id_from_jwt_token
            @user = User.find(user_id)
            return @user
          rescue JWT::DecodeError => e
            render json: {
              errors: [create_jwt_error('something went wrong with parsing the JWT', e)]
            }
          rescue ActiveRecord::RecordNotFound => e
            render json: {
              errors: [create_activerecord_notfound_error('user_id not found while looking up from decoded_token!', e)]
            }
          end
        else
          render json: {
            errors: [create_missing_auth_header('hmmm, decoded_token is falsy')]
          }
        end
      end
    
      def logged_in?
        !!current_user
      end
    

    def authorized
        if !(logged_in?)
            error_array = [create_error('Please log in', :unauthorized.to_s)]
          render json: {
            errors: error_array
          }, status: :unauthorized
        end
      end
    
end
