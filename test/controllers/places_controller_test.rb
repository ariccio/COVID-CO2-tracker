# frozen_string_literal: true

require 'test_helper'

class PlacesControllerTest < ::ActionDispatch::IntegrationTest
  setup do
    @place = places(:one)
  end

  # test 'should get index' do
  #   get places_url, as: :json
  #   assert_response :success
  # end

  # test 'should create place' do
  #   assert_difference('Place.count') do
  #     post places_url, params: { place: { google_place_id: @place.google_place_id, last_fetched: @place.last_fetched } }, as: :json
  #   end

  #   assert_response 201
  # end

end
