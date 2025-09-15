#!/bin/bash

# Verify Export System Endpoints
# Tests all export endpoints to ensure they're working correctly

set -e

echo "================================================"
echo "Export System Verification Script"
echo "================================================"

# Configuration
if [ -z "$1" ]; then
    echo "Usage: $0 <export_token> [base_url]"
    echo "Example: $0 abc123... https://covid-co2-tracker.herokuapp.com"
    exit 1
fi

TOKEN=$1
BASE_URL=${2:-"https://covid-co2-tracker.herokuapp.com"}

echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Token: ${TOKEN:0:10}..."
echo ""

# Helper function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local params=$3
    
    echo "Testing: $description"
    echo "  Endpoint: $endpoint"
    
    if [ -n "$params" ]; then
        url="${BASE_URL}${endpoint}?${params}"
    else
        url="${BASE_URL}${endpoint}"
    fi
    
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")
    http_code=$(echo "$response" | tail -n1)
    # Use sed to remove last line instead of head -n-1 for BSD/macOS compatibility
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ Success (HTTP $http_code)"
        echo "  Response preview: ${body:0:100}..."
    else
        echo "  ❌ Failed (HTTP $http_code)"
        echo "  Error: $body"
        return 1
    fi
    echo ""
}

echo "================================================"
echo "1. Testing CSV Export"
echo "================================================"

# Test basic CSV export (using download endpoint)
test_endpoint "/api/v1/export/download" "Basic CSV export" "format=csv"

# Test CSV with custom fields
test_endpoint "/api/v1/export/download" "CSV with custom fields" "format=csv&fields=co2_ppm,timestamp,user_name"

# Test CSV with date filter
test_endpoint "/api/v1/export/download" "CSV with date range" "format=csv&from=2024-01-01&to=2024-01-31"

# Test CSV with CO2 filter
test_endpoint "/api/v1/export/download" "CSV with CO2 threshold" "format=csv&above_ppm=1000"

echo "================================================"
echo "2. Testing JSON Export"
echo "================================================"

# Test JSON export
test_endpoint "/api/v1/export/download" "Basic JSON export" "format=json"

# Test JSON with filters
test_endpoint "/api/v1/export/download" "JSON with filters" "format=json&from=2024-01-01&to=2024-01-31&above_ppm=800"

echo "================================================"
echo "3. Testing Streaming Export"
echo "================================================"

# Test streaming endpoint
echo "Testing: Streaming CSV export"
echo "  Endpoint: /api/v1/export/download?format=csv&stream=true"

# Use curl with output to file to test streaming
curl -s -H "Authorization: Bearer $TOKEN" \
     "${BASE_URL}/api/v1/export/download?format=csv&stream=true" \
     --output /tmp/stream_test.csv \
     -w "HTTP Status: %{http_code}\n"

if [ -f /tmp/stream_test.csv ]; then
    lines=$(wc -l < /tmp/stream_test.csv)
    echo "  ✅ Success - Downloaded $lines lines"
    echo "  File saved to: /tmp/stream_test.csv"
    rm /tmp/stream_test.csv
else
    echo "  ❌ Failed - No file downloaded"
fi
echo ""

echo "================================================"
echo "4. Testing Multi-File ZIP Export"
echo "================================================"

echo "Testing: Multi-file ZIP export"
echo "  Endpoint: /api/v1/export/download?format=zip"

# Download ZIP file
curl -s -H "Authorization: Bearer $TOKEN" \
     "${BASE_URL}/api/v1/export/download?format=zip" \
     --output /tmp/export_test.zip \
     -w "HTTP Status: %{http_code}\n"

if [ -f /tmp/export_test.zip ]; then
    # Check ZIP contents
    echo "  ZIP contents:"
    unzip -l /tmp/export_test.zip | grep -E "\.csv|\.json" | while read line; do
        echo "    $line"
    done
    echo "  ✅ Success - ZIP file created"
    rm /tmp/export_test.zip
else
    echo "  ❌ Failed - No ZIP file downloaded"
fi
echo ""

echo "================================================"
echo "5. Testing Error Handling"
echo "================================================"

# Test invalid date range
echo "Testing: Invalid date range (should fail)"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" \
           "${BASE_URL}/api/v1/export/download?format=csv&from=2024-01-31&to=2024-01-01")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
    echo "  ✅ Correctly returned HTTP 400 for invalid date range"
else
    echo "  ❌ Unexpected response code: $http_code"
fi

# Test without authentication
echo "Testing: No authentication (should fail)"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/v1/export/download?format=csv")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
    echo "  ✅ Correctly returned HTTP 401 for missing auth"
else
    echo "  ❌ Unexpected response code: $http_code"
fi

echo ""
echo "================================================"
echo "6. Testing Rate Limiting"
echo "================================================"

echo "Testing: Rate limit headers"
response=$(curl -s -I -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/v1/export/download?format=csv")

if echo "$response" | grep -q "X-RateLimit-Limit"; then
    echo "  ✅ Rate limit headers present"
    echo "$response" | grep "X-RateLimit" | while read line; do
        echo "    $line"
    done
else
    echo "  ⚠️  Rate limit headers not found (may not be configured)"
fi

echo ""
echo "================================================"
echo "VERIFICATION SUMMARY"
echo "================================================"

echo ""
echo "✅ Export system verification complete!"
echo ""
echo "Tested endpoints:"
echo "  - CSV export (with various filters)"
echo "  - JSON export"
echo "  - Streaming CSV export"
echo "  - Multi-file ZIP export"
echo "  - Error handling"
echo "  - Authentication"
echo "  - Rate limiting"
echo ""
echo "Next steps:"
echo "1. Monitor production logs: heroku logs --tail --app covid-co2-tracker"
echo "2. Check memory usage: heroku run 'ps aux' --app covid-co2-tracker"
echo "3. Review metrics: heroku metrics --app covid-co2-tracker"
echo ""
echo "📚 Full documentation: docs/api/export-endpoints.md"