module Api
  module V1

    class AuthController < ApplicationController
      skip_before_action :authorized, only: [:create]

      def create
        @user = User.find_by!(email: user_login_params[:email])
        # User#authenticate comes from BCrypt
        if @user.authenticate(user_login_params[:password])
          # encode token comes from ApplicationController
          token = issue_token(user_id: @user.id)
          # for good advice on httponly: https://www.thegreatcodeadventure.com/jwt-storage-in-rails-the-right-way/
          cookies.signed[:jwt] = {value: token, httponly: true}
          render json:
            {
              email: @user.email,
            },
            status: :accepted
        else
          error_array = [create_error('authentication failed!', :not_acceptable.to_s)]
          render json: {
            errors:
              error_array
          }, status: :unauthorized
        end
      rescue ActiveRecord::RecordNotFound => e
        error_array = [create_error('Invalid username or password!', :not_acceptable.to_s)]
        error_array << create_activerecord_notfound_error('Invalid username or password!', e)
        render json: {
          errors:
            error_array
        }, status: :unauthorized
      end
    
      def destroy
        cookies.delete(:jwt)
        render json: {

        }, status: :ok
      end
    
    
      private
    
      def user_login_params
        # params { user: {username: 'Chandler Bing', password: 'hi' } }
        params.require(:user).permit(:email, :password)
      end
    end

  end
end
