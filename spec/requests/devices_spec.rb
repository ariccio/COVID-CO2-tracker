# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('Devices', type: :request) do
  describe('The whole path for creating a device') do
    let(:reasonable_manufacturer_params) { { manufacturer: { name: Faker::Company.name } } }
    let(:new_model_name) { Faker::Device.model_name }
    let(:new_serial_name) { Faker::Device.serial }
    context('Successfully create a device') do
      it('can create a device') do

        user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        created_manufacturer_id = manufacturer_create_response['manufacturer_id']
        get(api_v1_manufacturer_path(created_manufacturer_id), headers: user_headers)

        check_no_error(response, json_response, :ok)

        post(api_v1_model_index_path, headers: user_headers, params: { model: { name: new_model_name, manufacturer_id: created_manufacturer_id } })

        model_response = json_response
        check_no_error(response, model_response, :created)

        created_model_id = model_response['model_id']

        post(api_v1_device_index_path, headers: user_headers, params: { device: { serial: new_serial_name, model_id: created_model_id } })
        device_create_response = json_response
        check_no_error(response, device_create_response, :created)
        # pp device_create_response
        expect(device_create_response['serial']).to(eq(new_serial_name))

        get(api_v1_manufacturer_path(created_manufacturer_id))
        # pp response
        check_no_error(response, json_response, :ok)
        manufacturer_list_response = json_response

        # pp "manufacturer:", json_response
        expect(manufacturer_list_response['models'][0]['model_id']).to(eq(created_model_id))
        expect(manufacturer_list_response['models'][0]['manufacturer_id']).to(eq(created_manufacturer_id))
        expect(manufacturer_list_response['models'][0]['name']).to(eq(new_model_name))
        expect(manufacturer_list_response['models'][0]['count']).to(eq(1))

        get(api_v1_model_path(created_model_id))
        check_no_error(response, json_response, :ok)
        model_list_response = json_response

        # pp "model:", json_response
        expect(model_list_response['name']).to(eq(new_model_name))
        expect(model_list_response['count']).to(eq(1))
        expect(model_list_response['measurement_count']).to(eq(0))
        # expect(model_list_response["manufacturer_name"]).to(eq(0))
      end
    end


    context('fail to create device in different ways') do
      let(:max_id) { 9_223_372_036_854_775_807 }
      before(:each) do
        @user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)
        manufacturer_create_response = json_response
        @created_manufacturer_id = manufacturer_create_response['manufacturer_id']
        get(api_v1_manufacturer_path(@created_manufacturer_id), headers: @user_headers)
        check_no_error(response, json_response, :ok)
        post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: new_model_name, manufacturer_id: @created_manufacturer_id } })
        @model_response = json_response
        check_no_error(response, @model_response, :created)
        @created_model_id = @model_response['model_id']
      end

      it('fails to create a user-duplicate device instance') do
        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: @created_model_id } })
        device_create_response_1 = json_response
        check_no_error(response, device_create_response_1, :created)

        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: @created_model_id } })
        device_create_response_2 = json_response
        # pp json_response
        expected_error_str = "You already uploaded a #{new_model_name} to your account with the serial # '#{new_serial_name}'! Use that to add measurements."
        formatted_error_check(response, device_create_response_2, :bad_request, expected_error_str, nil)
        #
      end
      it('(currently) fails to create a model-global-duplicate device instance') do
        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: @created_model_id } })
        device_create_response_1 = json_response
        check_no_error(response, device_create_response_1, :created)

        @user_headers_2 = new_valid_empty_user_req
        post(api_v1_device_index_path, headers: @user_headers_2, params: { device: { serial: new_serial_name, model_id: @created_model_id } })
        device_create_response_2 = json_response
        # pp json_response
        expected_error_str = "#{new_model_name} with serial # '#{new_serial_name}' already exists in global database."
        # expected_error_str = "fartipelago"
        formatted_error_check(response, device_create_response_2, :bad_request, expected_error_str, nil)

      end

      it('fails with a nil serial name') do
        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: nil, model_id: @created_model_id } })
        device_create_response = json_response
        formatted_error_check(response, device_create_response, :bad_request, 'device creation failed!', "Serial can't be blank")
      end

      it('fails with a blank serial name') do
        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: '', model_id: @created_model_id } })
        device_create_response = json_response
        formatted_error_check(response, device_create_response, :bad_request, 'device creation failed!', "Serial can't be blank")
      end

      it('fails with a nil model_id') do
        post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: nil } })
        device_create_response = json_response
        formatted_error_check_array(response, device_create_response, :bad_request, 'Invalid model_id.', [nil, 'Model'])
      end

      it('fails with an invalid model_id') do
        minimum_invalid_id = (@created_model_id + 1)
        3.times do
          invalid_id = Faker::Number.between(from: minimum_invalid_id, to: max_id)
          post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: invalid_id } })
          # pp json_response
          formatted_error_check_array(response, json_response, :bad_request, 'Invalid model_id.', ["#{invalid_id}", 'Model'])
        end
      end

    end
  end
end
