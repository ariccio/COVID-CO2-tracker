# frozen_string_literal: true

FactoryBot.define do
  factory :measurement do
    association :device
    association :sub_location
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
    association :user
    association :model
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
    association :place
    description { ['Conference Room', 'Lobby', 'Cafeteria', 'Office', 'Meeting Room'].sample }

    trait :with_measurements do
      after(:create) do |sub_location|
        create_list(:measurement, 10, sub_location:)
      end
    end
  end

  factory :model do
    association :manufacturer
    name { ['Aranet4', 'CO2Mini', 'Temtop M2000', 'AirThings Wave'].sample }
  end

  factory :manufacturer do
    name { ['Aranet', 'CO2Meter', 'Temtop', 'AirThings'].sample }
  end
end