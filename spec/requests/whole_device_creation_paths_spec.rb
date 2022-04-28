require 'rails_helper'

RSpec.describe "WholeDeviceCreationPaths", type: :request do
  describe "GET /whole_device_creation_paths" do
    it "works! (now write some real specs)" do
      get whole_device_creation_paths_path
      expect(response).to have_http_status(200)
    end
  end
end
