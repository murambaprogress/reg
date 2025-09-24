#!/usr/bin/env python
import os
import sys
import django
from django.test import TestCase, Client
from django.conf import settings

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

def test_endpoints():
    """Test that the endpoints are properly configured"""
    client = Client()
    
    print("Testing endpoint configurations...")
    
    # Test debtors endpoint (should not return 500 error anymore)
    print("1. Testing /api/billing/debtors/ endpoint...")
    response = client.get('/api/billing/debtors/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 500:
        print("   ❌ Still getting 500 error - the fix may not be working")
    else:
        print("   ✅ No 500 error - fix appears to be working")
    
    # Test customers search endpoint (should exist now)
    print("\n2. Testing /api/customers/search/ endpoint...")
    response = client.get('/api/customers/search/?search=test')
    print(f"   Status: {response.status_code}")
    if response.status_code == 404:
        print("   ❌ 404 error - search endpoint not found")
    elif response.status_code == 200:
        print("   ✅ Search endpoint is working!")
    else:
        print(f"   ⚠️  Got status {response.status_code} - endpoint exists but may need authentication")
    
    print("\nNote: Authentication may be required for full functionality.")
    print("The main goal is to ensure the endpoints are properly configured and not returning 500/404 errors.")

if __name__ == "__main__":
    test_endpoints()
