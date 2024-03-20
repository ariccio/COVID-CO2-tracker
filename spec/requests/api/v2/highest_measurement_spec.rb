require 'rails_helper'

RSpec.describe "Api::V2::HighestMeasurements", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/api/v2/highest_measurement/index"
      expect(response).to have_http_status(:success)
    end
  end

end
