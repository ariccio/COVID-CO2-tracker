require 'rails_helper'

RSpec.describe 'Export Security', type: :request do
  describe 'Token Security' do
    it 'never stores tokens in plaintext' do
      token = ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
      
      # The raw token should only be available in memory after creation
      expect(token.raw_token).to be_present
      expect(token.raw_token.length).to be >= 32
      
      # Token should not be stored in plaintext in database
      db_token = ExportToken.find(token.id)
      expect(db_token.respond_to?(:token)).to be false
      expect(db_token.token_hash).to be_present
      expect(db_token.token_hash).not_to eq(token.raw_token)
      expect(db_token.token_hash).to eq(Digest::SHA256.hexdigest(token.raw_token))
    end
    
    it 'authenticates using hashed tokens' do
      token = ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
      
      raw_token = token.raw_token
      
      # Should authenticate with raw token
      authenticated = ExportToken.authenticate(raw_token)
      expect(authenticated).to eq(token)
      
      # Should not authenticate with hash
      authenticated = ExportToken.authenticate(token.token_hash)
      expect(authenticated).to be_nil
      
      # Should not authenticate with wrong token
      authenticated = ExportToken.authenticate('wrong_token')
      expect(authenticated).to be_nil
    end
  end
  
  describe 'SQL Injection Prevention' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end
    
    it 'sanitizes date parameters against SQL injection' do
      # Attempt SQL injection in date parameter
      malicious_date = "2024-01-01'; DROP TABLE measurements; --"
      
      get '/api/v1/exports', 
        params: { 
          format_type: 'csv',
          from: malicious_date 
        },
        headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      
      # Should reject invalid date, not execute SQL
      expect(response).to have_http_status(:unprocessable_entity)
      expect(Measurement.table_exists?).to be true
    end
    
    it 'sanitizes PPM parameters against SQL injection' do
      # Attempt SQL injection in PPM parameter
      malicious_ppm = "1000 OR 1=1"
      
      query_builder = Export::QueryBuilder.new
      filters = { above_ppm: malicious_ppm }
      
      # Should convert to integer, preventing injection
      query = query_builder.build(filters: filters)
      expect(query.to_sql).to include('co2ppm > 1000')
      expect(query.to_sql).not_to include('1=1')
    end
    
    it 'sanitizes place_id against SQL injection' do
      # Attempt SQL injection in place_id
      malicious_id = "1 OR 1=1; DELETE FROM places"
      
      query_builder = Export::QueryBuilder.new
      filters = { place_id: malicious_id }
      
      # Should convert to integer, preventing injection
      query = query_builder.build(filters: filters)
      expect(query.to_sql).to include('places.id = 1')
      expect(query.to_sql).not_to include('DELETE')
    end
  end
  
  describe 'Rate Limiting Security' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { 
          formats: ['csv'],
          rate_limit_per_hour: 5
        }
      )
    end
    
    it 'uses secure unpredictable rate limiting keys' do
      key = token.rate_limit_key
      
      # Key should be based on token hash, not ID
      expect(key).not_to include(token.id.to_s)
      expect(key).to include('export_rate:')
      
      # Key should be unpredictable
      expect(key.length).to be > 50
    end
    
    it 'prevents rate limit bypass with token variations' do
      Rails.cache.clear
      
      # Make requests up to the limit
      5.times do
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
        expect(response).to have_http_status(:success)
      end
      
      # Next request should be rate limited
      get '/api/v1/exports',
        params: { format_type: 'csv' },
        headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      expect(response).to have_http_status(:too_many_requests)
      
      # Trying with token variations should still be rate limited
      # (using same token with different casing/spacing)
      get '/api/v1/exports',
        params: { format_type: 'csv' },
        headers: { 'Authorization' => "bearer #{token.raw_token}" }
      expect(response).to have_http_status(:too_many_requests)
    end
  end
  
  describe 'Memory Leak Prevention' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end
    
    it 'handles client disconnects gracefully' do
      # Mock a client disconnect scenario
      allow_any_instance_of(ActionDispatch::Response::Buffer).to receive(:write).and_raise(IOError)
      
      expect {
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      }.not_to raise_error
      
      # Should log the disconnect
      expect(Rails.logger).to have_received(:warn).with(/Client disconnected/)
    end
    
    it 'cleans up resources in ensure block' do
      controller = Api::V1::ExportsController.new
      
      # Verify ensure block exists in stream_export method
      method_source = controller.method(:stream_export).source
      expect(method_source).to include('ensure')
      expect(method_source).to include('response.stream.close')
      expect(method_source).to include('zip_data.close') 
      expect(method_source).to include('GC.start')
    end
  end
  
  describe 'CORS Protection' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end
    
    context 'in production' do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        ENV['ALLOWED_ORIGINS'] = 'https://app.example.com,https://www.example.com'
      end
      
      after do
        ENV.delete('ALLOWED_ORIGINS')
      end
      
      it 'blocks requests from unauthorized origins' do
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'https://evil.com'
          }
        
        # Should not include CORS headers for unauthorized origin
        expect(response.headers['Access-Control-Allow-Origin']).to be_nil
      end
      
      it 'allows requests from authorized origins' do
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'https://app.example.com'
          }
        
        # Should include CORS headers for authorized origin
        expect(response.headers['Access-Control-Allow-Origin']).to eq('https://app.example.com')
      end
    end
    
    context 'in development' do
      it 'allows localhost origins' do
        get '/api/v1/exports',
          params: { format_type: 'csv' },
          headers: { 
            'Authorization' => "Bearer #{token.raw_token}",
            'Origin' => 'http://localhost:3000'
          }
        
        # Should allow localhost in development
        expect(response.headers['Access-Control-Allow-Origin']).to eq('http://localhost:3000')
      end
    end
  end
  
  describe 'Additional Security Measures' do
    let(:token) do
      ExportToken.create!(
        description: 'Test token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }
      )
    end
    
    it 'validates export format to prevent format injection' do
      # Attempt to use malicious format
      get '/api/v1/exports',
        params: { format_type: '../../../etc/passwd' },
        headers: { 'Authorization' => "Bearer #{token.raw_token}" }
      
      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include('Unsupported format')
    end
    
    it 'enforces token expiration' do
      expired_token = ExportToken.create!(
        description: 'Expired token',
        expires_at: 1.hour.ago,
        permissions: { formats: ['csv'] }
      )
      
      get '/api/v1/exports',
        params: { format_type: 'csv' },
        headers: { 'Authorization' => "Bearer #{expired_token.raw_token}" }
      
      expect(response).to have_http_status(:unauthorized)
    end
    
    it 'enforces format permissions' do
      restricted_token = ExportToken.create!(
        description: 'Restricted token',
        expires_at: 1.day.from_now,
        permissions: { formats: ['csv'] }  # Only CSV allowed
      )
      
      # Try to export JSON
      get '/api/v1/exports',
        params: { format_type: 'json' },
        headers: { 'Authorization' => "Bearer #{restricted_token.raw_token}" }
      
      expect(response).to have_http_status(:forbidden)
      expect(response.body).to include('Token not authorized for format')
    end
  end
end