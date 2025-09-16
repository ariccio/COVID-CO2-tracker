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

# Create a directory for test outputs with timestamp
OUTPUT_DIR="/tmp/export_tests_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Token: ${TOKEN:0:10}..."
echo "  Output Directory: $OUTPUT_DIR"
echo ""

# Helper function to test endpoint that returns JSON/text
test_endpoint_text() {
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

    # Generate a filename based on the description
    local filename=$(echo "$description" | tr ' ' '_' | tr -d '()')
    local output_file="${OUTPUT_DIR}/${filename}.txt"

    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")
    http_code=$(echo "$response" | tail -n1)
    # Use sed to remove last line instead of head -n-1 for BSD/macOS compatibility
    body=$(echo "$response" | sed '$d')

    # Save the response body to file
    echo "$body" > "$output_file"

    if [ "$http_code" = "200" ]; then
        echo "  ✓ Success (HTTP $http_code)"
        echo "  Response preview: ${body:0:100}..."
        echo "  Saved to: $output_file"
    else
        echo "  ✗ Failed (HTTP $http_code)"
        echo "  Error: $body"
        echo "  Error saved to: $output_file"
        return 1
    fi
    echo ""
}

# Helper function to test endpoint that returns file downloads
test_endpoint_download() {
    local endpoint=$1
    local description=$2
    local params=$3
    local file_ext=${4:-"csv"}

    echo "Testing: $description"
    echo "  Endpoint: $endpoint"

    if [ -n "$params" ]; then
        url="${BASE_URL}${endpoint}?${params}"
    else
        url="${BASE_URL}${endpoint}"
    fi

    # Generate a filename based on the description
    local filename=$(echo "$description" | tr ' ' '_' | tr -d '()')
    local output_file="${OUTPUT_DIR}/${filename}.${file_ext}"

    # Download directly to file and capture HTTP status
    http_code=$(curl -s -o "$output_file" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")

    if [ "$http_code" = "200" ]; then
        file_size=$(wc -c < "$output_file")
        echo "  ✓ Success (HTTP $http_code)"
        echo "  File size: $file_size bytes"
        if [ "$file_ext" = "csv" ] && [ -f "$output_file" ]; then
            lines=$(wc -l < "$output_file")
            echo "  Lines in CSV: $lines"
            echo "  First line: $(head -n1 "$output_file")"
        fi
        echo "  Saved to: $output_file"
    else
        echo "  ✗ Failed (HTTP $http_code)"
        if [ -f "$output_file" ]; then
            echo "  Error response: $(cat "$output_file")"
        fi
        return 1
    fi
    echo ""
}

echo "================================================"
echo "1. Testing Index Endpoint (Main Export)"
echo "================================================"

# Test basic export via index endpoint (returns JSON/text)
test_endpoint_text "/api/v1/export" "Basic export (index)" "format_type=csv"

# Test JSON via index endpoint
test_endpoint_text "/api/v1/export" "JSON export (index)" "format_type=json"

echo "================================================"
echo "2. Testing Download Endpoint"
echo "================================================"

# Test basic CSV export (using download endpoint)
test_endpoint_download "/api/v1/export/download" "CSV download" "format_type=csv" "csv"

# Test CSV with custom fields
test_endpoint_download "/api/v1/export/download" "CSV with custom fields" "format_type=csv&fields=co2_ppm,timestamp,user_name" "csv"

# Test CSV with date filter
test_endpoint_download "/api/v1/export/download" "CSV with date range" "format_type=csv&from=2024-01-01&to=2024-01-31" "csv"

# Test CSV with CO2 filter
test_endpoint_download "/api/v1/export/download" "CSV with CO2 threshold" "format_type=csv&above_ppm=1000" "csv"

echo "================================================"
echo "3. Testing JSON Export"
echo "================================================"

# Test JSON export via download
test_endpoint_download "/api/v1/export/download" "JSON download" "format_type=json" "json"

# Test JSON with filters
test_endpoint_download "/api/v1/export/download" "JSON with filters" "format_type=json&from=2024-01-01&to=2024-01-31&above_ppm=800" "json"

echo "================================================"
echo "4. Testing Streaming Export"
echo "================================================"

# Test streaming endpoint
echo "Testing: Streaming CSV export"
echo "  Endpoint: /api/v1/export/download?format_type=csv&stream=true"

# Use curl with output to file to test streaming
STREAM_FILE="${OUTPUT_DIR}/stream_test.csv"
http_code=$(curl -s -H "Authorization: Bearer $TOKEN" \
     "${BASE_URL}/api/v1/export/download?format_type=csv&stream=true" \
     --output "$STREAM_FILE" \
     -w "%{http_code}")

echo "  HTTP Status: $http_code"

if [ "$http_code" = "200" ] && [ -f "$STREAM_FILE" ]; then
    lines=$(wc -l < "$STREAM_FILE")
    file_size=$(wc -c < "$STREAM_FILE")
    echo "  ✓ Success - Downloaded $lines lines, $file_size bytes"
    echo "  First line: $(head -n1 "$STREAM_FILE")"
    echo "  File saved to: $STREAM_FILE"
else
    echo "  ✗ Failed - HTTP $http_code"
    if [ -f "$STREAM_FILE" ]; then
        echo "  Response: $(cat "$STREAM_FILE")"
    fi
fi
echo ""

echo "================================================"
echo "5. Testing Multi-File ZIP Export"
echo "================================================"

echo "Testing: Multi-file ZIP export"
echo "  Endpoint: /api/v1/export/download?format_type=multi_csv"

# Download ZIP file
ZIP_FILE="${OUTPUT_DIR}/export_test.zip"
http_code=$(curl -s -H "Authorization: Bearer $TOKEN" \
     "${BASE_URL}/api/v1/export/download?format_type=multi_csv" \
     --output "$ZIP_FILE" \
     -w "%{http_code}")

echo "  HTTP Status: $http_code"

if [ "$http_code" = "200" ] && [ -f "$ZIP_FILE" ]; then
    file_size=$(wc -c < "$ZIP_FILE")
    echo "  ✓ Success - ZIP file created ($file_size bytes)"

    # Check if it's actually a ZIP file
    if file "$ZIP_FILE" | grep -q "Zip archive"; then
        # Check ZIP contents
        echo "  ZIP contents:"
        unzip -l "$ZIP_FILE" | grep -E "\.csv|\.json" | while read line; do
            echo "    $line"
        done
        echo "  File saved to: $ZIP_FILE"

        # Extract ZIP contents for inspection
        ZIP_EXTRACT_DIR="${OUTPUT_DIR}/zip_contents"
        mkdir -p "$ZIP_EXTRACT_DIR"
        unzip -q "$ZIP_FILE" -d "$ZIP_EXTRACT_DIR"
        echo "  ZIP extracted to: $ZIP_EXTRACT_DIR"
    else
        echo "  ⚠ File is not a valid ZIP archive"
        echo "  File type: $(file "$ZIP_FILE")"
    fi
else
    echo "  ✗ Failed - HTTP $http_code"
    if [ -f "$ZIP_FILE" ]; then
        echo "  Response: $(head -c 500 "$ZIP_FILE")"
    fi
fi
echo ""

echo "================================================"
echo "6. Testing Error Handling"
echo "================================================"

# Test invalid date range
echo "Testing: Invalid date range (should fail)"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" \
           "${BASE_URL}/api/v1/export/download?format_type=csv&from=2024-01-31&to=2024-01-01")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
    echo "  ✓ Correctly returned HTTP 400 for invalid date range"
else
    echo "  ✗ Unexpected response code: $http_code"
fi

# Test without authentication
echo "Testing: No authentication (should fail)"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/v1/export/download?format_type=csv")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
    echo "  ✓ Correctly returned HTTP 401 for missing auth"
else
    echo "  ✗ Unexpected response code: $http_code"
fi

echo ""
echo "================================================"
echo "7. Testing Rate Limiting"
echo "================================================"

echo "Testing: Rate limit headers"
response=$(curl -s -I -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/v1/export/download?format_type=csv")

if echo "$response" | grep -q "X-RateLimit-Limit"; then
    echo "  ✓ Rate limit headers present"
    echo "$response" | grep "X-RateLimit" | while read line; do
        echo "    $line"
    done
else
    echo "  ⚠ Rate limit headers not found (may not be configured)"
fi

echo ""
echo "================================================"
echo "VERIFICATION SUMMARY"
echo "================================================"

echo ""
echo "✓ Export system verification complete!"
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
echo "================================================"
echo "OUTPUT FILES SAVED FOR INSPECTION"
echo "================================================"
echo ""
echo "All test outputs saved to: $OUTPUT_DIR"
echo ""
echo "Contents:"
ls -la "$OUTPUT_DIR"
echo ""
echo "To inspect the files:"
echo "  cd $OUTPUT_DIR"
echo "  ls -la"
echo "  cat *.txt          # View text responses"
echo "  cat *.csv          # View CSV files"
echo "  cat *.json         # View JSON files"
echo "  unzip -l export_test.zip # List ZIP contents"
echo "  cd zip_contents    # View extracted ZIP files"
echo ""
echo "================================================"
echo "NEXT STEPS"
echo "================================================"
echo ""
echo "1. Monitor production logs: heroku logs --tail --app covid-co2-tracker"
echo "2. Check memory usage: heroku run 'ps aux' --app covid-co2-tracker"
echo "3. Review metrics: heroku metrics --app covid-co2-tracker"
echo ""
echo "※ Full documentation: docs/api/export-endpoints.md"