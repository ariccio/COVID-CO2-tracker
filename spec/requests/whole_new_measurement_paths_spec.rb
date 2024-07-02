require 'rails_helper'

RSpec.describe('WholeNewMeasurementPaths', type: :request) do
  describe('The main user path for a new user creating a new measurement') do
    let(:my_home) {'ChIJbVog-MFYwokRDS9_fOijV2U'}
    let(:new_place_params) {{ place: { google_place_id: my_home } }}
    let(:invalid_place_params) {{ place: { google_place_id: 'fartipelago' } }}
    let(:invalid_request_google_places) {{ 'status' => 'INVALID_REQUEST' }}
    let(:new_serial_name) {Faker::Device.serial}

    context('successful new measurement') do
      let(:reasonable_manufacturer_params) {{ manufacturer: { name: Faker::Company.name } }}
      it('can create user, then manufacturer, then model, then device, then place, then measurement') do
        user_headers = new_valid_empty_user_req
        post(api_v1_manufacturers_path, headers: user_headers, params: reasonable_manufacturer_params)
        check_no_error(response, json_response, :created)

        manufacturer_create_response = json_response
        created_manufacturer_id = manufacturer_create_response['manufacturer_id']
        get(api_v1_manufacturer_path(created_manufacturer_id), headers: user_headers)
        check_no_error(response, json_response, :ok)

        new_model_name = Faker::Device.model_name
        post(api_v1_model_index_path, headers: user_headers, params: { model: { name: new_model_name, manufacturer_id: created_manufacturer_id } })

        model_response = json_response
        check_no_error(response, model_response, :created)
        created_model_id = model_response['model_id']
        
        post(api_v1_device_index_path, headers: user_headers, params: { device: { serial: new_serial_name, model_id: created_model_id } })
        device_create_response = json_response
        check_no_error(response, device_create_response, :created)
        
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        check_no_error(response, created_place, :created)


        new_measurement_1 = {
          measurement: {
            device_id: device_create_response['device_id'],
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }

        # pp new_measurement_1
        post(api_v1_measurement_index_path, headers: user_headers, params: new_measurement_1)
        # pp json_response
        # pp response
        check_no_error(response, json_response, :created)

        #TODO: check measurements rendering.
      end
    end
  end
end
