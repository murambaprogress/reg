import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

# Create a test client
client = Client()

# Create or get a test user for authentication
User = get_user_model()
try:
    user = User.objects.get(username='testuser')
except User.DoesNotExist:
    user = User.objects.create_user(username='testuser', password='testpass')
    user.role = 'admin'  # Set role if needed
    user.save()

# Generate JWT token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

# Test the customer API endpoint
print("Testing /api/customers/ endpoint...")
response = client.get('/api/customers/', HTTP_AUTHORIZATION=f'Bearer {access_token}')

print(f"Status Code: {response.status_code}")
print(f"Response Headers: {dict(response.items())}")

if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response Type: {type(data)}")
        print(f"Response Data: {json.dumps(data, indent=2)}")
        
        if isinstance(data, list):
            print(f"Number of customers: {len(data)}")
        elif isinstance(data, dict):
            if 'results' in data:
                print(f"Paginated response with {len(data['results'])} customers")
            else:
                print("Dict response without 'results' key")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Raw response: {response.content}")
else:
    print(f"Error response: {response.content}")
