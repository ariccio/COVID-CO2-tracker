# frozen_string_literal: true

# Helper to handle secret_key_base for tests that mock production environment
module SecretKeyBaseHelper
  def with_production_environment
    original_env = Rails.env
    original_secret = Rails.application.secrets.secret_key_base
    
    # Set a test secret_key_base for production environment
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
    Rails.application.secrets.secret_key_base = 'test-secret-key-base-for-production-environment-testing-only'
    
    yield
  ensure
    allow(Rails).to receive(:env).and_return(original_env)
    Rails.application.secrets.secret_key_base = original_secret
  end
end

RSpec.configure do |config|
  config.include SecretKeyBaseHelper, type: :request
end