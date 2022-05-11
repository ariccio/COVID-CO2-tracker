require 'rails_helper'

RSpec.describe("Places", type: :request) do
  describe("create new place (POST api_v1_places_path)") do
    let (:my_home) {"ChIJbVog-MFYwokRDS9_fOijV2U"}
    let (:new_place_params) {{place: {google_place_id: my_home}}}
    let (:invalid_place_params) {{place: {google_place_id: 'fartipelago'}}}
    let (:invalid_request_google_places) {{"status" => "INVALID_REQUEST"}}

    # https://dev.to/isalevine/intro-to-rspec-in-rails-part-2-improving-tests-with-let-and-context-241n
    context("success") do 
      it("creates a place for a new user") do
        # ChIJbVog-MFYwokRDS9_fOijV2U
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        check_no_error(response, created_place, :created)

        # pp api_v1_place_path(created_place["place_id"])
        get(api_v1_place_path(created_place["place_id"]))
        fetched_new_place_response = json_response
        # pp json_response
        check_no_error(response, json_response, :ok)
        # expect(fetched_new_place_response["id"]).to(eq(1))
        expect(fetched_new_place_response["google_place_id"]).to(eq("ChIJbVog-MFYwokRDS9_fOijV2U"))
        expect(fetched_new_place_response["place_lat"]).to(eq("40.766653"))
        expect(fetched_new_place_response["place_lng"]).to(eq("-73.958756"))

      end
    end

    context("invalid place - failure") do 
      it("fails to create a nonsense place") do
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: invalid_place_params)

        # pp response
        # pp json_response["errors"][0]["error"]
        # parsed = JSON.parse(json_response["errors"][0]["error"][0])
        # expect(parsed).to(include({"status" => "INVALID_REQUEST"}))
        formatted_error_check_with_json(response, json_response, :bad_request, "backend invalid request to google places", invalid_request_google_places)
      end
      it("Fails to duplicate") do
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        check_no_error(response, created_place, :created)
       
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        formatted_error_check(response, json_response, :bad_request, "place already created! Did you click twice?", nil)
        # check_no_error(response, created_place, :created)

      end
    end
  end
end
