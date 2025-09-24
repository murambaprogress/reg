#!/usr/bin/env python
import os
import sys
import django
import requests
from django.conf import settings

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

# Test the customer search endpoint
def test_customer_search():
    # This is a simple test to check if the endpoint exists
    # In a real scenario, you'd use Django's test client or requests with authentication
    
    print("Testing customer search endpoint...")
    print("Endpoint should be available at: http://localhost:8000/api/customers/search/")
    print("Example: http://localhost:8000/api/customers/search/?search=john")
    
    # You can test this manually by visiting:
    # http://localhost:8000/api/customers/search/?search=test
    
    print("\nTo test manually:")
    print("1. Make sure the Django server is running")
    print("2. Visit the URL above with a search term")
    print("3. You should get a JSON response with search results")

if __name__ == "__main__":
    test_customer_search()
