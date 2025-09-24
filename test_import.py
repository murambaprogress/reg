import requests
import json

# Test the import endpoint
url = "http://localhost:8000/api/billing/debtors/bulk-import/"

# Create a test file
with open('test_debtors_import.csv', 'rb') as f:
    files = {'file': f}
    
    # You might need to add authentication headers here
    # For testing, you can temporarily disable authentication or use a test token
    headers = {}
    
    response = requests.post(url, files=files, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    try:
        data = response.json()
        print("JSON Response:")
        print(json.dumps(data, indent=2))
    except:
        print("Could not parse JSON response")
