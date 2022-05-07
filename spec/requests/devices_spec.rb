require 'rails_helper'

RSpec.describe("Devices", type: :request) do
  describe("The whole path for creating a device") do
    let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Name.name}}}
    let(:new_model_name) {Faker::Name.name}
    let(:new_serial_name){Faker::Name.name}
    context("Sucessfully create a device") do
      it("can create a device") do
        
        user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        get(api_v1_manufacturer_path(manufacturer_create_response["manufacturer_id"]), headers: user_headers)

        check_no_error(response, json_response, :ok)

        # new_model_name = Faker::Name.name
        post(api_v1_model_index_path, headers: user_headers, params: {model: {name: new_model_name, manufacturer_id: manufacturer_create_response["manufacturer_id"]}})

        model_response = json_response
        check_no_error(response, model_response, :created)

        post(api_v1_device_index_path, headers: user_headers, params: {device: {serial: new_serial_name, model_id: model_response["model_id"]}})
        device_create_response = json_response
        check_no_error(response, device_create_response, :created)
        pp device_create_response
      end
    end

    it("works! (now write some real specs)") do
      # get devices_path
      # expect(response).to have_http_status(200)
    end
  end
end
