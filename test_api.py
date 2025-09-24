import requests
import json

# Test the API endpoint
url = "http://localhost:8000/api/billing/debtors/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print("JSON Response:")
            print(json.dumps(data, indent=2))
        except:
            print("Response is not JSON")
    elif response.status_code == 401:
        print("Authentication required - this is expected")
    else:
        print(f"Unexpected status code: {response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
