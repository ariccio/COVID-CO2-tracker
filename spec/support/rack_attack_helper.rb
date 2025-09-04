# frozen_string_literal: true

# Helper module for tests that need to enable Rack::Attack
# By default, Rack::Attack is disabled in test environment to prevent interference
# Use this helper when you specifically need to test rate limiting functionality
module RackAttackHelper
  # Enable Rack::Attack for specific tests that need to verify rate limiting
  def enable_rack_attack!
    # Store original state
    @rack_attack_was_enabled = Rack::Attack.enabled
    @original_cache_store = Rails.cache

    # Set up a memory store for rate limiting tests (null_store doesn't work for rate limiting)
    Rails.configuration.cache_store = :memory_store
    Rails.cache = ActiveSupport::Cache::MemoryStore.new

    # Enable Rack::Attack (configuration is already done in initializer)
    Rack::Attack.enabled = true
  end

  # Disable Rack::Attack after rate limiting tests
  def disable_rack_attack!
    Rack::Attack.enabled = @rack_attack_was_enabled || false

    # Restore original cache store
    if @original_cache_store
      Rails.cache = @original_cache_store
      Rails.configuration.cache_store = :null_store if Rails.env.test?
    end

    reset_rack_attack_cache!
  end

  # Reset Rack::Attack cache between examples
  def reset_rack_attack_cache!
    Rails.cache.clear if defined?(Rails.cache)
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end
end

# Make the helper available in RSpec
RSpec.configure do |config|
  config.include RackAttackHelper

  # Ensure Rack::Attack is disabled by default in all tests
  config.before(:suite) do
    Rack::Attack.enabled = false
  end

  # Clean up after tests that use Rack::Attack
  config.after(:each, :rack_attack) do
    disable_rack_attack!
    reset_rack_attack_cache!
  end
end