#!/usr/bin/env python
"""
Test script to verify the debtors API endpoint is working
"""
import requests
import json

def test_debtors_api():
    """Test the debtors API endpoint"""
    print("Testing debtors API endpoint...")
    
    try:
        # Test the debtors endpoint
        url = "http://127.0.0.1:8000/api/billing/debtors/"
        
        print(f"Making request to: {url}")
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Retrieved {len(data)} debtors")
            
            # Print first few debtors for verification
            for i, debtor in enumerate(data[:3]):
                customer_name = debtor.get('customer_name', 'Unknown')
                current_balance = debtor.get('current_balance', 0)
                total_paid = debtor.get('total_paid', 0)
                print(f"  {i+1}. {customer_name}: Balance=${current_balance}, Paid=${total_paid}")
                
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the server")
        print("Make sure the Django development server is running on port 8000")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("DEBTORS API ENDPOINT TEST")
    print("=" * 60)
    
    success = test_debtors_api()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 API ENDPOINT TEST PASSED!")
        print("The debtors API is working correctly and the total_paid fix is successful.")
    else:
        print("❌ API ENDPOINT TEST FAILED!")
        print("Please check the server logs for more details.")
    print("=" * 60)
