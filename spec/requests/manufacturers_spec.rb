require 'rails_helper'

RSpec.describe("Manufacturers", type: :request) do
  describe("GET /manufacturers") do
    let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Name.name}}}
    context("Succesfully creates manufacturer") do
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end

      it("Creates a new manufacturer") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        get(api_v1_manufacturer_path(manufacturer_create_response["manufacturer_id"]), headers: @user_headers)
        check_no_error(response, json_response, :ok)
        expect(json_response).to(include("name"))
        expect(json_response).to(include("manufacturer_id"))
        expect(json_response).to(include("models"))
        expect(json_response["name"]).to(eq(reasonable_manufacturer_params[:manufacturer][:name]))
        expect(json_response["models"]).to(eq([]))
      end
        
    end
    context("Fails to create manufacturer") do
      
      let(:null_manufacturer_params) {{manufacturer: {name: nil}}}
      let(:blank_manufacturer_params) {{manufacturer: {name: ""}}}
      let(:empty_manufacturer_params) {{manufacturer: nil}}
      let(:empty_params) {nil}
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end
      it("Cannot create manufacturer when not logged in") do
        post(api_v1_manufacturers_path, params: reasonable_manufacturer_params)
        expect(response).to(have_http_status(:unauthorized))
        formatted_error_check(response, json_response, :unauthorized, "Please log in", "unauthorized")
      end

      it("Cannot create manufacturer with invalid user?") do
        post(api_v1_manufacturers_path, headers: invalid_jwt_header, params: reasonable_manufacturer_params)
        formatted_error_check(response, json_response, :bad_request, "something went wrong with parsing the JWT", "Not enough or too many segments")
      end
      it("Cannot create null manufacturer with valid user") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: null_manufacturer_params)
        formatted_error_check(response, json_response, :bad_request, "manufacturer creation failed!", "Name can't be blank")
      end
      it("Cannot create blank manufacturer with valid user") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: blank_manufacturer_params)
        formatted_error_check(response, json_response, :bad_request, "manufacturer creation failed!", "Name can't be blank")
      end
      it("Cannot create empty manufacturer with valid user") do
        # I expect an error to be raised in production. In production, it will be reported via sentry should this happen.
        expect {
          post(api_v1_manufacturers_path, headers: @user_headers, params: empty_manufacturer_params)
        }.to(raise_error(::ActionController::ParameterMissing))
      end
      it("Cannot create empty manufacturer with valid user") do
        # I expect an error to be raised in production. In production, it will be reported via sentry should this happen.
        expect {
          post(api_v1_manufacturers_path, headers: @user_headers, params: empty_params)
        }.to(raise_error(::ActionController::ParameterMissing))
      end
    end

  end
end
