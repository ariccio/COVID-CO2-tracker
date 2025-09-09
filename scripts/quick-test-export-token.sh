#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Quick Export Token Test - Minimal Testing for Development
# ═══════════════════════════════════════════════════════════════════════════
# Fast test to verify export tokens work correctly
# For comprehensive testing, use test-export-tokens.sh
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "                     Quick Export Token Test                               "
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Generate a test token
echo -e "${YELLOW}→${NC} Generating test token..."
TOKEN=$(echo -e "Quick Test Token $(date +%s)\n1\nn" | bundle exec rails export:generate 2>&1 | grep -A2 "Copy this token now" | tail -1 | tr -d ' \n')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} Failed to generate token"
    exit 1
fi

echo -e "${GREEN}✓${NC} Token generated: ${TOKEN:0:10}..."
echo ""

# Step 2: Test Bearer authentication
echo -e "${YELLOW}→${NC} Testing Bearer authentication..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/exports?format_type=csv")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Bearer auth works (HTTP 200)"
else
    echo -e "${RED}✗${NC} Bearer auth failed (HTTP $HTTP_CODE)"
fi

# Step 3: Test query parameter (if supported)
echo -e "${YELLOW}→${NC} Testing query parameter authentication..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/api/v1/exports?token=$TOKEN&format_type=csv")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Query param auth works (HTTP 200)"
else
    echo -e "${YELLOW}⚠${NC} Query param auth not supported (HTTP $HTTP_CODE)"
    echo "   To enable: Update export_authentication.rb to check params[:token]"
fi

# Step 4: Check for email exposure
echo -e "${YELLOW}→${NC} Checking privacy (no emails)..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/exports?format_type=csv")

if echo "$RESPONSE" | grep -iq "@.*\."; then
    echo -e "${RED}✗${NC} Email data found in export!"
else
    echo -e "${GREEN}✓${NC} No email data exposed"
fi

# Step 5: Test reusability
echo -e "${YELLOW}→${NC} Testing token reusability..."
HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/exports?format_type=json")

if [ "$HTTP_CODE2" = "200" ]; then
    echo -e "${GREEN}✓${NC} Token is reusable"
else
    echo -e "${RED}✗${NC} Token reuse failed"
fi

# Step 6: Revoke the test token
echo -e "${YELLOW}→${NC} Revoking test token..."
echo "yes" | bundle exec rails export:revoke[$TOKEN] 2>&1 > /dev/null

HTTP_CODE3=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/exports?format_type=csv")

if [ "$HTTP_CODE3" = "401" ]; then
    echo -e "${GREEN}✓${NC} Revoked token correctly denied"
else
    echo -e "${RED}✗${NC} Revoked token still works!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}Quick test complete!${NC} For full testing run: ./scripts/test-export-tokens.sh"
echo "═══════════════════════════════════════════════════════════════════════════"