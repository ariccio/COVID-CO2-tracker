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

      def render_signature_verification_failed(exception)
        error_array = [create_error('signature verification failed, google id token invalid!', :not_acceptable.to_s)]
        error_array << single_error('', exception)
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

      def render_invalid_google_login_params(exception, bad_param)
        error_array = [create_error("parameter #{bad_param} not valid", :not_acceptable.to_s)]
        error_array << create_activerecord_notfound_error("triggered path by not finding existing user", exception)
        render(
          json: {
            errors:
              error_array
          },
          status: :unauthorized # 401
        )
      end

      def render_email_not_yet_validated(exception)
        error_array = [create_error("google account email not yet validated, I'm not gonna accept that right now, to hopefully prevent spam", exception)]
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

      def render_creation_activerecord_error(exception)
        render(
          json: {
            errors: [create_activerecord_error('User info not valid!', exception)]
          },
          status: :unauthorized
        )
      end

      def create_user_with_google(e)
        # byebug
        return render_invalid_google_login_params(e, :sub) if @decoded_token["sub"].nil?
        return render_invalid_google_login_params(e, :sub) if @decoded_token["sub"].empty?
        return render_invalid_google_login_params(e, :email_verified) if @decoded_token["email_verified"].nil?
        return render_email_not_yet_validated(e) if !(@decoded_token["email_verified"])
        return render_invalid_google_login_params(e, :email) if @decoded_token["email"].nil?
        return render_invalid_google_login_params(e, :email) if @decoded_token["email"].empty?
        # byebug
        @user = User.create!(email: @decoded_token["email"], name: @decoded_token["name"], sub_google_uid: @decoded_token["sub"])
        render_successful_authentication
      rescue ::ActiveRecord::RecordInvalid => creation_exception
        render_creation_activerecord_error(creation_exception)
      end

      # Note to self: https://philna.sh/blog/2020/01/15/test-signed-cookies-in-rails/
      def create
        @decoded_token = token_from_google
        # byebug
        @user = ::User.find_by!(sub_google_uid: @decoded_token["sub"])
        # byebug
        render_successful_authentication
        
        # deliberately do not handle ActiveRecord::SoleRecordExceeded right now. This should be an internal server error?
        
      # See: C:\Ruby30-x64\lib\ruby\gems\3.0.0\gems\googleauth-0.16.0\lib\googleauth\id_tokens\errors.rb
      rescue Google::Auth::IDTokens::SignatureError => se #(Token not verified as issued by Google):
        Rails.logger.warn "user_login_google_params[:id_token]: #{user_login_google_params[:id_token]} invalid! This shouldn't happen."
        render_signature_verification_failed(se)
      rescue ::ActiveRecord::RecordNotFound => e
        create_user_with_google(e)
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
        # byebug
        decoded_with_googleauth = Google::Auth::IDTokens.verify_oidc(user_login_google_params.fetch(:id_token))
        # byebug
        # Rails.logger.debug decoded_with_googleauth
        # byebug
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

        # exp: Expiration time on or after which the ID token must not be accepted. Represented in Unix time (integer seconds).
        # iat: The time the ID token was issued. Represented in Unix time (integer seconds).
        # This may be useful in the future for dealing with sessions. Would be more useful if I did sessions server side.


        # NOTE: (TO SELF): as per https://developers.google.com/assistant/identity/google-sign-in-oauth, they recommend
        # checking if both the stored sub and email fields match
        decoded_with_googleauth
      end


      private
      def user_login_google_params
        # :sub, :email, :email_verified, :name
        params.require(:user).permit(:id_token)
      end

      def user_login_params
        # byebug
        # params { user: {username: 'Chandler Bing', password: 'hi' } }
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
