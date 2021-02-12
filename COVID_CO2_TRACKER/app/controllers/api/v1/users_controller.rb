module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :authorized, only: [:create]

      def create
        @user = User.create!(user_params)
        token = encode_token(user_id: @user.id)

        # for good advice on httponly: https://www.thegreatcodeadventure.com/jwt-storage-in-rails-the-right-way/
        cookies.signed[:jwt] = {value: token, httponly: true}
        render json: { email: @user.email }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          errors: [create_activerecord_error('User info not valid!', e)]
        }, status: :unauthorized
      end
    
      def show
        @user = current_user
        render json: {
          user_info: @user.as_json(only: [:email]),
          # user_scores: @user.my_scores
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          errors: create_activerecord_error('User somehow not found.', e)
        }, status: :unauthorized    
      end
    
    
      def user_params
        params.require(:user).permit(:email, :password)
      end
    end    
  end
end
