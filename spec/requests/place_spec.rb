require 'rails_helper'

RSpec.describe('Places', type: :request) do
  describe('create new place (POST api_v1_places_path)') do
    let (:my_home) { 'ChIJbVog-MFYwokRDS9_fOijV2U' }
    let (:new_place_params) { { place: { google_place_id: my_home } } }
    let (:invalid_place_params) { { place: { google_place_id: 'fartipelago' } } }
    let (:invalid_request_google_places) { { 'status' => 'INVALID_REQUEST' } }
    let (:home_lat) { '40.766653' }
    let (:home_lng) { '-73.958756' }

    #   export const defaultCenter: google.maps.LatLngLiteral = {
    #     lat: 40.76797,
    #     lng: -73.9592
    # };
    # place: {east: -73.95199022216795, north: 40.777086290641215, south: 40.75885245857517,…}

    let (:default_bounds) { {
      east: -73.95199022216795,
      north: 40.777086290641215,
      south: 40.75885245857517,
      west: -73.96640977783201,
    }}

    # https://dev.to/isalevine/intro-to-rspec-in-rails-part-2-improving-tests-with-let-and-context-241n
    context('success') do
      it('creates a place for a new user') do
        # ChIJbVog-MFYwokRDS9_fOijV2U
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        check_no_error(response, created_place, :created)

        # pp api_v1_place_path(created_place["place_id"])
        get(api_v1_place_path(created_place['place_id']))
        fetched_new_place_response = json_response
        # pp json_response
        check_no_error(response, json_response, :ok)
        # expect(fetched_new_place_response["id"]).to(eq(1))
        expect(fetched_new_place_response['google_place_id']).to(eq(my_home))
        expect(fetched_new_place_response['place_lat']).to(eq(home_lat))
        expect(fetched_new_place_response['place_lng']).to(eq(home_lng))
      end
      context('Succesful create, succesful renders of all routes') do
        before(:each) do
          user_headers = new_valid_empty_user_req
          post(api_v1_places_path, headers: user_headers, params: new_place_params)
          # pp json_response
          created_place = json_response
          check_no_error(response, created_place, :created)
        end
        it('says already created place exists') do
          get("/api/v1/places_by_google_place_id_exists/#{my_home}")
          check_no_error(response, json_response, :ok)
          expect(json_response).to(include('exists'))
          expect(json_response['exists']).to(eq(true))
        end
        it('shows place and measurements by google place id for newly created place') do
          get("/api/v1/places_by_google_place_id/#{my_home}")
          check_no_error(response, json_response, :ok)
          place_with_measurements = json_response
          expect(place_with_measurements).to(include('created'))
          expect(place_with_measurements['created']).to(eq(false))

          expect(place_with_measurements).to(include('measurements_by_sublocation'))
          expect(place_with_measurements['measurements_by_sublocation']).to(eq([]))
          # pp place_with_measurements
        end
        it('Renders place in bounds') do
          #
          get(api_v1_places_in_bounds_path, params: default_bounds)
          check_no_error(response, json_response, :ok)
          places_in_bounds = json_response

          expect(places_in_bounds).to(include('places'))
          expect(places_in_bounds['places'].length).to(eq(1))
          # byebug

          expect(places_in_bounds['places'][0]).to(include('id'))
          expect(places_in_bounds['places'][0]).to(include('type'))
          expect(places_in_bounds['places'][0]['type']).to(eq('place'))

          expect(places_in_bounds['places'][0]).to(include('attributes'))
          expect(places_in_bounds['places'][0]['attributes']).to(include('google_place_id'))
          expect(places_in_bounds['places'][0]['attributes']['google_place_id']).to(eq(my_home))

          expect(places_in_bounds['places'][0]['attributes']).to(include('place_lat'))
          expect(places_in_bounds['places'][0]['attributes']['place_lat']).to(eq(home_lat))

          expect(places_in_bounds['places'][0]['attributes']).to(include('place_lng'))
          expect(places_in_bounds['places'][0]['attributes']['place_lng']).to(eq(home_lng))
          # pp places_in_bounds["places"][0]["attributes"]

        end
      end
    end

    context('invalid place - failure') do
      it('correctly says non-existant-place does not exist') do
        get('/api/v1/places_by_google_place_id_exists/123456')
        check_no_error(response, json_response, :ok)
        expect(json_response).to(include('exists'))
        expect(json_response['exists']).to(eq(false))
      end
      it('fails to create a nonsense place') do
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: invalid_place_params)

        # pp response
        # pp json_response["errors"][0]["error"]
        # parsed = JSON.parse(json_response["errors"][0]["error"][0])
        # expect(parsed).to(include({"status" => "INVALID_REQUEST"}))
        formatted_error_check_with_json(response, json_response, :bad_request, 'backend invalid request to google places', invalid_request_google_places)
      end
      it('Fails to duplicate') do
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        check_no_error(response, created_place, :created)

        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, 'place already created! Did you click twice?', nil)
        # check_no_error(response, created_place, :created)
      end
      it('Renders that a non-existant place does not exist') do
        get('/api/v1/places_by_google_place_id/fartipelago')
        #
        #
        formatted_error_check_array(response, json_response, :not_found, 'fartipelago does not exist in database. Not necessarily an error!', ['not_acceptable'])
      end
    end
  end
end
