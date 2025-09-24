#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.urls import get_resolver, reverse

def test_billing_urls():
    print("Testing billing URL patterns...")
    
    # Get the URL resolver
    resolver = get_resolver()
    
    # Look for debtors-related patterns
    print("\nDebtors-related URL patterns:")
    for pattern in resolver.reverse_dict:
        if 'debtor' in str(pattern).lower():
            print(f"Pattern: {pattern}")
            reverse_info = resolver.reverse_dict.get(pattern)
            print(f"  Reverse info: {reverse_info}")
            
            # Try to get the URL
            try:
                if hasattr(pattern, 'name') and pattern.name:
                    url = reverse(pattern.name)
                    print(f"  URL: {url}")
            except Exception as e:
                print(f"  Error getting URL: {e}")
            print()

def test_specific_urls():
    print("\nTesting specific URLs:")
    
    # Test the bulk-import URL
    try:
        url = reverse('debtor-bulk-import')
        print(f"Bulk import URL: {url}")
    except Exception as e:
        print(f"Error getting bulk-import URL: {e}")
        
    # Test other debtors URLs
    try:
        url = reverse('debtor-list')
        print(f"Debtor list URL: {url}")
    except Exception as e:
        print(f"Error getting debtor list URL: {e}")

if __name__ == '__main__':
    test_billing_urls()
    test_specific_urls()
