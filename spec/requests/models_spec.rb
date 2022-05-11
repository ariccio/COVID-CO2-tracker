require 'rails_helper'

RSpec.describe("Models", type: :request) do
  describe("GET /models") do
    let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Company.name}}}
    let(:new_model_name) {Faker::Device.model_name}
    # https://www.devroom.io/2009/08/20/once-and-for-all-rails-migrations-integer-limit-option/
    
    context("Sucessfully create model") do
      before(:each) do
        @user_headers = new_valid_empty_user_req
      end
      it("Sucessfully creates a new model") do
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        manufacturer_create_response = json_response

        created_manufacturer_id = manufacturer_create_response["manufacturer_id"]
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: new_model_name, manufacturer_id: created_manufacturer_id}})
        model_response = json_response
        check_no_error(response, model_response, :created)
        # pp model_response

        get(api_v1_manufacturer_path(created_manufacturer_id), headers: @user_headers)
        
        expected_model = {"model_id"=> model_response["model_id"], "manufacturer_id"=> created_manufacturer_id, "name"=> new_model_name, "count"=>0}
        expect(json_response["models"]).to(eq([expected_model]))

      end
  
    end

    context("Fail to create model") do
      let(:max_id) {9223372036854775807}
      before(:each) do
        @user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        @manufacturer_create_response = json_response

      end
      it("Fails with nil name") do
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: nil, manufacturer_id: @manufacturer_create_response["manufacturer_id"]}})
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, "device model creation failed!", "Name can't be blank")
      end


      it("Fails with blank name") do
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: "", manufacturer_id: @manufacturer_create_response["manufacturer_id"]}})
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, "device model creation failed!", "Name can't be blank")
      end

      it("Fails with nil manufacturer_id") do
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: new_model_name, manufacturer_id: nil}})
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, "device model creation failed!", "Manufacturer must exist")
      end

      it("Fails with nil manufacturer_id and blank name") do
        post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: "", manufacturer_id: nil}})
        model_response = json_response
        # pp model_response
        formatted_error_check(response, model_response, :bad_request, "device model creation failed!", "Name can't be blank")
      end

      it("fails with invalid manufacturer_id") do
        minimum_invalid_id = (@manufacturer_create_response["manufacturer_id"] + 1)
        # pp minimum_invalid_id
        10.times do
          invalid_id = Faker::Number.between(from: minimum_invalid_id, to: max_id)
          # pp invalid_id
          post(api_v1_model_index_path, headers: @user_headers, params: {model: {name: Faker::Company.name, manufacturer_id: invalid_id}})
          # pp json_response
          formatted_error_check(response, json_response, :bad_request, "device model creation failed!", "Manufacturer must exist")
        end
      end
    end
  end
end
