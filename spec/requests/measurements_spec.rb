# frozen_string_literal: true

require 'rails_helper'

RSpec.describe('Measurements', type: :request) do
  describe('Create measurements') do
    let(:my_home) { 'ChIJbVog-MFYwokRDS9_fOijV2U' }
    let(:new_place_params) { { place: { google_place_id: my_home } } }
    let(:invalid_place_params) { { place: { google_place_id: 'fartipelago' } } }
    let(:invalid_request_google_places) { { 'status' => 'INVALID_REQUEST' } }
    let(:new_serial_name) { Faker::Device.serial }
    let(:reasonable_manufacturer_params) { { manufacturer: { name: Faker::Company.name } } }
    before(:each) do
      @user_headers = new_valid_empty_user_req
      post(api_v1_manufacturers_path, headers: @user_headers, params: reasonable_manufacturer_params)
      check_no_error(response, json_response, :created)

      manufacturer_create_response = json_response
      created_manufacturer_id = manufacturer_create_response['manufacturer_id']

      get(api_v1_manufacturer_path(created_manufacturer_id), headers: @user_headers)
      check_no_error(response, json_response, :ok)

      new_model_name = Faker::Device.model_name
      post(api_v1_model_index_path, headers: @user_headers, params: { model: { name: new_model_name, manufacturer_id: created_manufacturer_id } })

      model_response = json_response
      check_no_error(response, model_response, :created)
      created_model_id = model_response['model_id']

      post(api_v1_device_index_path, headers: @user_headers, params: { device: { serial: new_serial_name, model_id: created_model_id } })
      device_create_response = json_response
      check_no_error(response, device_create_response, :created)
      @created_device_id = device_create_response['device_id']

      post(api_v1_places_path, headers: @user_headers, params: new_place_params)
      # pp json_response
      check_no_error(response, json_response, :created)
      @created_place = json_response

    end

    context('successful measurement creation') do
      it('Can create a new measurement for a place with a new sublocation') do
        fake_co2 = Faker::Number.between(from: 400, to: 9999)
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: fake_co2,
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        check_no_error(response, json_response, :created)
        new_measurement_1_response = json_response
        # pp new_measurement_1_response
        # {"measurement_id"=>1, "device_id"=>1, "co2ppm"=>1032, "place_id"=>1, "measurementtime"=>"2024-07-02T01:24:43.038Z"}
        expect(new_measurement_1_response['device_id']).to(eq(@created_device_id))
        expect(new_measurement_1_response['co2ppm']).to(eq(fake_co2))
      end
      # it("Can create measurement for extant sublocation") do
      #   new_measurement_1 = {
      #     measurement: {
      #       device_id: @created_device_id,
      #       co2ppm: Faker::Number.between(from: 400, to: 9999),
      #       google_place_id: my_home,
      #       crowding: Faker::Number.between(from: 1, to: 5),
      #       location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
      #       sub_location_id: -1
      #     }
      #   }
      #   post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
      #   # pp json_response
      #   check_no_error(response, json_response, :created)
      #   new_measurement_1_response = json_response
      # end


    end

    context('Failure to create measurement') do
      let(:max_id) { 9_223_372_036_854_775_807 }
      it('Cannot create measurement without logged in user') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: nil, params: new_measurement_1)
        formatted_error_check(response, json_response, :unauthorized, 'Please log in', 'unauthorized')
        # pp json_response
      end

      it('Cannot create measurement without device') do
        new_measurement_1 = {
          measurement: {
            device_id: nil,
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', 'Device must exist')
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', "Device can't be blank")
      end

      it('Cannot create measurement with invalid device') do
        minimum_invalid_id = (@created_device_id + 1)
        new_measurement_1 = {
          measurement: {
            device_id: Faker::Number.between(from: minimum_invalid_id, to: max_id),
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', 'Device must exist')
      end

      it('Cannot create measurement with negative co2') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: -1000, to: -1),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', 'Co2ppm must be greater than or equal to 0')
      end

      it('Cannot create measurement with excessive co2') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: 30_000, to: 1_000_000),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', nil)
      end

      it('Cannot create measurement with nonsense place') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: 'fartipelago',
            crowding: Faker::Number.between(from: 1, to: 5),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response

        formatted_error_check(response, json_response, :bad_request, "couldn't find google_place_id: fartipelago to create measurement for. Possible bug.", nil)
      end

      it('Cannot create measurement with negative crowding') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: -1000, to: 0),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', 'Crowding must be greater than or equal to 1')
      end

      it('Cannot create measurement with excessive crowding') do
        new_measurement_1 = {
          measurement: {
            device_id: @created_device_id,
            co2ppm: Faker::Number.between(from: 400, to: 9999),
            google_place_id: my_home,
            crowding: Faker::Number.between(from: 6, to: 1_000_000),
            location_where_inside_info: Faker::Hipster.sentence(word_count: 3),
            sub_location_id: -1
          }
        }
        post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'measurement creation failed!', 'Crowding must be less than or equal to 5')
      end

    end
  end
end
