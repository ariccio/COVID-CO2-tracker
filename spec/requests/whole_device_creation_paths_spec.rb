require 'rails_helper'

RSpec.describe("WholeDeviceCreationPaths", type: :request) do
  describe("The main user path, creating new manufacturer, new model, and device instance") do

    context("successfully create all things") do
      # This uses a person name, but IDGAF
      let(:reasonable_manufacturer_params) {{manufacturer: {name: Faker::Company.name}}}
      let(:new_serial_name){Faker::Device.serial}
      it("can create user, then manufacturer, then model, then device") do
        user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        created_manufacturer_id = manufacturer_create_response["manufacturer_id"]
        get(api_v1_manufacturer_path(created_manufacturer_id), headers: user_headers)
        check_no_error(response, json_response, :ok)

        new_model_name = Faker::Device.model_name
        post(api_v1_model_index_path, headers: user_headers, params: {model: {name: new_model_name, manufacturer_id: created_manufacturer_id}})

        model_response = json_response
        check_no_error(response, model_response, :created)
        created_model_id = model_response["model_id"]
        
        post(api_v1_device_index_path, headers: user_headers, params: {device: {serial: new_serial_name, model_id: created_model_id}})
        device_create_response = json_response
        check_no_error(response, device_create_response, :created)

      end
      
    end

    context("fail in different places") do
      before(:each) do
        
      end
    end
  end
end
