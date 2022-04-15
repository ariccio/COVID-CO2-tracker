require 'rails_helper'

RSpec.describe "Users", type: :request do
  # describe "GET /index" do
  #   pending "add some examples (or delete) #{__FILE__}"
  # end

  describe "create users (via auth)" do
    let(:new_user) {{user: {email: Faker::Internet.safe_email, name: Faker::Name.name, sub: Faker::Alphanumeric.alpha(number: 5), email_verified: true}}}
    before { post('/api/v1/auth', params: new_user)}
    it "creates a new user" do
      # pp response
      # byebug
      # pp json_response
      # pp new_user
      expect(json_response['email']).to eq(new_user[:user][:email])
    end
  end
end
