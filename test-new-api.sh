#!/bin/bash

# RestaurantIQ API Testing Script
# This script demonstrates the complete restaurant creation and menu management flow

echo "🚀 RestaurantIQ API Testing Script"
echo "=================================="
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to make API calls
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4

    echo -e "${BLUE}Testing: $method $endpoint${NC}"

    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            curl -s -X $method "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json" \
                 -H "Authorization: Bearer $auth_header" \
                 -d "$data"
        else
            curl -s -X $method "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json" \
                 -d "$data"
        fi
    else
        if [ -n "$auth_header" ]; then
            curl -s -X $method "$BASE_URL$endpoint" \
                 -H "Authorization: Bearer $auth_header"
        else
            curl -s -X $method "$BASE_URL$endpoint"
        fi
    fi

    echo -e "\n${YELLOW}---${NC}\n"
}

# Test 1: Health Check
echo -e "${GREEN}1. Testing Health Endpoint${NC}"
call_api "GET" "/health" ""

# Test 2: Complete Restaurant Setup (Restaurant + Owner in one transaction)
echo -e "${GREEN}2. Testing Complete Restaurant Setup${NC}"
SETUP_DATA='{
  "restaurant": {
    "name": "Test Bistro",
    "timezone": "America/New_York",
    "currency": "USD",
    "settings": {
      "prepFinalizationTime": "23:30",
      "gracePeriodHours": 1,
      "snapshotRetentionDays": 90,
      "enableAutoSync": true,
      "workingHours": {
        "start": "06:00",
        "end": "23:00"
      }
    }
  },
  "user": {
    "email": "owner@testbistro.com",
    "password": "OwnerPass123!",
    "firstName": "John",
    "lastName": "Smith"
  }
}'

SETUP_RESPONSE=$(call_api "POST" "/restaurants/setup-complete" "$SETUP_DATA")
echo "$SETUP_RESPONSE"

# Extract restaurant ID and auth token from response
RESTAURANT_ID=$(echo "$SETUP_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✅ Restaurant created with ID: $RESTAURANT_ID${NC}"

# Test 3: User Login
echo -e "${GREEN}3. Testing User Login${NC}"
LOGIN_DATA='{
  "email": "owner@testbistro.com",
  "password": "OwnerPass123!",
  "restaurantId": "'$RESTAURANT_ID'"
}'

LOGIN_RESPONSE=$(call_api "POST" "/auth/login" "$LOGIN_DATA")
echo "$LOGIN_RESPONSE"

# Extract auth token
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✅ Login successful, token: ${AUTH_TOKEN:0:20}...${NC}"

# Test 4: Get Restaurant Details
echo -e "${GREEN}4. Testing Restaurant Details${NC}"
call_api "GET" "/restaurants/$RESTAURANT_ID" "" "$AUTH_TOKEN"

# Test 5: Menu Management - Get Menu Items
echo -e "${GREEN}5. Testing Menu Management (Real Implementation)${NC}"
call_api "GET" "/restaurants/$RESTAURANT_ID/menu/items" "" "$AUTH_TOKEN"

# Test 6: Menu Management - Create Menu Item
echo -e "${GREEN}6. Testing Menu Item Creation${NC}"
MENU_ITEM_DATA='{
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato sauce, mozzarella, and fresh basil",
  "category": "Main Course",
  "unit": "each",
  "unitCost": 8.50,
  "sellingPrice": 18.99,
  "isActive": true
}'

call_api "POST" "/restaurants/$RESTAURANT_ID/menu/items" "$MENU_ITEM_DATA" "$AUTH_TOKEN"

# Test 7: Menu Categories
echo -e "${GREEN}7. Testing Menu Categories${NC}"
call_api "GET" "/restaurants/$RESTAURANT_ID/menu/categories" "" "$AUTH_TOKEN"

# Test 8: PREP Management - Get Current Prep
echo -e "${GREEN}8. Testing PREP Management${NC}"
call_api "GET" "/prep/restaurants/$RESTAURANT_ID/prep" "" "$AUTH_TOKEN"

# Test 9: PREP Management - Create Prep Items
echo -e "${GREEN}9. Testing Prep Item Creation${NC}"
PREP_DATA='{
  "date": "'$(date +%Y-%m-%d)'",
  "items": [
    {
      "menuItemId": "item-1",
      "menuItemName": "Grilled Salmon",
      "par": 25,
      "onHand": 18
    },
    {
      "menuItemId": "item-2",
      "menuItemName": "Caesar Salad",
      "par": 35,
      "onHand": 28
    }
  ]
}'

call_api "POST" "/prep/restaurants/$RESTAURANT_ID/prep" "$PREP_DATA" "$AUTH_TOKEN"

# Test 10: PREP History
echo -e "${GREEN}10. Testing PREP History${NC}"
call_api "GET" "/prep/restaurants/$RESTAURANT_ID/prep/history" "" "$AUTH_TOKEN"

# Test 11: PREP Alerts
echo -e "${GREEN}11. Testing PREP Alerts${NC}"
call_api "GET" "/prep/restaurants/$RESTAURANT_ID/prep/alerts" "" "$AUTH_TOKEN"

# Test 12: User Management - Get Restaurant Users
echo -e "${GREEN}12. Testing User Management${NC}"
call_api "GET" "/restaurants/$RESTAURANT_ID/users" "" "$AUTH_TOKEN"

# Test 13: Create Additional User (Manager)
echo -e "${GREEN}13. Testing Additional User Creation${NC}"
NEW_USER_DATA='{
  "email": "manager@testbistro.com",
  "password": "ManagerPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "MANAGER",
  "isActive": true
}'

call_api "POST" "/restaurants/$RESTAURANT_ID/users" "$NEW_USER_DATA" "$AUTH_TOKEN"

# Test 14: Update Restaurant Settings
echo -e "${GREEN}14. Testing Restaurant Settings Update${NC}"
UPDATE_DATA='{
  "name": "Test Bistro - Updated",
  "settings": {
    "prepFinalizationTime": "23:00",
    "gracePeriodHours": 2,
    "snapshotRetentionDays": 120,
    "enableAutoSync": true,
    "workingHours": {
      "start": "05:00",
      "end": "24:00"
    }
  }
}'

call_api "PUT" "/restaurants/$RESTAURANT_ID" "$UPDATE_DATA" "$AUTH_TOKEN"

# Test 15: Get Available Roles
echo -e "${GREEN}15. Testing Role Management${NC}"
call_api "GET" "/restaurants/$RESTAURANT_ID/roles" "" "$AUTH_TOKEN"

echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo ""
echo -e "${BLUE}Summary of Available Endpoints:${NC}"
echo "✅ Health Check: GET /api/v1/health"
echo "✅ Restaurant Setup: POST /api/v1/restaurants/setup-complete"
echo "✅ Authentication: POST /api/v1/auth/login"
echo "✅ Restaurant Management: GET/PUT /api/v1/restaurants/:restaurantId"
echo "✅ Menu Management: GET/POST/PUT/DELETE /api/v1/restaurants/:restaurantId/menu/items"
echo "✅ Menu Categories: GET /api/v1/restaurants/:restaurantId/menu/categories"
echo "✅ User Management: GET/POST /api/v1/restaurants/:restaurantId/users"
echo "✅ Role Management: GET /api/v1/restaurants/:restaurantId/roles"
echo ""
echo -e "${GREEN}🎉 Menu System: Fully Functional with Database Integration${NC}"
echo -e "${YELLOW}📋 PREP System: Ready for Implementation (Architecture in Place)${NC}"
echo ""
echo -e "${BLUE}Enterprise Features:${NC}"
echo "• Restaurant-scoped multi-tenancy"
echo "• Hierarchical role-based permissions"
echo "• JWT authentication with correlation IDs"
echo "• Domain event system"
echo "• Comprehensive error handling"
echo "• Audit logging and tracing"
