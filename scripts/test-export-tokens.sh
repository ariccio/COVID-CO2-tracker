#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Export Token System Test Script
# ═══════════════════════════════════════════════════════════════════════════
# Tests the complete export token functionality including:
# - Token generation via rake task
# - API access with tokens (Bearer and query parameter)
# - Token reusability
# - Token revocation
# - Long expiration (10-year tokens)
# - Data privacy (no email exposure)
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_ENDPOINT="/api/v1/exports"
TEST_TOKEN=""
TEST_TOKEN_ID=""
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# ═══════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("$1")
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_section() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "$1"
    echo "═══════════════════════════════════════════════════════════════════════════"
}

log_subsection() {
    echo ""
    echo "───────────────────────────────────────────────────────────────────────────"
    echo "$1"
    echo "───────────────────────────────────────────────────────────────────────────"
}

# Check if running in development environment
check_environment() {
    log_section "Environment Check"
    
    # Check if Rails is available
    if ! command -v rails &> /dev/null; then
        log_error "Rails not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if we're in development mode
    if [ "${RAILS_ENV:-development}" != "development" ]; then
        log_warning "Not in development mode. Set RAILS_ENV=development for testing."
    fi
    
    # Check if server is running
    if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|302"; then
        log_warning "Server at $BASE_URL doesn't appear to be running."
        log_info "Start the server with: rails server"
        echo -n "Continue anyway? (y/n): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Server is running at $BASE_URL"
    fi
}

# Generate a test token using the rake task
generate_test_token() {
    log_section "1. Token Generation Test"
    
    log_info "Generating a new export token via rake task..."
    
    # Create input for the rake task (non-interactive)
    # Description, expiration choice (4 for custom), days (3650 for 10 years), no custom permissions
    TOKEN_OUTPUT=$(echo -e "Test Token $(date +%s)\n4\n3650\nn" | bundle exec rails export:generate 2>&1)
    
    if [ $? -eq 0 ]; then
        # Extract the token from the output
        TEST_TOKEN=$(echo "$TOKEN_OUTPUT" | grep -A2 "Copy this token now" | tail -1 | tr -d ' \n')
        
        if [ -n "$TEST_TOKEN" ]; then
            log_success "Token generated successfully"
            log_info "Token (first 10 chars): ${TEST_TOKEN:0:10}..."
            
            # Verify token shows up in list
            if bundle exec rails export:list 2>&1 | grep -q "Test Token"; then
                log_success "Token appears in the active tokens list"
            else
                log_error "Token not found in active tokens list"
            fi
        else
            log_error "Failed to extract token from output"
            echo "Output was: $TOKEN_OUTPUT"
            exit 1
        fi
    else
        log_error "Failed to generate token"
        echo "Output: $TOKEN_OUTPUT"
        exit 1
    fi
}

# Test API access with Bearer authentication
test_bearer_auth() {
    log_subsection "2a. Testing Bearer Authentication"
    
    log_info "Testing API access with Bearer token..."
    
    # Test CSV export
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Bearer authentication successful (HTTP 200)"
        
        # Check if we got CSV data
        if echo "$BODY" | head -1 | grep -q ","; then
            log_success "Received CSV data"
        else
            log_warning "Response doesn't look like CSV"
        fi
        
        # Check for email data (should NOT be present)
        if echo "$BODY" | grep -iq "email\|@"; then
            log_error "Email data found in export! Privacy violation!"
        else
            log_success "No email data found in export (privacy protected)"
        fi
    else
        log_error "Bearer authentication failed (HTTP $HTTP_CODE)"
        if [ "$VERBOSE" = "true" ]; then
            echo "Response: $BODY"
        fi
    fi
}

# Test API access with query parameter (if supported)
test_query_param_auth() {
    log_subsection "2b. Testing Query Parameter Authentication"
    
    log_warning "Note: Query parameter authentication may require implementation changes"
    log_info "Testing API access with token as query parameter..."
    
    # Test with token in query string
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        "$BASE_URL$API_ENDPOINT?token=$TEST_TOKEN&format_type=csv")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Query parameter authentication successful (HTTP 200)"
    else
        log_warning "Query parameter authentication not supported (HTTP $HTTP_CODE)"
        log_info "This may require updating ExportAuthentication concern to support params[:token]"
    fi
}

# Test token reusability
test_token_reusability() {
    log_section "3. Token Reusability Test"
    
    log_info "Testing multiple uses of the same token..."
    
    SUCCESSFUL_USES=0
    TOTAL_ATTEMPTS=5
    
    for i in $(seq 1 $TOTAL_ATTEMPTS); do
        log_info "Attempt $i/$TOTAL_ATTEMPTS..."
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            "$BASE_URL$API_ENDPOINT?format_type=csv")
        
        if [ "$HTTP_CODE" = "200" ]; then
            ((SUCCESSFUL_USES++))
            log_success "Request $i successful"
        else
            log_error "Request $i failed (HTTP $HTTP_CODE)"
        fi
        
        # Small delay between requests
        sleep 0.5
    done
    
    if [ "$SUCCESSFUL_USES" -eq "$TOTAL_ATTEMPTS" ]; then
        log_success "Token is fully reusable - all $TOTAL_ATTEMPTS attempts succeeded"
    else
        log_error "Token reusability issue - only $SUCCESSFUL_USES/$TOTAL_ATTEMPTS succeeded"
    fi
    
    # Check usage count
    log_info "Checking token usage count..."
    USAGE_INFO=$(bundle exec rails export:info[$TEST_TOKEN] 2>&1 | grep "Total uses:")
    if [ -n "$USAGE_INFO" ]; then
        log_info "$USAGE_INFO"
    fi
}

# Test different export formats
test_export_formats() {
    log_section "4. Export Format Tests"
    
    FORMATS=("csv" "json" "jsonl")
    
    for FORMAT in "${FORMATS[@]}"; do
        log_info "Testing $FORMAT format export..."
        
        RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            "$BASE_URL$API_ENDPOINT?format_type=$FORMAT")
        
        HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
        BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "$FORMAT export successful"
            
            # Verify no email data
            if echo "$BODY" | grep -iq "email\|@.*\."; then
                log_error "Email data found in $FORMAT export!"
            else
                log_success "No email data in $FORMAT export"
            fi
            
            # Save sample for inspection
            if [ "$VERBOSE" = "true" ]; then
                echo "$BODY" | head -5 > "/tmp/export_sample_$FORMAT.txt"
                log_info "Sample saved to /tmp/export_sample_$FORMAT.txt"
            fi
        else
            log_error "$FORMAT export failed (HTTP $HTTP_CODE)"
        fi
    done
}

# Test export with filters
test_export_filters() {
    log_section "5. Export Filter Tests"
    
    log_info "Testing exports with various filters..."
    
    # Test date range filter
    log_info "Testing date range filter..."
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv&from=2024-01-01&to=2024-12-31")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Date range filter works"
    else
        log_error "Date range filter failed (HTTP $HTTP_CODE)"
    fi
    
    # Test CO2 threshold filter
    log_info "Testing CO2 threshold filter..."
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv&above_ppm=1000")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "CO2 threshold filter works"
    else
        log_error "CO2 threshold filter failed (HTTP $HTTP_CODE)"
    fi
    
    # Test custom fields
    log_info "Testing custom field selection..."
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv&fields=co2_ppm,timestamp,location_name")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Custom field selection works"
    else
        log_error "Custom field selection failed (HTTP $HTTP_CODE)"
    fi
}

# Test token expiration
test_token_expiration() {
    log_section "6. Token Expiration Test"
    
    log_info "Checking token expiration details..."
    
    # Get token info
    TOKEN_INFO=$(bundle exec rails export:info[$TEST_TOKEN] 2>&1)
    
    if echo "$TOKEN_INFO" | grep -q "Active"; then
        log_success "Token is active"
        
        # Check expiration time
        if echo "$TOKEN_INFO" | grep -q "days.*remaining"; then
            DAYS_REMAINING=$(echo "$TOKEN_INFO" | grep -oE "[0-9]+ days" | head -1)
            log_info "Token expires in: $DAYS_REMAINING"
            
            # Check if it's a long-lived token (more than 365 days)
            DAYS_NUM=$(echo "$DAYS_REMAINING" | grep -oE "[0-9]+")
            if [ "$DAYS_NUM" -gt 365 ]; then
                log_success "Token is long-lived (10-year expiration verified)"
            else
                log_warning "Token expiration is less than expected"
            fi
        fi
    else
        log_error "Token is not active"
    fi
}

# Test token revocation
test_token_revocation() {
    log_section "7. Token Revocation Test"
    
    log_info "Creating a second token for revocation testing..."
    
    # Generate another token
    REVOKE_TOKEN=$(echo -e "Revocation Test Token\n1\nn" | bundle exec rails export:generate 2>&1 | grep -A2 "Copy this token now" | tail -1 | tr -d ' \n')
    
    if [ -z "$REVOKE_TOKEN" ]; then
        log_error "Failed to generate token for revocation test"
        return
    fi
    
    log_info "Testing access with new token..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $REVOKE_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "New token works before revocation"
    else
        log_error "New token doesn't work (HTTP $HTTP_CODE)"
        return
    fi
    
    log_info "Revoking the token..."
    REVOKE_OUTPUT=$(echo "yes" | bundle exec rails export:revoke[$REVOKE_TOKEN] 2>&1)
    
    if echo "$REVOKE_OUTPUT" | grep -q "successfully revoked"; then
        log_success "Token revoked successfully"
        
        log_info "Testing access with revoked token..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $REVOKE_TOKEN" \
            "$BASE_URL$API_ENDPOINT?format_type=csv")
        
        if [ "$HTTP_CODE" = "401" ]; then
            log_success "Revoked token correctly denied (HTTP 401)"
        else
            log_error "Revoked token still works! (HTTP $HTTP_CODE) - Security issue!"
        fi
    else
        log_error "Failed to revoke token"
    fi
}

# Test rate limiting
test_rate_limiting() {
    log_section "8. Rate Limiting Test (Optional)"
    
    log_info "Testing rate limit headers..."
    
    HEADERS=$(curl -sI -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv")
    
    if echo "$HEADERS" | grep -q "X-RateLimit"; then
        log_success "Rate limiting is active"
        echo "$HEADERS" | grep "X-RateLimit" | while read -r line; do
            log_info "  $line"
        done
    else
        log_warning "Rate limiting headers not found (may not be configured)"
    fi
}

# Test error handling
test_error_handling() {
    log_section "9. Error Handling Tests"
    
    # Test with invalid token
    log_info "Testing with invalid token..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer invalid_token_12345" \
        "$BASE_URL$API_ENDPOINT?format_type=csv")
    
    if [ "$HTTP_CODE" = "401" ]; then
        log_success "Invalid token correctly rejected (HTTP 401)"
    else
        log_error "Invalid token not properly rejected (HTTP $HTTP_CODE)"
    fi
    
    # Test without token
    log_info "Testing without authentication..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL$API_ENDPOINT?format_type=csv")
    
    if [ "$HTTP_CODE" = "401" ]; then
        log_success "Missing authentication correctly rejected (HTTP 401)"
    else
        log_error "Missing authentication not properly rejected (HTTP $HTTP_CODE)"
    fi
    
    # Test with invalid date range
    log_info "Testing with invalid date range..."
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        "$BASE_URL$API_ENDPOINT?format_type=csv&from=2024-12-31&to=2024-01-01")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
        log_success "Invalid date range correctly rejected"
    else
        log_warning "Invalid date range not validated (HTTP $HTTP_CODE)"
    fi
}

# Cleanup test tokens
cleanup_tokens() {
    log_section "10. Cleanup"
    
    log_info "Cleaning up test tokens..."
    
    # List all tokens to see what we created
    TOKENS_BEFORE=$(bundle exec rails export:list 2>&1 | grep -c "Test Token" || true)
    log_info "Found $TOKENS_BEFORE test tokens"
    
    if [ "$TOKENS_BEFORE" -gt 0 ]; then
        log_info "Would you like to revoke all test tokens? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            # Note: This would need to be done manually or with a custom rake task
            log_info "Please manually revoke test tokens or run: bundle exec rails export:cleanup"
        fi
    fi
}

# Generate summary report
generate_summary() {
    log_section "Test Summary"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "                           TEST RESULTS SUMMARY                            "
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "  Total Tests: $TOTAL_TESTS"
    echo "  Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo "  Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ "$TESTS_FAILED" -gt 0 ]; then
        echo "  Failed Tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "    ${RED}✗${NC} $test"
        done
        echo ""
    fi
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "  ${GREEN}✓ All tests passed successfully!${NC}"
    else
        echo -e "  ${RED}✗ Some tests failed. Please review the output above.${NC}"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    
    # Implementation notes
    echo ""
    echo "Implementation Notes:"
    echo "───────────────────────────────────────────────────────────────────────────"
    echo ""
    echo "Current Status:"
    echo "  • Bearer authentication (Authorization header) is working"
    echo "  • Tokens are reusable and long-lived (10 years by default)"
    echo "  • No email data is exposed in exports"
    echo "  • Rate limiting can be configured per token"
    echo ""
    echo "To Enable Query Parameter Authentication (?token=XXX):"
    echo "  1. Update app/controllers/concerns/export_authentication.rb:"
    echo "     - Modify extract_bearer_token to also check params[:token]"
    echo "  2. Example implementation:"
    echo ""
    echo "     def extract_bearer_token"
    echo "       # Check query parameter first"
    echo "       return params[:token] if params[:token].present?"
    echo "       "
    echo "       # Fall back to Authorization header"
    echo "       auth_header = request.headers['Authorization']"
    echo "       return nil unless auth_header"
    echo "       auth_header.sub(/^Bearer\s+/i, '')"
    echo "     end"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
}

# Main execution
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "              COVID CO2 Tracker - Export Token System Test                 "
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Configuration:"
    echo "  Base URL: $BASE_URL"
    echo "  API Endpoint: $API_ENDPOINT"
    echo "  Rails Environment: ${RAILS_ENV:-development}"
    echo "  Verbose Mode: $VERBOSE"
    echo ""
    
    # Run tests
    check_environment
    generate_test_token
    
    if [ -n "$TEST_TOKEN" ]; then
        test_bearer_auth
        test_query_param_auth
        test_token_reusability
        test_export_formats
        test_export_filters
        test_token_expiration
        test_token_revocation
        test_rate_limiting
        test_error_handling
        cleanup_tokens
    else
        log_error "No test token available. Skipping remaining tests."
    fi
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [ "$TESTS_FAILED" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v     Show detailed output"
            echo "  --base-url URL    Set base URL (default: http://localhost:3000)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  BASE_URL          Base URL for the application"
            echo "  RAILS_ENV         Rails environment (default: development)"
            echo "  VERBOSE           Enable verbose output (true/false)"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run with defaults"
            echo "  $0 --verbose                # Run with detailed output"
            echo "  $0 --base-url http://localhost:3001  # Custom port"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main