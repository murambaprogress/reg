#!/bin/bash

# Test API Health Check Endpoint
echo "Testing API health check endpoint..."

# Make sure the script is run with a URL parameter
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <api-base-url>"
    echo "Example: $0 https://http://localhost:3001/api"
    exit 1
fi

API_BASE_URL=$1
HEALTH_CHECK_URL="$API_BASE_URL/health-check/"

# Function to display test result
function display_test_result() {
    if [ $1 -eq 0 ]; then
        echo "[PASS] $2"
    else
        echo "[FAIL] $2"
    fi
}

# Test 1: Basic connectivity test
echo -n "Testing basic connectivity... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")
if [ "$RESPONSE" == "200" ]; then
    echo "OK (Status: $RESPONSE)"
    display_test_result 0 "API is accessible"
else
    echo "FAILED (Status: $RESPONSE)"
    display_test_result 1 "API is not accessible"
    exit 1
fi

# Test 2: Check response content
echo -n "Checking response content... "
RESPONSE_CONTENT=$(curl -s "$HEALTH_CHECK_URL")
if [[ "$RESPONSE_CONTENT" == *"status"* && "$RESPONSE_CONTENT" == *"ok"* ]]; then
    echo "OK"
    display_test_result 0 "API returned correct response format"
else
    echo "FAILED"
    display_test_result 1 "API returned incorrect response format"
    echo "Response content: $RESPONSE_CONTENT"
    exit 1
fi

# Test 3: Response time
echo -n "Checking response time... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$HEALTH_CHECK_URL")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "OK ($RESPONSE_TIME seconds)"
    display_test_result 0 "API response time is acceptable"
else
    echo "WARNING ($RESPONSE_TIME seconds)"
    display_test_result 1 "API response time is slow (>2 seconds)"
fi

echo ""
echo "All tests completed successfully!"
echo "API health check endpoint is working correctly at: $HEALTH_CHECK_URL"