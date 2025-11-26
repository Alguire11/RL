#!/bin/bash

# Base URL
BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Generate unique email
TIMESTAMP=$(date +%s)
EMAIL="auto.verify.${TIMESTAMP}@example.com"
PASSWORD="Password123!"

echo "1. Getting CSRF Token"
COOKIE_JAR="cookies_signup_${TIMESTAMP}.txt"
CSRF_TOKEN=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/csrf-token" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
echo "Token: $CSRF_TOKEN"

if [ -z "$CSRF_TOKEN" ]; then
    echo -e "${RED}Failed to get CSRF token${NC}"
    exit 1
fi

echo -e "\n2. Registering landlord: $EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/landlord/signup" \
  -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Auto\",\"lastName\":\"Verify\",\"phone\":\"07700900000\",\"businessName\":\"Auto Props\"}")

echo "$REGISTER_RESPONSE"

# Check if requiresVerification is present (should NOT be present or false)
if echo "$REGISTER_RESPONSE" | grep -q '"requiresVerification":true'; then
    echo -e "${RED}Registration still requires verification!${NC}"
    exit 1
fi

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}Registration successful and auto-verified!${NC}"
else
    echo -e "${RED}Registration failed${NC}"
    exit 1
fi

echo -e "\n3. Logging in immediately"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/landlord/login" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}Login successful!${NC}"
else
    echo -e "${RED}Login failed${NC}"
    exit 1
fi

echo -e "\nDone"
