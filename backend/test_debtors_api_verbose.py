import requests
import json
import traceback

# Replace with your local development server URL
BASE_URL = 'http://localhost:8000'

# Admin credentials - replace with your superuser credentials
USERNAME = 'admin'
PASSWORD = 'admin123'

def get_auth_token():
    """Authenticate and get a JWT token."""
    try:
        print("\nAttempting to get auth token...")
        response = requests.post(f'{BASE_URL}/api/login/', data={
            'username': USERNAME,
            'password': PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Login error response: {response.text}")
            return None
            
        token = response.json().get('token')
        if not token:
            print(f"Login response did not contain a token. Response: {response.json()}")
            return None
            
        print("✅ Successfully obtained auth token")
        return token

    except Exception as e:
        print(f"❌ Error getting auth token: {str(e)}")
        traceback.print_exc()
        return None

def test_debtors_endpoint(token):
    """Test the /api/billing/debtors/ endpoint."""
    if not token:
        print("❌ Authentication token not available. Skipping test.")
        return False

    print("\nTesting debtors endpoint...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        print(f"Making GET request to {BASE_URL}/api/billing/debtors/")
        print(f"Using headers: {headers}")
        
        response = requests.get(f'{BASE_URL}/api/billing/debtors/', headers=headers)
        print(f"\nResponse Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get('results', []))
            print("✅ Debtors endpoint test PASSED")
            print(f"Retrieved {count} debtors")
            return True
        else:
            print("❌ Debtors endpoint test FAILED")
            print("Error Response:")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error testing debtors endpoint: {str(e)}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("TESTING DEBTORS API ENDPOINT")
    print("=" * 60)
    
    token = get_auth_token()
    success = test_debtors_endpoint(token)
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("❌ TESTS FAILED - Check the errors above")
    print("=" * 60)