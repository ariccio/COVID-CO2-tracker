require 'rails_helper'

RSpec.describe "Places", type: :request do
  describe "GET /index" do
    let (:my_home) {"ChIJbVog-MFYwokRDS9_fOijV2U"}
    let (:new_place_params) {{place: {google_place_id: my_home}}}
    let (:invalid_place_params) {{place: {google_place_id: 'fartipelago'}}}

    # https://dev.to/isalevine/intro-to-rspec-in-rails-part-2-improving-tests-with-let-and-context-241n
    context "success" do 
      it "creates a place for a new user" do
        # ChIJbVog-MFYwokRDS9_fOijV2U
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: new_place_params)
        # pp json_response
        created_place = json_response
        get("#{api_v1_places_path}/#{created_place["place_id"]}")
        # pp json_response
      end
    end

    context "invalid place - failure" do 
      it "fails to create a nonsense place" do
        user_headers = new_valid_empty_user_req
        post(api_v1_places_path, headers: user_headers, params: invalid_place_params)
        # expect(response).to(have_http_status(:bad_request))
        # pp json_response
        # expect(json_response).to(include("errors"))
        # expect(json_response["errors"][0]).to(include("message"))
        # expect(json_response["errors"][0]["message"]).to(eq(["backend invalid request to google places"]))
        # expect(json_response["errors"][0]).to(include("error"))

        formatted_error_check(response, json_response, :bad_request, "backend invalid request to google places")
      end
    end
  end
end
