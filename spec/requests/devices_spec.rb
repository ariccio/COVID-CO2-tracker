require 'rails_helper'

RSpec.describe("Devices", type: :request) do
  describe("The whole path for creating a device") do
    let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Company.name}}}
    let(:new_model_name) {Faker::Device.model_name}
    let(:new_serial_name){Faker::Device.serial}
    context("Sucessfully create a device") do
      it("can create a device") do
        
        user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        get(api_v1_manufacturer_path(manufacturer_create_response["manufacturer_id"]), headers: user_headers)

        check_no_error(response, json_response, :ok)

        post(api_v1_model_index_path, headers: user_headers, params: {model: {name: new_model_name, manufacturer_id: manufacturer_create_response["manufacturer_id"]}})

        model_response = json_response
        check_no_error(response, model_response, :created)

        post(api_v1_device_index_path, headers: user_headers, params: {device: {serial: new_serial_name, model_id: model_response["model_id"]}})
        device_create_response = json_response
        check_no_error(response, device_create_response, :created)
        # pp device_create_response
        expect(device_create_response["serial"]).to(eq(new_serial_name))

        get(api_v1_manufacturer_path(manufacturer_create_response["manufacturer_id"]))
        # pp response
        check_no_error(response, json_response, :ok)
        manufacturer_list_response = json_response

        # pp "manufacturer:", json_response
        expect(manufacturer_list_response["models"][0]["model_id"]).to(eq(model_response["model_id"]))
        expect(manufacturer_list_response["models"][0]["manufacturer_id"]).to(eq(manufacturer_create_response["manufacturer_id"]))
        expect(manufacturer_list_response["models"][0]["name"]).to(eq(new_model_name))
        expect(manufacturer_list_response["models"][0]["count"]).to(eq(1))

        get(api_v1_model_path(model_response["model_id"]))
        check_no_error(response, json_response, :ok)
        model_list_response = json_response

        # pp "model:", json_response
        expect(model_list_response["name"]).to(eq(new_model_name))
        expect(model_list_response["count"]).to(eq(1))
        expect(model_list_response["measurement_count"]).to(eq(0))
        # expect(model_list_response["manufacturer_name"]).to(eq(0))
      end
    end

    it("works! (now write some real specs)") do
      # get devices_path
      # expect(response).to have_http_status(200)
    end
  end
end
