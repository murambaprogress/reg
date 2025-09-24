#!/usr/bin/env python3
"""
Simple test script to verify the debtor import fix
"""
import os
import sys
import django
import csv
from datetime import datetime
from io import StringIO

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from billing.models import Debtor
from inventory.models import Customer
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory
from billing.views.imports import import_debtors

User = get_user_model()

def test_import_fix():
    """Test the import fix directly"""
    print("\n=== Testing Debtor Import Fix ===")
    
    # Create test CSV content
    csv_content = """Customer Name,Amount,Due Date,Description
Test Customer 1,1500.00,2024-12-31,Test debt 1
Test Customer 2,2750.50,2024-11-15,Test debt 2
Test Customer 3,890.25,2024-10-30,Test debt 3"""
    
    try:
        # Get initial counts
        initial_debtor_count = Debtor.objects.count()
        initial_customer_count = Customer.objects.count()
        
        print(f"Initial debtors: {initial_debtor_count}")
        print(f"Initial customers: {initial_customer_count}")
        
        # Create a test user for authentication
        try:
            user = User.objects.get(username='admin')
        except User.DoesNotExist:
            user = User.objects.create_user(
                username='admin',
                email='admin@test.com',
                password='admin123',
                role='admin'
            )
        
        # Create uploaded file
        uploaded_file = SimpleUploadedFile(
            name='test.csv',
            content=csv_content.encode('utf-8'),
            content_type='text/csv'
        )
        
        # Create mock request with proper FILES handling
        factory = RequestFactory()
        request = factory.post('/api/billing/debtors/import/')
        request.user = user
        
        # Manually add the file to request.FILES
        from django.utils.datastructures import MultiValueDict
        request.FILES = MultiValueDict({'file': [uploaded_file]})
        
        # Call the import function
        response = import_debtors(request)
        
        print(f"\nImport Response Status: {response.status_code}")
        print(f"Import Response Data: {response.data}")
        
        # Check final counts
        final_debtor_count = Debtor.objects.count()
        final_customer_count = Customer.objects.count()
        
        print(f"\nFinal debtors: {final_debtor_count}")
        print(f"Final customers: {final_customer_count}")
        
        # Verify the fix
        debtors_created = final_debtor_count - initial_debtor_count
        customers_created = final_customer_count - initial_customer_count
        
        print(f"\nDebtors created: {debtors_created}")
        print(f"Customers created: {customers_created}")
        
        # Check response data
        if response.status_code == 200:
            data = response.data
            success_count = data.get('success_count', 0)
            error_count = data.get('error_count', 0)
            transactions_processed = data.get('transactions_processed', 0)
            
            print(f"\nResponse Analysis:")
            print(f"Success count: {success_count}")
            print(f"Error count: {error_count}")
            print(f"Transactions processed: {transactions_processed}")
            
            if transactions_processed > 0:
                print("✅ FIX SUCCESSFUL: transactions_processed is now > 0")
            else:
                print("❌ FIX FAILED: transactions_processed is still 0")
                
            if success_count > 0 and debtors_created > 0:
                print("✅ RECORDS SAVED: Debtors were actually created in database")
            else:
                print("❌ RECORDS NOT SAVED: No debtors were created despite success count")
                
            # Show created records
            if debtors_created > 0:
                print(f"\n📋 Created Debtors:")
                recent_debtors = Debtor.objects.order_by('-id')[:debtors_created]
                for debtor in recent_debtors:
                    print(f"  - {debtor.customer.name}: ${debtor.initial_amount}")
                    
        else:
            print(f"❌ IMPORT FAILED: Status {response.status_code}")
            print(f"Error: {response.data}")
            
    except Exception as e:
        print(f"❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_import_fix()
