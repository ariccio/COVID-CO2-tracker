require "test_helper"

class Api::V1::PlacesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @api_v1_place = api_v1_places(:one)
  end

  test "should get index" do
    get api_v1_places_url, as: :json
    assert_response :success
  end

  test "should create api_v1_place" do
    assert_difference('Api::V1::Place.count') do
      post api_v1_places_url, params: { api_v1_place: { google_place_id: @api_v1_place.google_place_id, last_fetched: @api_v1_place.last_fetched } }, as: :json
    end

    assert_response 201
  end

  test "should show api_v1_place" do
    get api_v1_place_url(@api_v1_place), as: :json
    assert_response :success
  end

  test "should update api_v1_place" do
    patch api_v1_place_url(@api_v1_place), params: { api_v1_place: { google_place_id: @api_v1_place.google_place_id, last_fetched: @api_v1_place.last_fetched } }, as: :json
    assert_response 200
  end

  test "should destroy api_v1_place" do
    assert_difference('Api::V1::Place.count', -1) do
      delete api_v1_place_url(@api_v1_place), as: :json
    end

    assert_response 204
  end
end
