require "test_helper"

class SubLocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @sub_location = sub_locations(:one)
  end

  test "should get index" do
    get sub_locations_url, as: :json
    assert_response :success
  end

  test "should create sub_location" do
    assert_difference('SubLocation.count') do
      post sub_locations_url, params: { sub_location: { description: @sub_location.description, place_id: @sub_location.place_id } }, as: :json
    end

    assert_response 201
  end

  test "should show sub_location" do
    get sub_location_url(@sub_location), as: :json
    assert_response :success
  end

  test "should update sub_location" do
    patch sub_location_url(@sub_location), params: { sub_location: { description: @sub_location.description, place_id: @sub_location.place_id } }, as: :json
    assert_response 200
  end

  test "should destroy sub_location" do
    assert_difference('SubLocation.count', -1) do
      delete sub_location_url(@sub_location), as: :json
    end

    assert_response 204
  end
end
