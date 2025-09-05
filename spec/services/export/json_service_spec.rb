# frozen_string_literal: true

require 'rails_helper'

RSpec.describe(Export::JsonService) do
  let(:user) { create(:user, name: 'Test User') }
  let(:device) { create(:device, user:, serial: 'TEST123') }
  let!(:manufacturer) { create(:manufacturer, name: 'Aranet') }
  let!(:model) { create(:model, name: 'Aranet4', manufacturer:) }
  let(:place) { create(:place, place_lat: 40.7128, place_lng: -74.0060, google_place_id: 'ChIJOwg_06VPwokRYv534QaPC8g') }
  let(:sub_location) { create(:sub_location, place:, description: 'Conference Room A') }

  before do
    device.update!(model:)
  end

  describe('#export') do
    subject(:service) { described_class.new(filters) }

    let!(:measurement1) do
      create(:measurement,
             device:,
             sub_location:,
             co2ppm: 800,
             measurementtime: Time.parse('2024-01-15 10:00:00 UTC'),
             crowding: 3)
    end

    before do
      # Create second measurement for testing multiple records
      create(:measurement,
             device:,
             sub_location:,
             co2ppm: 1200,
             measurementtime: Time.parse('2024-01-15 11:00:00 UTC'),
             crowding: 5)
    end


    context('with default fields') do
      let(:filters) { {} }

      it('exports JSON with default fields') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements']).to(be_an(Array))
        expect(parsed['measurements'].size).to(eq(2))

        first_measurement = parsed['measurements'].first
        expect(first_measurement.keys).to(match_array(%w[co2_ppm timestamp lat lng]))
        expect(first_measurement['co2_ppm']).to(eq(800))
        expect(first_measurement['timestamp']).to(eq('2024-01-15T10:00:00Z'))
      end

      it('includes metadata') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['metadata']).to(be_present)
        expect(parsed['metadata']['total_records']).to(eq(2))
        expect(parsed['metadata']['export_time']).to(be_present)
        expect(parsed['metadata']['filters']).to(eq({}))
      end
    end

    context('with all fields including user_name') do
      let(:filters) { { fields: Export::BaseService::ALLOWED_FIELDS } }

      it('includes all allowed fields') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        first_measurement = parsed['measurements'].first
        expect(first_measurement['measurement_id']).to(eq(measurement1.id))
        expect(first_measurement['co2_ppm']).to(eq(800))
        expect(first_measurement['timestamp']).to(eq('2024-01-15T10:00:00Z'))
        expect(first_measurement['crowding']).to(eq(3))
        expect(first_measurement['lat']).to(eq(40.7128))
        expect(first_measurement['lng']).to(eq(-74.0060))
        expect(first_measurement['place_name']).to(eq('Conference Room A'))
        expect(first_measurement['place_google_id']).to(eq('ChIJOwg_06VPwokRYv534QaPC8g'))
        expect(first_measurement['device_serial']).to(eq('TEST123'))
        expect(first_measurement['device_model']).to(eq('Aranet4'))
        expect(first_measurement['manufacturer']).to(eq('Aranet'))
        expect(first_measurement['is_realtime']).to(be(false))
        expect(first_measurement['user_name']).to(eq('Test User'))
      end
    end

    context('with date range filter') do
      let(:filters) { { from: '2024-01-15', to: '2024-01-15' } }

      before do
        create(:measurement,
               device:,
               sub_location:,
               co2ppm: 600,
               measurementtime: Time.parse('2024-01-16 10:00:00 UTC'))
      end

      it('filters measurements by date and includes filter in metadata') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements'].size).to(eq(2))
        expect(parsed['metadata']['filters']).to(include(
                                                   'from' => '2024-01-15',
                                                   'to' => '2024-01-15'
                                                 ))
      end
    end

    context('with CO2 threshold filters') do
      let(:filters) { { above_ppm: 700, below_ppm: 1000 } }

      it('filters by CO2 range') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements'].size).to(eq(1))
        expect(parsed['measurements'].first['co2_ppm']).to(eq(800))
        expect(parsed['metadata']['filters']).to(include(
                                                   'above_ppm' => 700,
                                                   'below_ppm' => 1000
                                                 ))
      end
    end

    context('with place filter') do
      let(:other_place) { create(:place, google_place_id: 'different_id') }
      let(:other_sub_location) { create(:sub_location, place: other_place) }
      let(:filters) { { place_id: place.google_place_id } }

      before do
        create(:measurement,
               device:,
               sub_location: other_sub_location,
               co2ppm: 900,
               measurementtime: Time.parse('2024-01-15 12:00:00 UTC'))
      end

      it('filters by place') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements'].size).to(eq(2))
        parsed['measurements'].each do |m|
          expect(m['place_google_id']).to(eq(place.google_place_id)) if m.key?('place_google_id')
        end
      end
    end

    context('with device filter') do
      let(:other_device) { create(:device, serial: 'OTHER123') }
      let(:filters) { { device_serial: 'TEST123' } }

      before do
        create(:measurement,
               device: other_device,
               sub_location:,
               co2ppm: 700,
               measurementtime: Time.parse('2024-01-15 09:00:00 UTC'))
      end

      it('filters by device serial') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements'].size).to(eq(2))
        expect(parsed['metadata']['filters']).to(include('device_serial' => 'TEST123'))
      end
    end

    context('error handling') do
      context('with invalid CO2 range') do
        let(:filters) { { above_ppm: 1000, below_ppm: 800 } }

        it('raises validation error') do
          expect { service.export }.to(raise_error(
                                         Export::BaseService::ExportError,
                                         "Invalid CO2 range: 'above_ppm' (1000) must be less than 'below_ppm' (800)"
                                       ))
        end
      end

      context('with invalid date format') do
        let(:filters) { { from: 'not-a-date' } }

        it('raises validation error') do
          expect { service.export }.to(raise_error(
                                         Export::BaseService::ExportError,
                                         'Invalid date format provided'
                                       ))
        end
      end
    end

    context('with empty results') do
      let(:filters) { { above_ppm: 10_000 } }

      it('returns empty measurements array') do
        json_data = service.export
        parsed = JSON.parse(json_data)

        expect(parsed['measurements']).to(eq([]))
        expect(parsed['metadata']['total_records']).to(eq(0))
      end
    end

    context('performance with large datasets') do
      before do
        50.times do |i|
          create(:measurement,
                 device:,
                 sub_location:,
                 co2ppm: 400 + (i * 20),
                 measurementtime: Time.parse('2024-01-15 10:00:00 UTC') + i.minutes)
        end
      end

      let(:filters) { { fields: Export::BaseService::ALLOWED_FIELDS } }

      it('handles large datasets efficiently') do
        expect { service.export }.not_to(raise_error)

        json_data = service.export
        parsed = JSON.parse(json_data)
        expect(parsed['measurements'].size).to(eq(52)) # 50 new + 2 original
      end
    end
  end
end