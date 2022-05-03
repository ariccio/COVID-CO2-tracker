require 'rails_helper'

RSpec.describe("Manufacturers", type: :request) do
  describe("GET /manufacturers") do
    context("Succesfully creates manufacturer") do
      
    end
    context("Fails to create manufacturer") do
      let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Name.name}}}
      let(:null_manufacturer_params) {{manufacturer: {name: nil}}}
      let(:empty_manufacturer_params) {{manufacturer: nil}}
      let(:empty_params) {nil}
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end
      it("Cannot create manufacturer when not logged in") do
        post(api_v1_manufacturers_path, params: reasonable_manufacturer_params)
        # pp response
        expect(response).to(have_http_status(:unauthorized))
        formatted_error_check(response, json_response, :unauthorized, "Please log in", "unauthorized")
      end

      it("Cannot create manufacturer with invalid user?") do
        post(api_v1_manufacturers_path, headers: invalid_jwt_header, params: reasonable_manufacturer_params)
        # pp response
        formatted_error_check(response, json_response, :bad_request, "something went wrong with parsing the JWT", "Not enough or too many segments")
      end
      it("Cannot create null manufacturer with valid user") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: null_manufacturer_params)
        formatted_error_check(response, json_response, :bad_request, "manufacturer creation failed!", "Name can't be blank")
        pp response
      end
    end

    it("works! (now write some real specs)") do
      # get manufacturers_path
      # expect(response).to have_http_status(200)
    end
  end
end
