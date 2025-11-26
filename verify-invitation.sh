#!/bin/bash

BASE_URL="http://localhost:5000"
EMAIL="curl.verify.$(date +%s)@example.com"
PASSWORD="Password123!"
COOKIE_FILE="cookies.txt"

# Function to get CSRF token
get_csrf_token() {
  # Fetch the token endpoint, sending existing cookies (-b) and saving new ones (-c)
  if [ -f "$COOKIE_FILE" ]; then
    curl -s -b $COOKIE_FILE -c $COOKIE_FILE "$BASE_URL/api/csrf-token" > csrf_response.json
  else
    curl -s -c $COOKIE_FILE "$BASE_URL/api/csrf-token" > csrf_response.json
  fi
  # Extract token from JSON response
  cat csrf_response.json | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4
}

echo "1. Getting CSRF Token"
CSRF_TOKEN=$(get_csrf_token)
echo "Token: $CSRF_TOKEN"

echo -e "\n2. Registering landlord: $EMAIL"
curl -s -X POST "$BASE_URL/api/landlord/signup" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Curl\",\"lastName\":\"Test\",\"phone\":\"07700900000\",\"businessName\":\"Curl Props\"}" \
  -b $COOKIE_FILE -c $COOKIE_FILE

echo -e "\n\n2.5. Manually Verifying Email in DB"
npx tsx verify-email-db.ts "$EMAIL"

echo -e "\n\n3. Logging in"
# Use /api/landlord/login and email field
curl -s -X POST "$BASE_URL/api/landlord/login" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -b $COOKIE_FILE -c $COOKIE_FILE

# After login, we might need a new CSRF token for the new session
echo -e "\n\n4. Refreshing CSRF Token"
CSRF_TOKEN=$(get_csrf_token)
echo "New Token: $CSRF_TOKEN"

echo -e "\n5. Creating Property"
PROP_RES=$(curl -s -X POST "$BASE_URL/api/properties" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"address\":\"123 Verify Lane\",\"city\":\"Test City\",\"postcode\":\"TE1 1ST\",\"monthlyRent\":1500,\"type\":\"apartment\",\"bedrooms\":2}" \
  -b $COOKIE_FILE -c $COOKIE_FILE)

echo $PROP_RES
PROP_ID=$(echo $PROP_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PROP_ID" ]; then
  echo "Failed to create property"
  exit 1
fi

echo -e "\nProperty ID: $PROP_ID"

echo -e "\n6. Inviting Tenant"
curl -s -X POST "$BASE_URL/api/landlord/invite-tenant" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
  -d "{\"email\":\"tenant.verify@example.com\",\"propertyId\":$PROP_ID,\"propertyAddress\":\"123 Verify Lane\"}" \
  -b $COOKIE_FILE -c $COOKIE_FILE

echo -e "\n\nDone"
rm $COOKIE_FILE csrf_response.json
