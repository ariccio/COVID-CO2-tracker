require 'rails_helper'

RSpec.describe('Api::V2::HighestMeasurements', type: :request) do
  describe('GET /index') do
    let(:my_home) { 'ChIJbVog-MFYwokRDS9_fOijV2U' }
    let(:new_place_params) { { place: { google_place_id: my_home } } }
    let(:invalid_place_params) { { place: { google_place_id: 'fartipelago' } } }
    let(:invalid_request_google_places) { { 'status' => 'INVALID_REQUEST' } }
    let(:new_serial_name) { Faker::Device.serial }
    let(:reasonable_manufacturer_params) { { manufacturer: { name: Faker::Company.name } } }
    let(:empty_highest_measurement) { { 'ten_measurements' => [], 'ten_places' => [], 'ten_sublocations' => [] } }
    before(:each) do
      # same as measurement_spec
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
      # end same as measurement spec

    end

    it('returns nothing without measurements or places') do
      get('/api/v2/highest_measurement/index')
      expect(response).to have_http_status(:ok)
      expect(json_response).to(eq(empty_highest_measurement))
    end

    it ('can show the higher of two measurements after creation, first, and everything matches') do
      lower = Faker::Number.between(from: 400, to: 500)
      fake_crowd_create_lower = Faker::Number.between(from: 1, to: 5)
      fake_subloc_create_lower = Faker::Hipster.sentence(word_count: 3)
      new_measurement_1_create = {
        measurement: {
          device_id: @created_device_id,
          co2ppm: lower,
          google_place_id: my_home,
          crowding: fake_crowd_create_lower,
          location_where_inside_info: fake_subloc_create_lower,
          sub_location_id: -1
        }
      }
      post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_1_create)
      # pp json_response
      check_no_error(response, json_response, :created)
      new_measurement_1_response = json_response

      higher = Faker::Number.between(from: 501, to: 9999)
      fake_crowd_create_higher = Faker::Number.between(from: 1, to: 5)
      fake_subloc_create_higher = Faker::Hipster.sentence(word_count: 3)
      new_measurement_2_create = {
        measurement: {
          device_id: @created_device_id,
          co2ppm: higher,
          google_place_id: my_home,
          crowding: fake_crowd_create_higher,
          location_where_inside_info: fake_subloc_create_higher,
          sub_location_id: -1
        }
      }
      post(api_v1_measurement_index_path, headers: @user_headers, params: new_measurement_2_create)
      # pp json_response
      check_no_error(response, json_response, :created)
      new_measurement_2_response = json_response


      get('/api/v2/highest_measurement/index')
      expect(response).to have_http_status(:ok)
      pp json_response
      # {
        # "ten_places"=>[
          # {"id"=>2, "google_place_id"=>"ChIJbVog-MFYwokRDS9_fOijV2U"}
        # ],
        # "ten_sublocations"=> [
          # {"id"=>2, "description"=>"Ugh lo-fi semiotics cleanse normcore craft beer gluten-free banjo.", "place_id"=>2},
          # {"id"=>1, "description"=>"Next level pour-over scenester.", "place_id"=>2}
        # ],
        # "ten_measurements"=>[
          # {"id"=>2, "co2ppm"=>5693, "device_id"=>2, "measurementtime"=>"2024-03-20T02:27:25.575Z", "sub_location_id"=>2},
        #   {"id"=>1, "co2ppm"=>495, "device_id"=>2, "measurementtime"=>"2024-03-20T02:27:25.534Z", "sub_location_id"=>1}
        # ]
      # }
      # byebug
      expect(json_response['ten_places'].length).to(eq(1))
      expect(json_response['ten_measurements'].length).to(eq(2))
      expect(json_response['ten_sublocations'].length).to(eq(2))


      expect(json_response['ten_places'][0]['google_place_id']).to(eq(my_home))

      expect(json_response['ten_sublocations'][0]['description']).to(eq(fake_subloc_create_higher))
      expect(json_response['ten_sublocations'][1]['description']).to(eq(fake_subloc_create_lower))

      expect(json_response['ten_measurements'][0]['sub_location_id']).to(eq(json_response['ten_sublocations'][0]['id']))
      expect(json_response['ten_measurements'][1]['sub_location_id']).to(eq(json_response['ten_sublocations'][1]['id']))

      expect(json_response['ten_measurements'][0]['co2ppm']).to(eq(higher))
      expect(json_response['ten_measurements'][0]['device_id']).to(eq(@created_device_id))
      expect(json_response['ten_measurements'][0]['measurementtime']).to(eq(new_measurement_2_response['measurementtime']))


      expect(json_response['ten_measurements'][1]['co2ppm']).to(eq(lower))
      expect(json_response['ten_measurements'][1]['device_id']).to(eq(@created_device_id))
      expect(json_response['ten_measurements'][1]['measurementtime']).to(eq(new_measurement_1_response['measurementtime']))

      expect(json_response['ten_measurements'][0]['co2ppm']).to(be > json_response['ten_measurements'][1]['co2ppm'])
    
    end


    # it("returns http success") do
    #   get("/api/v2/highest_measurement/index")
    #   expect(response).to have_http_status(:success)
    # end
  end

end
