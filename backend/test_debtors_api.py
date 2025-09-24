import requests
import json

# Replace with your local development server URL
BASE_URL = 'http://localhost:8000'

# Admin credentials
USERNAME = 'admin'
PASSWORD = 'admin123'


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


def test_debtors_endpoint(token):
    """Test the /api/billing/debtors/ endpoint."""
    if not token:
        print("Authentication token not available. Skipping test.")
        return

    headers = {'Authorization': f'Bearer {token}'}
    try:
        response = requests.get(f'{BASE_URL}/api/billing/debtors/', headers=headers)
        print(f"GET /api/billing/debtors/ - Status Code: {response.status_code}")
        
        # Check if the response is successful
        if response.status_code == 200:
            print("Debtors endpoint test PASSED.")
            # print("Response JSON:")
            # print(json.dumps(response.json(), indent=2))
        else:
            print("Debtors endpoint test FAILED.")
            print("Response Text:")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"Error testing debtors endpoint: {e}")

if __name__ == '__main__':
    print("--- Running Critical-Path Test for Debtors API ---")
    auth_token = get_auth_token()
    test_debtors_endpoint(auth_token)
    print("--- Test Complete ---")
