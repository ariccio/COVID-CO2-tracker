require 'rails_helper'


# Note to self: Rails.application.routes.named_routes.helper_names



RSpec.describe "Users", type: :request do
  # describe "GET /index" do
  #   pending "add some examples (or delete) #{__FILE__}"
  # end

  describe "create users (via auth), show new empty user" do
    let(:new_user) {{user: {email: Faker::Internet.safe_email, name: Faker::Name.name, sub: Faker::Alphanumeric.alpha(number: 5), email_verified: true, needs_jwt_value_for_js: true}}}
    before { post(api_v1_auth_index_path, params: new_user)}
    it "creates a new user" do
      # pp api_v1_auth_index_path
      # pp response
      # byebug
      # pp json_response
      # pp new_user
      expect(json_response['email']).to(eq(new_user[:user][:email]))
    end

    it "can show the user" do 
      # pp json_response
      headers = with_jwt(json_response["jwt"])
      # pp headers
      # TODO: why does api_v1_user_path not work here?
      get('/api/v1/users/show', headers: headers)
      result = response
      # pp json_response
      # puts "result: #{result.body}"
      expect(json_response).to include("user_info")
      expect(json_response["user_info"]).to(eq(new_user[:user][:email]))
      expect(json_response).to include("devices")
      expect(json_response["devices"]).to(eq([]))
      expect(json_response).to include("measurements")
      expect(json_response["measurements"]).to(eq(nil))
      expect(json_response).to include("setting_place_google_place_id")
      expect(json_response["setting_place_google_place_id"]).to(eq(nil))

      get(api_v1_my_devices_path, headers: headers)
      result2 = response
      # puts "result 2: #{result2.body}"

      expect(json_response).to include("devices")
      expect(json_response["devices"]).to(eq([]))
      expect(json_response).to include("last_device_id")
      expect(json_response["last_device_id"]).to(eq(nil))

    end
  end
end
