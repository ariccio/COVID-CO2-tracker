# Export Token Testing Script

## Overview
The `test-export-tokens.sh` script provides comprehensive testing of the export token system for the COVID CO2 Tracker application. It validates all aspects of token lifecycle and API access.

## Features Tested

### 1. Token Generation
- Generates tokens via `rails export:generate` rake task
- Verifies 10-year expiration (long-lived tokens)
- Confirms token appears in active tokens list

### 2. Authentication Methods
- **Bearer Authentication**: Tests tokens in Authorization header (currently implemented)
- **Query Parameter**: Tests tokens as URL parameters `?token=XXX` (notes implementation requirements)

### 3. Token Reusability
- Performs multiple API calls with same token
- Verifies tokens are not consumed after use
- Tracks usage count incrementation

### 4. Export Formats
- Tests CSV, JSON, and JSONL export formats
- Verifies data structure for each format
- Confirms no email data exposure (privacy protection)

### 5. Export Filters
- Date range filtering (`from` and `to` parameters)
- CO2 threshold filtering (`above_ppm` parameter)
- Custom field selection (`fields` parameter)

### 6. Token Expiration
- Verifies token is active
- Confirms 10-year expiration period
- Shows days remaining until expiration

### 7. Token Revocation
- Tests token revocation via `rails export:revoke`
- Verifies revoked tokens are rejected (HTTP 401)
- Confirms immediate effect of revocation

### 8. Rate Limiting
- Checks for rate limit headers
- Verifies rate limit enforcement (if configured)

### 9. Error Handling
- Invalid token rejection (HTTP 401)
- Missing authentication handling
- Invalid parameter validation

## Usage

### Basic Usage
```bash
# Run all tests with default settings
./scripts/test-export-tokens.sh

# Run with verbose output
./scripts/test-export-tokens.sh --verbose

# Test against custom server
./scripts/test-export-tokens.sh --base-url http://localhost:3001
```

### Environment Variables
```bash
# Set base URL
export BASE_URL=http://localhost:3000

# Enable verbose mode
export VERBOSE=true

# Set Rails environment
export RAILS_ENV=development
```

### Prerequisites
1. Rails server running locally
2. Database with test data
3. Bundle dependencies installed

## Test Output

### Success Example
```
✓ Token generated successfully
✓ Bearer authentication successful (HTTP 200)
✓ No email data found in export (privacy protected)
✓ Token is fully reusable - all 5 attempts succeeded
✓ CSV export successful
✓ JSON export successful
✓ JSONL export successful
✓ Token is long-lived (10-year expiration verified)
✓ Revoked token correctly denied (HTTP 401)

TEST RESULTS SUMMARY
  Total Tests: 25
  Passed: 25
  Failed: 0
  ✓ All tests passed successfully!
```

### Failure Indicators
- Red ✗ marks indicate failed tests
- HTTP status codes show actual vs expected
- Detailed error messages for debugging

## Implementation Notes

### Current Implementation
The system currently uses Bearer authentication via the Authorization header:
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/exports
```

### Enabling Query Parameter Support
To support `?token=XXX` authentication, update `app/controllers/concerns/export_authentication.rb`:

```ruby
def extract_bearer_token
  # Check query parameter first
  return params[:token] if params[:token].present?
  
  # Fall back to Authorization header
  auth_header = request.headers['Authorization']
  return nil unless auth_header
  auth_header.sub(/^Bearer\s+/i, '')
end
```

## Token Management Commands

### Generate Token
```bash
bundle exec rails export:generate
# Interactive prompts for description and expiration
```

### List Active Tokens
```bash
bundle exec rails export:list
VERBOSE=true bundle exec rails export:list  # Show more details
```

### Get Token Info
```bash
bundle exec rails export:info[TOKEN]
```

### Revoke Token
```bash
bundle exec rails export:revoke[TOKEN]
```

### Cleanup Expired Tokens
```bash
bundle exec rails export:cleanup
```

## Security Considerations

1. **Token Storage**: Tokens are hashed with SHA256 before storage
2. **No Recovery**: Raw tokens cannot be recovered after generation
3. **Privacy**: Email addresses are never exposed in exports
4. **Reusability**: Tokens are reusable but usage is tracked
5. **Revocation**: Tokens can be immediately revoked if compromised

## Troubleshooting

### Server Not Running
```bash
# Start the Rails server
rails server
```

### Database Not Seeded
```bash
# Seed test data
rails db:seed
```

### Token Generation Fails
```bash
# Check database connection
rails db:migrate:status

# Reset test tokens
rails export:cleanup
```

### Authentication Always Fails
- Verify token is active: `rails export:info[TOKEN]`
- Check server logs: `tail -f log/development.log`
- Confirm Bearer format: `Authorization: Bearer TOKEN`

## Continuous Testing

### Pre-Deploy Checklist
1. Run test script in development
2. Verify all formats work
3. Confirm no email exposure
4. Test rate limiting
5. Validate error handling

### Post-Deploy Verification
```bash
# Test against production (with production token)
./scripts/test-export-tokens.sh --base-url https://covid-co2-tracker.herokuapp.com
```

## Related Documentation
- `/docs/api/export-endpoints.md` - API documentation
- `/scripts/verify_export_system.sh` - Production verification script
- `/scripts/manage_export_tokens.rb` - Alternative token manager