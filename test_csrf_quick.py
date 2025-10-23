#!/usr/bin/env python3
"""
Quick test for CSRF issue on /auth/login
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auth_login():
    """Test the problematic /auth/login endpoint"""
    
    print("Testing /auth/login endpoint...")
    
    # First, get CSRF token
    try:
        csrf_response = requests.get(f"{BASE_URL}/auth/get-csrf-token")
        print(f"CSRF token request: {csrf_response.status_code}")
        
        csrf_token = None
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            print(f"CSRF token received: {csrf_token[:20]}..." if csrf_token else "No token")
    except Exception as e:
        print(f"CSRF token error: {e}")
        csrf_token = None
    
    # Test login
    test_data = {
        "username": "admin", 
        "password": "admin123"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if csrf_token:
        headers["X-CSRFToken"] = csrf_token
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=test_data,
            headers=headers
        )
        
        print(f"\nLogin test result:")
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 403 and "CSRF" in response.text:
            print("\n❌ CSRF error still present!")
        elif response.status_code in [200, 400, 401]:
            print("\n✅ CSRF error resolved!")
        else:
            print(f"\n⚠️ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"Login request error: {e}")

if __name__ == "__main__":
    test_auth_login()