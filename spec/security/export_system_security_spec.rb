require 'rails_helper'
require 'securerandom'

# Optional test dependencies - tests will skip if not available
begin
  require 'memory_profiler'
rescue LoadError
  # MemoryProfiler not available, some tests will be skipped
end

begin
  require 'timecop'
rescue LoadError
  # Timecop not available, some tests will be skipped
end

RSpec.describe 'Export System Security - Comprehensive Tests', type: :request do
  # Test helpers
  def create_test_token(options = {})
    ExportToken.create!(
      description: options[:description] || 'Test token',
      expires_at: options[:expires_at] || 1.day.from_now,
      permissions: options[:permissions] || { formats: ['csv', 'json', 'xml'] }
    )
  end

  def measure_memory_usage(&block)
    report = MemoryProfiler.report do
      yield
    end
    report.total_allocated_memsize
  end

  def simulate_client_disconnect
    allow_any_instance_of(ActionDispatch::Response::Buffer)
      .to receive(:write)
      .and_raise(IOError, 'Broken pipe')
  end

  def attempt_sql_injection(injection_string, endpoint: '/api/v1/exports', token:)
    get endpoint,
      params: { 
        format_type: 'csv',
        from: injection_string 
      },
      headers: { 'Authorization' => "Bearer #{token.raw_token}" }
  end

  # Setup test data
  before(:all) do
    # Create test measurements for export tests
    @place = Place.create!(
      google_place_id: 'ChIJtest123456789',
      place_lat: 40.7128,
      place_lng: -74.0060,
      last_fetched: Time.current
    )
    @manufacturer = Manufacturer.create!(name: 'Test Manufacturer')
    @model = Model.create!(name: 'Test Model', manufacturer: @manufacturer)
    @user = User.create!(
      email: 'test@example.com',
      name: 'Test User',
      sub_google_uid: 'test_google_uid_123456'
    )
    @device = Device.create!(serial: 'TEST123', model: @model, user: @user)
    @sub_location = SubLocation.create!(
      description: 'Test Room',
      place: @place
    )
    
    100.times do |i|
      Measurement.create!(
        co2ppm: 400 + (i * 10),
        device: @device,
        sub_location: @sub_location,
        measurementtime: i.days.ago,
        crowding: 1,
        created_at: i.days.ago
      )
    end
  end

  after(:all) do
    Measurement.destroy_all
    SubLocation.destroy_all
    Device.destroy_all
    User.destroy_all
    Model.destroy_all
    Manufacturer.destroy_all
    Place.destroy_all
  end

  describe '1. Token Security Tests' do
    context 'Token Hashing' do
      it 'never stores plaintext tokens in database' do
        token = create_test_token
        raw_token = token.raw_token
        
        # Check database directly
        result = ActiveRecord::Base.connection.execute(
          "SELECT * FROM export_tokens WHERE id = #{token.id}"
        ).first
        
        # Ensure no column contains the raw token
        result.values.each do |value|
          expect(value.to_s).not_to eq(raw_token) if value
        end
        
        # Verify hash is stored
        expect(result['token_hash']).to eq(Digest::SHA256.hexdigest(raw_token))
      end

      it 'uses constant-time comparison for token authentication' do
        token = create_test_token
        raw_token = token.raw_token
        
        # Create similar tokens to test timing attacks
        similar_token = raw_token[0..-2] + 'X'
        
        # Measure authentication times
        correct_times = []
        incorrect_times = []
        
        100.times do
          start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          ExportToken.authenticate(raw_token)
          correct_times << (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start)
          
          start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          ExportToken.authenticate(similar_token)
          incorrect_times << (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start)
        end
        
        # Times should be statistically similar (constant-time comparison)
        avg_correct = correct_times.sum / correct_times.size
        avg_incorrect = incorrect_times.sum / incorrect_times.size
        
        # Allow for some variance but should be within same order of magnitude
        ratio = avg_correct / avg_incorrect
        expect(ratio).to be_between(0.5, 2.0)
      end

      it 'generates cryptographically secure tokens' do
        tokens = 100.times.map { create_test_token.raw_token }
        
        # All tokens should be unique
        expect(tokens.uniq.size).to eq(100)
        
        # Tokens should have sufficient entropy (at least 32 bytes)
        tokens.each do |token|
          expect(token.length).to be >= 32
          # Should look random (no obvious patterns)
          expect(token).to match(/^[a-zA-Z0-9_-]+$/)
        end
      end

      it 'prevents token extraction through error messages' do
        token = create_test_token
        
        # Try various ways to extract token through errors
        get '/api/v1/exports',
          params: { format_type: 'invalid' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Error message should not contain token
        expect(response.body).not_to include(token.raw_token)
        expect(response.body).not_to include(token.token_hash)
      end
    end

    context 'Token Authentication' do
      it 'rejects tokens with timing manipulation' do
        token = create_test_token
        raw_token = token.raw_token
        
        # Manipulate token creation timestamp
        token.update_column(:created_at, 1.year.ago)
        
        # Should still authenticate if not expired
        authenticated = ExportToken.authenticate(raw_token)
        expect(authenticated).to eq(token)
        
        # But should reject if expired
        token.update_column(:expires_at, 1.hour.ago)
        authenticated = ExportToken.authenticate(raw_token)
        expect(authenticated).to be_nil
      end

      it 'prevents authentication bypass through null bytes' do
        token = create_test_token
        
        # Try null byte injection in token
        malicious_token = token.raw_token + "\x00admin"
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{malicious_token}" }
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe '2. SQL Injection Tests' do
    let(:token) { create_test_token }

    context 'Classic SQL Injection Attempts' do
      [
        "'; DROP TABLE measurements; --",
        "' OR '1'='1",
        "1; DELETE FROM places WHERE 1=1; --",
        "' UNION SELECT * FROM users --",
        "'; UPDATE export_tokens SET expires_at = '2099-01-01'; --",
        "1' AND (SELECT COUNT(*) FROM export_tokens) > 0 --",
        "%' OR '1'='1' --",
        "' OR 1=1 LIMIT 1 --",
        "'; EXEC xp_cmdshell('net user'); --",
        "' OR EXISTS(SELECT * FROM users WHERE admin = true) --"
      ].each do |injection|
        it "prevents injection: #{injection[0..50]}..." do
          attempt_sql_injection(injection, token: token)
          
          # Should not execute malicious SQL
          expect(response).to have_http_status(:unprocessable_entity)
          
          # Verify tables still exist and data is intact
          expect(Measurement.table_exists?).to be true
          expect(Place.table_exists?).to be true
          expect(ExportToken.table_exists?).to be true
          expect(Measurement.count).to eq(100)
        end
      end
    end

    context 'Advanced SQL Injection Vectors' do
      it 'prevents second-order SQL injection' do
        # Create a place with malicious name in ID
        malicious_place = Place.create!(
          google_place_id: "Test'; DROP TABLE measurements; --",
          place_lat: 40.7128,
          place_lng: -74.0060,
          last_fetched: Time.current
        )
        
        # Try to trigger injection through place filter
        query_builder = Export::QueryBuilder.new
        query = query_builder.build(filters: { place_id: malicious_place.id })
        
        # Should safely handle the malicious place name
        expect { query.count }.not_to raise_error
        expect(Measurement.table_exists?).to be true
      end

      it 'prevents time-based blind SQL injection' do
        start_time = Time.now
        
        # Attempt time-based injection
        injection = "1' AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END) --"
        attempt_sql_injection(injection, token: token)
        
        elapsed = Time.now - start_time
        
        # Should not execute sleep command
        expect(elapsed).to be < 2
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'prevents boolean-based blind SQL injection' do
        # Try to extract information through boolean conditions
        true_condition = "1' AND '1'='1"
        false_condition = "1' AND '1'='2"
        
        get '/api/v1/exports',
          params: { format_type: 'csv', place_id: true_condition },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        true_response = response.body
        
        get '/api/v1/exports',
          params: { format_type: 'csv', place_id: false_condition },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        false_response = response.body
        
        # Responses should be similar (both errors), not different based on condition
        expect(true_response).to eq(false_response)
      end

      it 'sanitizes all user-controllable parameters' do
        malicious_params = {
          format_type: 'csv',
          from: "2024-01-01'; --",
          to: "2024-12-31' OR '1'='1",
          place_id: "1 OR 1=1",
          device_id: "1; DROP TABLE devices; --",
          above_ppm: "500' UNION SELECT * FROM export_tokens --",
          below_ppm: "1000); DELETE FROM measurements; --",
          limit: "100; UPDATE users SET admin = true; --",
          offset: "0' OR '1'='1"
        }
        
        get '/api/v1/exports',
          params: malicious_params,
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Should safely handle all parameters
        expect(response).not_to have_http_status(:internal_server_error)
        
        # Verify no damage
        expect(Measurement.count).to eq(100)
        expect(Device.table_exists?).to be true
        expect(ExportToken.count).to be >= 1
      end
    end

    context 'ORM-Specific Injection Prevention' do
      it 'prevents ActiveRecord attribute injection' do
        # Try to inject through ActiveRecord attributes
        query_builder = Export::QueryBuilder.new
        
        malicious_filters = {
          'place_id' => { 'id' => 1, 'admin' => true },
          'measurements.created_at' => "2024-01-01'; DROP TABLE measurements; --"
        }
        
        # Should safely handle nested attributes
        query = query_builder.build(filters: malicious_filters)
        expect { query.count }.not_to raise_error
        expect(Measurement.table_exists?).to be true
      end

      it 'prevents mass assignment attacks' do
        # Attempt to modify token permissions through params
        get '/api/v1/exports',
          params: { 
            format_type: 'csv',
            'export_token[permissions]' => { admin: true },
            'export_token[expires_at]' => '2099-01-01'
          },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Token should not be modified
        token.reload
        expect(token.permissions['admin']).to be_nil
        expect(token.expires_at).to be < 2.days.from_now
      end
    end
  end

  describe '3. Rate Limiting Tests' do
    context 'Basic Rate Limiting' do
      it 'enforces per-hour rate limits' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 3 }
        )
        
        Rails.cache.clear
        
        # First 3 requests should succeed
        3.times do |i|
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          
          expect(response).to have_http_status(:success), 
            "Request #{i+1} should succeed"
        end
        
        # 4th request should be rate limited
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        expect(response).to have_http_status(:too_many_requests)
        expect(response.body).to include('Rate limit exceeded')
      end

      it 'provides accurate rate limit headers' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 10 }
        )
        
        Rails.cache.clear
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        expect(response.headers['X-RateLimit-Limit']).to eq('10')
        expect(response.headers['X-RateLimit-Remaining']).to eq('9')
        expect(response.headers['X-RateLimit-Reset']).to be_present
      end
    end

    context 'Rate Limit Bypass Prevention' do
      it 'prevents bypass through token casing variations' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        
        Rails.cache.clear
        
        # Use limit with normal casing
        2.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          expect(response).to have_http_status(:success)
        end
        
        # Try bypass with different casing
        variations = [
          "bearer #{token.raw_token}",
          "BEARER #{token.raw_token}",
          "Bearer  #{token.raw_token}", # Extra space
          "Bearer\t#{token.raw_token}"  # Tab character
        ]
        
        variations.each do |auth_header|
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => auth_header }
          
          expect(response).to have_http_status(:too_many_requests),
            "Should be rate limited with header: #{auth_header}"
        end
      end

      it 'prevents bypass through parameter manipulation' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        
        Rails.cache.clear
        
        # Use limit
        2.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          expect(response).to have_http_status(:success)
        end
        
        # Try bypass with different parameters (should still count)
        get '/api/v1/exports',
          params: { format_type: 'csv', extra: 'param' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        expect(response).to have_http_status(:too_many_requests)
        
        # Try different format (should still count against same limit)
        get '/api/v1/exports',
          params: { format_type: 'json' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        expect(response).to have_http_status(:too_many_requests)
      end

      it 'maintains separate limits for different tokens' do
        token1 = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        token2 = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        
        Rails.cache.clear
        
        # Use token1's limit
        2.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token1.raw_token}" }
          expect(response).to have_http_status(:success)
        end
        
        # Token1 should be rate limited
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token1.raw_token}" }
        expect(response).to have_http_status(:too_many_requests)
        
        # Token2 should still work
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token2.raw_token}" }
        expect(response).to have_http_status(:success)
      end

      it 'properly resets rate limits after time window' do
        skip "Timecop gem required for time travel tests" unless defined?(Timecop)
        
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        
        Rails.cache.clear
        
        # Use limit
        2.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        # Should be rate limited
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        expect(response).to have_http_status(:too_many_requests)
        
        # Simulate time passing (clear cache to reset)
        Timecop.travel(1.hour.from_now) do
          Rails.cache.clear # Simulate cache expiry
          
          # Should work again
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          expect(response).to have_http_status(:success)
        end
      end
    end

    context 'Burst Protection' do
      it 'handles rapid burst requests gracefully' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 100 }
        )
        
        Rails.cache.clear
        responses = []
        
        # Send 20 requests as fast as possible
        20.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          responses << response.status
        end
        
        # All should succeed since under limit
        expect(responses).to all(eq(200))
        
        # But further requests beyond limit should fail
        81.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        expect(response).to have_http_status(:too_many_requests)
      end
    end
  end

  describe '4. Memory Leak Tests' do
    let(:token) { create_test_token }

    context 'Stream Cleanup' do
      it 'closes streams on client disconnect' do
        # Track open streams
        open_streams = []
        
        allow_any_instance_of(ActionDispatch::Response::Buffer) do |buffer|
          allow(buffer).to receive(:write) do |data|
            open_streams << buffer
            raise IOError, 'Client disconnected'
          end
          
          allow(buffer).to receive(:close) do
            open_streams.delete(buffer)
          end
        end
        
        # Make request that will disconnect
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Streams should be closed
        expect(open_streams).to be_empty
      end

      it 'cleans up temporary files on error' do
        temp_files_before = Dir.glob('/tmp/export_*.tmp').size
        
        # Simulate error during export
        allow_any_instance_of(Export::CsvService)
          .to receive(:generate_row)
          .and_raise(StandardError, 'Export error')
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        temp_files_after = Dir.glob('/tmp/export_*.tmp').size
        
        # No temporary files should be left
        expect(temp_files_after).to eq(temp_files_before)
      end

      it 'releases database connections on error' do
        initial_connections = ActiveRecord::Base.connection_pool.connections.size
        
        # Simulate error during streaming
        simulate_client_disconnect
        
        5.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        # Force garbage collection
        GC.start
        
        final_connections = ActiveRecord::Base.connection_pool.connections.size
        
        # Should not leak connections
        expect(final_connections).to be <= initial_connections + 1
      end
    end

    context 'Memory Usage' do
      it 'maintains stable memory usage during large exports' do
        skip "Memory profiler gem required" unless defined?(MemoryProfiler)
        
        # Measure baseline memory
        baseline = measure_memory_usage { "test" * 1000 }
        
        # Create large dataset
        1000.times do
          Measurement.create!(
            co2ppm: rand(400..2000),
            device: @device,
            sub_location: @sub_location,
            measurementtime: Time.current,
            crowding: rand(1..5)
          )
        end
        
        # Measure export memory usage
        export_memory = measure_memory_usage do
          service = Export::StreamingCsvService.new
          buffer = StringIO.new
          
          service.generate_csv(
            measurements: Measurement.all,
            stream: buffer
          )
        end
        
        # Memory usage should be reasonable (not loading everything at once)
        # Streaming should use less than 10MB for 1000 records
        expect(export_memory).to be < 10_000_000
        
        # Cleanup
        Measurement.where('co2ppm > 2000 OR co2ppm < 400').destroy_all
      end

      it 'handles memory pressure gracefully' do
        # Simulate low memory condition
        allow(GC).to receive(:start)
        
        # Should trigger GC when needed
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        expect(GC).to have_received(:start).at_least(:once)
      end
    end

    context 'Resource Limits' do
      it 'enforces maximum export size limits' do
        # Create token with size limit
        limited_token = create_test_token(
          permissions: { 
            formats: ['csv'],
            max_export_rows: 50
          }
        )
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{limited_token.raw_token}" }
        
        # Count rows in CSV response
        csv_rows = response.body.split("\n").size - 1 # Minus header
        expect(csv_rows).to be <= 50
      end

      it 'prevents infinite loops in streaming' do
        # Mock infinite data source
        infinite_enum = Enumerator.new do |y|
          loop { y << Measurement.first }
        end
        
        allow_any_instance_of(Export::QueryBuilder)
          .to receive(:build)
          .and_return(infinite_enum)
        
        # Should timeout or limit results
        Timeout::timeout(5) do
          get '/api/v1/exports',
            params: { format_type: 'csv', limit: 100 },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe '5. CORS Tests' do
    let(:token) { create_test_token }

    context 'Origin Validation' do
      before do
        # Set production environment
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com,https://admin.example.com'
      end

      after do
        ENV.delete('ALLOWED_ORIGINS')
      end

      it 'blocks requests from unauthorized origins' do
        unauthorized_origins = [
          'https://evil.com',
          'http://app.example.com', # Wrong protocol
          'https://app.example.com.evil.com', # Subdomain attack
          'https://app.example.co', # Similar domain
          'null', # Null origin attack
          'file://' # File protocol
        ]
        
        unauthorized_origins.each do |origin|
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => origin
            }
          
          expect(response.headers['Access-Control-Allow-Origin']).to be_nil,
            "Should block origin: #{origin}"
        end
      end

      it 'allows requests from whitelisted origins' do
        ['https://app.example.com', 'https://admin.example.com'].each do |origin|
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => origin
            }
          
          expect(response.headers['Access-Control-Allow-Origin']).to eq(origin)
          expect(response.headers['Access-Control-Allow-Credentials']).to eq('true')
        end
      end

      it 'handles preflight requests correctly' do
        options '/api/v1/exports',
          headers: { 
            'Origin' => 'https://app.example.com',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization'
          }
        
        expect(response).to have_http_status(:ok)
        expect(response.headers['Access-Control-Allow-Origin']).to eq('https://app.example.com')
        expect(response.headers['Access-Control-Allow-Methods']).to include('GET')
        expect(response.headers['Access-Control-Allow-Headers']).to include('Authorization')
        expect(response.headers['Access-Control-Max-Age']).to be_present
      end

      it 'prevents CORS bypass through header injection' do
        # Try to inject additional origins
        malicious_origins = [
          "https://app.example.com\r\nAccess-Control-Allow-Origin: https://evil.com",
          "https://app.example.com https://evil.com",
          "*"
        ]
        
        malicious_origins.each do |origin|
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 
              'Authorization' => "Bearer #{token.raw_token}",
              'Origin' => origin
            }
          
          # Should not allow the malicious origin
          allow_origin = response.headers['Access-Control-Allow-Origin']
          expect(allow_origin).not_to include('evil.com') if allow_origin
          expect(allow_origin).not_to eq('*') if allow_origin
        end
      end
    end

    context 'Credentials and Methods' do
      it 'sets secure CORS headers' do
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com'
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'https://app.example.com'
          }
        
        # Check all security headers
        expect(response.headers['Access-Control-Allow-Credentials']).to eq('true')
        expect(response.headers['Access-Control-Allow-Methods']).not_to include('DELETE')
        expect(response.headers['Access-Control-Allow-Methods']).not_to include('PUT')
        expect(response.headers['Vary']).to include('Origin')
        
        ENV.delete('ALLOWED_ORIGINS')
      end

      it 'restricts allowed headers' do
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com'
        
        options '/api/v1/exports',
          headers: { 
            'Origin' => 'https://app.example.com',
            'Access-Control-Request-Headers' => 'X-Custom-Header,Authorization'
          }
        
        allowed_headers = response.headers['Access-Control-Allow-Headers']
        expect(allowed_headers).to include('Authorization')
        expect(allowed_headers).to include('Content-Type')
        # Should not blindly accept all requested headers
        expect(allowed_headers).not_to include('X-Custom-Header')
        
        ENV.delete('ALLOWED_ORIGINS')
      end
    end

    context 'Development vs Production' do
      it 'allows localhost in development only' do
        # Development mode
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('development'))
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'http://localhost:3000'
          }
        
        expect(response.headers['Access-Control-Allow-Origin']).to eq('http://localhost:3000')
        
        # Production mode
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com'
        
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'http://localhost:3000'
          }
        
        expect(response.headers['Access-Control-Allow-Origin']).to be_nil
        
        ENV.delete('ALLOWED_ORIGINS')
      end
    end
  end

  describe '6. Integration Security Tests' do
    context 'Combined Attack Vectors' do
      it 'handles SQL injection with rate limit bypass attempt' do
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 2 }
        )
        
        Rails.cache.clear
        
        # Use rate limit with SQL injection attempts
        2.times do
          attempt_sql_injection("'; DROP TABLE measurements; --", token: token)
          expect(response).to have_http_status(:unprocessable_entity)
        end
        
        # Should still be rate limited even with different injection
        attempt_sql_injection("' OR '1'='1", token: token)
        expect(response).to have_http_status(:too_many_requests)
        
        # Tables should still exist
        expect(Measurement.table_exists?).to be true
      end

      it 'prevents authentication bypass with CORS exploitation' do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com'
        
        # Try to bypass auth using CORS preflight
        options '/api/v1/exports',
          headers: { 
            'Origin' => 'https://evil.com',
            'Access-Control-Request-Method' => 'GET'
          }
        
        # Preflight should succeed but not expose sensitive data
        expect(response).to have_http_status(:ok)
        expect(response.body).to be_empty
        
        # Actual request without auth should fail
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Origin' => 'https://evil.com' }
        
        expect(response).to have_http_status(:unauthorized)
        expect(response.headers['Access-Control-Allow-Origin']).to be_nil
        
        ENV.delete('ALLOWED_ORIGINS')
      end

      it 'handles memory exhaustion with rate limiting' do
        token = create_test_token(
          permissions: { 
            formats: ['csv'],
            rate_limit_per_hour: 5,
            max_export_rows: 1000000  # Large limit
          }
        )
        
        Rails.cache.clear
        
        # Try to exhaust memory through multiple large requests
        5.times do
          get '/api/v1/exports',
            params: { format_type: 'csv', limit: 1000000 },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        # Should be rate limited before memory exhaustion
        get '/api/v1/exports',
          params: { format_type: 'csv', limit: 1000000 },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        expect(response).to have_http_status(:too_many_requests)
      end
    end

    context 'Production-Like Security Scenarios' do
      it 'handles distributed attack attempts' do
        # Simulate multiple tokens from same source
        tokens = 5.times.map { create_test_token }
        
        # Each token tries SQL injection
        tokens.each do |token|
          attempt_sql_injection("'; DROP TABLE measurements; --", token: token)
        end
        
        # System should remain stable
        expect(Measurement.table_exists?).to be true
        expect(ExportToken.count).to eq(tokens.size)
      end

      it 'maintains security during high load' do
        token = create_test_token
        
        # Simulate concurrent requests
        threads = 10.times.map do
          Thread.new do
            get '/api/v1/exports',
              params: { format_type: 'csv' },
              headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          end
        end
        
        threads.each(&:join)
        
        # System should handle load gracefully
        expect(Measurement.count).to eq(100)
        expect(ExportToken.find(token.id)).to be_present
      end

      it 'prevents privilege escalation through chained exploits' do
        # Create limited token
        limited_token = create_test_token(
          permissions: { formats: ['csv'], read_only: true }
        )
        
        # Try various escalation attempts
        escalation_attempts = [
          { 'permissions[admin]' => 'true' },
          { 'permissions[formats][]' => 'admin' },
          { 'export_token[role]' => 'admin' },
          { '_method' => 'PUT', 'token[admin]' => 'true' }
        ]
        
        escalation_attempts.each do |params|
          get '/api/v1/exports',
            params: params.merge(format_type: 'csv'),
            headers: { 'Authorization' => "Bearer #{limited_token.raw_token}" }
          
          # Token permissions should not change
          limited_token.reload
          expect(limited_token.permissions['admin']).to be_nil
          expect(limited_token.permissions['formats']).to eq(['csv'])
        end
      end

      it 'logs security events for monitoring' do
        token = create_test_token
        
        # Clear existing logs
        Rails.logger = Logger.new(StringIO.new)
        log_output = StringIO.new
        Rails.logger = Logger.new(log_output)
        
        # Trigger various security events
        attempt_sql_injection("'; DROP TABLE measurements; --", token: token)
        
        # Check logs for security events
        log_content = log_output.string
        expect(log_content).to include('Invalid date format')
        
        # Rate limit violation
        token = create_test_token(
          permissions: { formats: ['csv'], rate_limit_per_hour: 1 }
        )
        Rails.cache.clear
        
        2.times do
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        end
        
        log_content = log_output.string
        expect(log_content).to include('Rate limit exceeded')
      end
    end

    context 'Recovery and Resilience' do
      it 'recovers from partial failures gracefully' do
        token = create_test_token
        
        # Simulate database connection issues
        allow(ActiveRecord::Base.connection)
          .to receive(:execute)
          .and_raise(ActiveRecord::StatementInvalid)
          .once
        
        # First request fails
        expect {
          get '/api/v1/exports',
            params: { format_type: 'csv' },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        }.to raise_error(ActiveRecord::StatementInvalid)
        
        # System should recover
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        expect(response).to have_http_status(:success)
      end

      it 'maintains data integrity under attack' do
        initial_count = Measurement.count
        initial_tokens = ExportToken.count
        
        token = create_test_token
        
        # Attempt various attacks
        attacks = [
          "'; DELETE FROM measurements; --",
          "' OR '1'='1",
          "'; UPDATE export_tokens SET expires_at = '2099-01-01'; --"
        ]
        
        attacks.each do |attack|
          attempt_sql_injection(attack, token: token)
        end
        
        # Simulate memory pressure
        simulate_client_disconnect
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Data should remain intact
        expect(Measurement.count).to eq(initial_count)
        expect(ExportToken.count).to eq(initial_tokens)
        
        # Token should not be modified
        token.reload
        expect(token.expires_at).to be < 2.days.from_now
      end
    end
  end

  describe 'Additional Security Hardening Tests' do
    let(:token) { create_test_token }

    context 'Input Validation' do
      it 'validates all date inputs strictly' do
        invalid_dates = [
          '2024-13-01',  # Invalid month
          '2024-01-32',  # Invalid day
          '2024/01/01',  # Wrong format
          '01-01-2024',  # Wrong order
          'yesterday',   # Text
          '1234567890',  # Unix timestamp
          '2024-01-01T00:00:00Z; DROP TABLE--'  # With injection
        ]
        
        invalid_dates.each do |date|
          get '/api/v1/exports',
            params: { format_type: 'csv', from: date },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          
          expect(response).to have_http_status(:unprocessable_entity)
          expect(response.body).to include('Invalid date format')
        end
      end

      it 'enforces maximum parameter lengths' do
        # Very long parameter to test truncation/rejection
        long_param = 'a' * 10000
        
        get '/api/v1/exports',
          params: { 
            format_type: 'csv',
            description: long_param 
          },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Should handle gracefully
        expect(response).not_to have_http_status(:internal_server_error)
      end

      it 'sanitizes file format parameter' do
        dangerous_formats = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32\\config\\sam',
          'csv; cat /etc/passwd',
          'csv\x00.txt',  # Null byte
          'csv%00.txt',   # URL encoded null
          '../../../../../../../../etc/passwd%00.csv'
        ]
        
        dangerous_formats.each do |format|
          get '/api/v1/exports',
            params: { format_type: format },
            headers: { 'Authorization' => "Bearer #{token.raw_token}" }
          
          expect(response).to have_http_status(:bad_request)
          expect(response.body).to include('Unsupported format')
        end
      end
    end

    context 'Cryptographic Security' do
      it 'uses secure random for token generation' do
        # Verify SecureRandom is used
        allow(SecureRandom).to receive(:hex).and_call_original
        
        token = create_test_token
        expect(SecureRandom).to have_received(:hex)
        
        # Token should have sufficient entropy
        entropy = token.raw_token.each_char.map(&:ord).sum
        expect(entropy).to be > 1000  # High entropy value
      end

      it 'prevents timing attacks on token comparison' do
        token = create_test_token
        valid_token = token.raw_token
        
        # Create tokens with increasing similarity
        test_tokens = [
          'completely_wrong_token',
          valid_token[0..10] + 'wrong',
          valid_token[0..-2] + 'X',
          valid_token
        ]
        
        times = test_tokens.map do |test_token|
          start = Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond)
          ExportToken.authenticate(test_token)
          Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond) - start
        end
        
        # Times should not correlate with similarity (constant-time comparison)
        # Calculate variance - should be relatively small
        mean = times.sum.to_f / times.size
        variance = times.map { |t| (t - mean) ** 2 }.sum / times.size
        std_dev = Math.sqrt(variance)
        
        # Standard deviation should be small relative to mean (< 50%)
        expect(std_dev / mean).to be < 0.5
      end
    end

    context 'Session Security' do
      it 'prevents session fixation attacks' do
        # Export tokens should not rely on session
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Cookie' => 'session_id=attacker_session'
          }
        
        # Should not create or modify session
        expect(response.cookies['session_id']).to be_nil
      end

      it 'does not leak tokens in logs' do
        # Configure test logger
        log_output = StringIO.new
        Rails.logger = Logger.new(log_output)
        
        # Make request with token
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        
        # Check logs don't contain token
        log_content = log_output.string
        expect(log_content).not_to include(token.raw_token)
        expect(log_content).not_to include(token.token_hash)
      end
    end
  end
end