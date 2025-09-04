# frozen_string_literal: true

# Helper to handle secret_key_base for tests that mock production environment
module SecretKeyBaseHelper
  def with_production_environment
    original_env = Rails.env

    # Set a test secret_key_base for production environment
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
    # Mock credentials to avoid the deprecation warning
    allow(Rails.application.credentials).to receive(:secret_key_base)
      .and_return('test-secret-key-base-for-production-environment-testing-only')

    yield
  ensure
    allow(Rails).to receive(:env).and_return(original_env)
    # Reset the mock
    allow(Rails.application.credentials).to receive(:secret_key_base).and_call_original
  end
end

RSpec.configure do |config|
  config.include SecretKeyBaseHelper, type: :request
end