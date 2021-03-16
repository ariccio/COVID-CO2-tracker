# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authorized, only: [:create, :email]

      def render_failed_authentication
        error_array = [create_error('authentication failed! Wrong password.', :not_acceptable.to_s)]
        render(
          json: {
            errors:
            error_array
          },
          status: :unauthorized # 401
        )
      end

      def render_successful_authentication
        # encode token comes from ApplicationController
        token = encode_token(user_id: @user.id)
        # for good advice on httponly: https://www.thegreatcodeadventure.com/jwt-storage-in-rails-the-right-way/
        cookies.signed[:jwt] = { value: token, httponly: true }
        render(
          json: {
            email: @user.email
          },
          status: :accepted # 202
        )
      end

      def render_activerecord_notfound_error_invalid_username_or_password(exception)
        error_array = [create_error('Invalid username or password!', :not_acceptable.to_s)]
        error_array << create_activerecord_notfound_error('Invalid username or password!', exception)
        render(
          json: {
            errors:
              error_array
          },
          status: :unauthorized # 401
        )
      end

      def render_not_logged_in
        render(
          json: {
            errors: [create_not_logged_in_error('user not logged in')]
          },
          status: :unauthorized # 401
        )
      end

      def render_jwt_decode_error(exception)
        render(
          json: {
            email: '',
            errors: [create_jwt_error('decoding error', exception)]
          },
          status: :bad_request # 400
        )
      end

      # Note to self: https://philna.sh/blog/2020/01/15/test-signed-cookies-in-rails/
      def create
        @user = ::User.find_by!(email: user_login_params[:email])
        # User#authenticate comes from BCrypt
        if @user.authenticate(user_login_params[:password])
          render_successful_authentication
        else
          render_failed_authentication
        end
      rescue ::ActiveRecord::RecordNotFound => e
        render_activerecord_notfound_error_invalid_username_or_password(e)
      end

      def email
        @user = current_user
        if (@user.nil?)
          render_not_logged_in
          return
        end
        render(
          json: {
            email: @user.email
          },
          status: :ok
        )
      rescue ::JWT::DecodeError => e
        render_jwt_decode_error(e)
      end

      def destroy
        cookies.delete(:jwt)
        render(
          json: {},
          status: :ok
        )
      end

      private

      def user_login_params
        # byebug
        # params { user: {username: 'Chandler Bing', password: 'hi' } }
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
