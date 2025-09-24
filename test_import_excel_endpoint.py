import requests
import os

# Admin credentials
USERNAME = 'admin'
PASSWORD = 'admin123'
BASE_URL = 'http://localhost:8000'

def get_auth_token():
    """Authenticate and get a JWT token."""
    try:
        response = requests.post(f'{BASE_URL}/api/login', data={
            'username': USERNAME,
            'password': PASSWORD
        })
        response.raise_for_status()
        token = response.json().get('token')
        if not token:
            print(f"Login response did not contain a token. Response: {response.json()}")
        return token

    except requests.exceptions.RequestException as e:
        print(f"Error getting auth token: {e}")
        if e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return None

# Test the import_excel API endpoint
url = f"{BASE_URL}/api/billing/debtors/import_excel/"

# Get authentication token
token = get_auth_token()
if not token:
    print("❌ Failed to get authentication token")
    exit(1)

headers = {'Authorization': f'Bearer {token}'}

# Create a test file upload
files = {'file': open('test_debtors_import.csv', 'rb')}

try:
    response = requests.post(url, files=files, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Import Excel successful!")
    else:
        print("❌ Import Excel failed")
        
except Exception as e:
    print(f"Error: {e}")
