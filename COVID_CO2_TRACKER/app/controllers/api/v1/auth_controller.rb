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

      def token_from_google
        # only one param
        # decoded = GoogleSignIn::Identity.new(params[:id_token])
        
        decoded_with_googleauth = Google::Auth::IDTokens.verify_oidc(params[:id_token])
        Rails.logger.debug decoded_with_googleauth
        byebug
        # NOTE: "jti" field is a neat security event identifier: https://developers.google.com/identity/protocols/risc#python
        # See more in the RFC for JWT: https://tools.ietf.org/html/rfc7519
        # Would be more useful if I did sessions server side, but in theory I could revoke with blacklisting,
        # and prune the blacklist frequently with cookie/jwt expiration.


        # The ID token payload is very confusing. See here under "An ID token's payload":
        # https://developers.google.com/identity/protocols/oauth2/openid-connect
        # GoogleSignIn::Identity maps sub to user_id, (see https://github.com/basecamp/google_sign_in/blob/12d9fea3ab409f7c3aff2972f9bff96b765ec721/lib/google_sign_in/identity.rb#L5)
        # where sub is 
        # "An identifier for the user, unique among all Google accounts and never reused.
        # A Google account can have multiple email addresses at different points in time,
        # but the sub value is never changed. Use sub within your application as the unique-identifier key for the user.
        # Maximum length of 255 case-sensitive ASCII characters."
        # ...
        # "sub" is likely the same "sub" from the JWT RFC?
        # https://tools.ietf.org/html/rfc7519

        # at_hash: "Access token hash. Provides validation that the access token is tied to the identity token. 
        # If the ID token is issued with an access_token value in the server flow, this claim is always included.
        # This claim can be used as an alternate mechanism to protect against cross-site request forgery attacks,
        # but if you follow Step 1 and Step 3 it is not necessary to verify the access token."
        # NOTE: I'm PRETTY SURE on the frontend this is all handled by the components below me (e.g. gapi through react-google-login)
        # pretty sure as in I've spent several days investigating and I'm about 85% sure, even though I can't really
        # reverse engineer the gapi code right now. Have you seen how obfuscated it is?
        # 
        # ON THE BACK END, here, at_hash is validated by Google::Auth::IDTokens.verify_oidc.

        # NOTE: (TO SELF): client_secret isn't needed when using this flow. The google oauth docs suggest it is, but
        # REMEMBER, we're not using that.

        # iat: The time the ID token was issued. Represented in Unix time (integer seconds).
        # This may be useful in the future for dealing with sessions. Would be more useful if I did sessions server side.

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
