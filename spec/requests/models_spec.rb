require 'rails_helper'

RSpec.describe("Models", type: :request) do
  describe("GET /models") do
    let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Name.name}}}
    let(:new_model_name) {Faker::Name.name}
    context("Sucessfully create model") do
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end
      it("Sucessfully creates a new model") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        manufacturer_create_response = json_response

        # new_model_name = 
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: new_model_name, manufacturer_id: manufacturer_create_response["manufacturer_id"]}})
        model_response = json_response
        check_no_error(response, model_response, :created)
        pp model_response

        get(api_v1_manufacturer_path(manufacturer_create_response["manufacturer_id"]), headers: @user_headers)
        
        expected_model = {"model_id"=> model_response["model_id"], "manufacturer_id"=> manufacturer_create_response["manufacturer_id"], "name"=> new_model_name, "count"=>0}
        expect(json_response["models"]).to(eq([expected_model]))

      end
  
    end

    context("Fail to create model") do
      before(:each) do
        @user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        @manufacturer_create_response = json_response

      end
      it("Fails") do


        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: nil, manufacturer_id: @manufacturer_create_response["manufacturer_id"]}})
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, "device model creation failed!", "Name can't be blank")

      end
    end
  end
end
