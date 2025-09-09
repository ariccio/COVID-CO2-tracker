# frozen_string_literal: true

FactoryBot.define do
  factory :measurement do
    device
    sub_location
    co2ppm { rand(400..2000) }
    measurementtime { Time.current }
    crowding { rand(1..5) }

    trait :realtime do
      after(:create) do |measurement|
        measurement.update_column(:created_at, measurement.measurementtime)
      end
    end

    trait :high_co2 do
      co2ppm { rand(1500..3000) }
    end

    trait :low_co2 do
      co2ppm { rand(400..600) }
    end
  end

  factory :device do
    user
    model
    serial { "DEVICE_#{SecureRandom.hex(4).upcase}" }

    trait :with_measurements do
      after(:create) do |device|
        create_list(:measurement, 5, device:)
      end
    end
  end

  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { Faker::Name.name }
    sequence(:sub_google_uid) { |n| "google_uid_#{n}_#{SecureRandom.hex(8)}" }

    trait :with_devices do
      after(:create) do |user|
        create_list(:device, 2, user:)
      end
    end
  end

  factory :place do
    sequence(:google_place_id) { |n| "ChIJ_test_place_#{n}" }
    place_lat { Faker::Address.latitude }
    place_lng { Faker::Address.longitude }
    last_fetched { Time.current }

    trait :new_york do
      place_lat { 40.7128 }
      place_lng { -74.0060 }
      google_place_id { 'ChIJOwg_06VPwokRYv534QaPC8g' }
    end
  end

  factory :sub_location do
    place
    description { ['Conference Room', 'Lobby', 'Cafeteria', 'Office', 'Meeting Room'].sample }

    trait :with_measurements do
      after(:create) do |sub_location|
        create_list(:measurement, 10, sub_location:)
      end
    end
  end

  factory :model do
    manufacturer
    sequence(:name) { |n| "Model_#{n}" }
  end

  factory :manufacturer do
    sequence(:name) { |n| "Manufacturer_#{n}" }
  end

  factory :export_token do
    sequence(:description) { |n| "Export Token #{n}" }
    expires_at { 10.years.from_now }
    created_by { 'test@example.com' }
    
    # Transient attributes for testing
    transient do
      generate_raw_token { false }
    end

    trait :with_raw_token do
      generate_raw_token { true }
    end

    trait :expired do
      expires_at { 1.day.ago }
      skip_expiration_validation { true }
    end

    trait :expiring_soon do
      expires_at { 1.hour.from_now }
    end

    trait :revoked do
      revoked_at { Time.current }
      revocation_reason { 'Test revocation' }
    end

    trait :with_custom_permissions do
      permissions do
        {
          'max_records' => 50_000,
          'rate_limit_per_hour' => 100,
          'formats' => %w[csv json]
        }
      end
    end

    trait :limited_formats do
      permissions do
        {
          'formats' => ['csv']
        }
      end
    end

    trait :high_rate_limit do
      permissions do
        {
          'rate_limit_per_hour' => 1000
        }
      end
    end

    trait :used do
      usage_count { rand(1..100) }
      last_used_at { rand(1..30).days.ago }
    end

    after(:build) do |token, evaluator|
      if evaluator.generate_raw_token
        # Simulate token generation for testing
        raw_token = SecureRandom.urlsafe_base64(32)
        token.raw_token = raw_token
        token.token_hash = Digest::SHA256.hexdigest(raw_token)
      end
    end

    after(:create) do |token, evaluator|
      if evaluator.generate_raw_token && token.token_hash.blank?
        # Ensure token hash is set
        raw_token = SecureRandom.urlsafe_base64(32)
        token.raw_token = raw_token
        token.update_column(:token_hash, Digest::SHA256.hexdigest(raw_token))
      end
    end
  end
end