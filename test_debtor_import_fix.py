#!/usr/bin/env python3
"""
Test script to verify the debtor import fix
"""
import os
import sys
import django
import requests
import csv
from datetime import datetime

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from billing.models import Debtor
from inventory.models import Customer

User = get_user_model()

def create_test_csv():
    """Create a test CSV file for import"""
    filename = 'test_debtor_import_fixed.csv'
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        
        # Write header
        writer.writerow(['Customer Name', 'Amount', 'Due Date', 'Description'])
        
        # Write test data
        writer.writerow(['Test Customer 1', '1500.00', '2024-12-31', 'Test debt 1'])
        writer.writerow(['Test Customer 2', '2750.50', '2024-11-15', 'Test debt 2'])
        writer.writerow(['Test Customer 3', '890.25', '2024-10-30', 'Test debt 3'])
    
    print(f"Created test CSV file: {filename}")
    return filename

def test_import_endpoint():
    """Test the import endpoint directly"""
    print("\n=== Testing Debtor Import Fix ===")
    
    # Create test CSV
    csv_file = create_test_csv()
    
    try:
        # Get initial counts
        initial_debtor_count = Debtor.objects.count()
        initial_customer_count = Customer.objects.count()
        
        print(f"Initial debtors: {initial_debtor_count}")
        print(f"Initial customers: {initial_customer_count}")
        
        # Test the import endpoint
        url = "http://localhost:8000/api/billing/debtors/import/"
        
        # Create a test user for authentication (if needed)
        try:
            user = User.objects.get(username='admin')
        except User.DoesNotExist:
            user = User.objects.create_user(
                username='admin',
                email='admin@test.com',
                password='admin123',
                role='admin'
            )
        
        # For testing, we'll simulate the import process directly
        from billing.views.imports import import_debtors
        from django.test import RequestFactory
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a mock request
        factory = RequestFactory()
        
        # Read the CSV file
        with open(csv_file, 'rb') as f:
            file_content = f.read()
        
        uploaded_file = SimpleUploadedFile(
            name=csv_file,
            content=file_content,
            content_type='text/csv'
        )
        
        request = factory.post('/api/billing/debtors/import/', data={'file': uploaded_file}, format='multipart')
        request.user = user
        
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
                
        else:
            print(f"❌ IMPORT FAILED: Status {response.status_code}")
            print(f"Error: {response.data}")
            
    except Exception as e:
        print(f"❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test file
        if os.path.exists(csv_file):
            os.remove(csv_file)
            print(f"\nCleaned up test file: {csv_file}")

if __name__ == "__main__":
    test_import_endpoint()
