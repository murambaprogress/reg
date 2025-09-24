import os
import django
from django.test import Client

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

# Create test client
client = Client()

print("Testing customer endpoints...")

# Test the main customers endpoint
print("\n1. Testing /api/customers/ endpoint:")
response = client.get('/api/customers/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response: {data}")
        if isinstance(data, list):
            print(f"Number of customers: {len(data)}")
        else:
            print("Response is not a list")
    except:
        print("Could not parse JSON response")
else:
    print(f"Error: {response.content}")

# Test the search endpoint with empty search
print("\n2. Testing /api/customers/search/ endpoint (empty search):")
response = client.get('/api/customers/search/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response: {data}")
    except:
        print("Could not parse JSON response")
else:
    print(f"Error: {response.content}")

# Test the search endpoint with a search term
print("\n3. Testing /api/customers/search/ endpoint (with search term):")
response = client.get('/api/customers/search/?search=test')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response: {data}")
    except:
        print("Could not parse JSON response")
else:
    print(f"Error: {response.content}")
