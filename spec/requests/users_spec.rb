require 'rails_helper'


# Note to self: Rails.application.routes.named_routes.helper_names



RSpec.describe('Users', type: :request) do
  # describe "GET /index" do
  #   pending "add some examples (or delete) #{__FILE__}"
  # end

  describe('create users (via auth), show new empty user') do
    # let(:new_user) {{user: {email: Faker::Internet.email, name: Faker::Name.name, sub: Faker::Alphanumeric.alpha(number: 5), email_verified: true, needs_jwt_value_for_js: true}}}
    let(:new_user) {new_user_params}

    let(:new_user_invalid_nil) {{ user: { email: Faker::Internet.email, name: Faker::Name.name, sub: nil, email_verified: true, needs_jwt_value_for_js: true } }}

    let(:new_user_invalid_blank) {{ user: { email: Faker::Internet.email, name: Faker::Name.name, sub: nil, email_verified: true, needs_jwt_value_for_js: true } }}


    context('bad user create params failures') do 
      it('fails to create a user with nil sub') do
        post(api_v1_auth_index_path, params: new_user_invalid_nil)
        # pp json_response
        formatted_error_check(response, json_response, :unauthorized, 'parameter sub not valid', 'not_acceptable')
      end
      it('fails to create a user with blank sub') do
        post(api_v1_auth_index_path, params: new_user_invalid_blank)
        # pp json_response
        formatted_error_check(response, json_response, :unauthorized, 'parameter sub not valid', 'not_acceptable')
      end
    end

    context('success path') do

      before(:each) do 
        post(api_v1_auth_index_path, params: new_user)
      end
      # before { post(api_v1_auth_index_path, params: new_user)}
      it('creates a new user') do
        expect(json_response['email']).to(eq(new_user[:user][:email]))
      end
  
      it('can show the user') do 
        # pp json_response
        headers_with_auth = with_jwt(json_response['jwt'])
        # pp headers_with_auth
        # pp headers
        # TODO: why does api_v1_user_path not work here?
        get('/api/v1/users/show', headers: headers_with_auth)
        # result = response
        # pp json_response
        # puts "result: #{result.body}"
        expect(json_response).to include('user_info')
        expect(json_response['user_info']).to(eq(new_user[:user][:email]))
        expect(json_response).to include('devices')
        expect(json_response['devices']).to(eq([]))
        expect(json_response).to include('measurements')
        expect(json_response['measurements']).to(eq(nil))
        expect(json_response).to include('setting_place_google_place_id')
        expect(json_response['setting_place_google_place_id']).to(eq(nil))
  
  
      end

      it('can show my_devices') do
        # pp json_response
        # pp headers
        headers_with_auth = with_jwt(json_response['jwt'])
        # pp headers
        get(api_v1_my_devices_path, headers: headers_with_auth)
        # result2 = response
        # puts "result 2: #{result2.body}"
  
        expect(json_response).to include('devices')
        expect(json_response['devices']).to(eq([]))
        expect(json_response).to include('last_device_id')
        expect(json_response['last_device_id']).to(eq(nil))
        # pp json_response
      end
    end
  end
end
