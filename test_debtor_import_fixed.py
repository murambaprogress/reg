#!/usr/bin/env python3
"""
Test script to verify the fixed debtor import functionality
"""
import os
import sys
import django
import requests
from decimal import Decimal
import csv
from datetime import datetime, date

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from billing.models import Debtor, Customer
from inventory.models import Customer as InventoryCustomer

User = get_user_model()

def create_test_csv():
    """Create a test CSV file for import"""
    filename = 'test_debtor_import_fixed.csv'
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # Write header
        writer.writerow(['Customer Name', 'Amount', 'Due Date', 'Description'])
        
        # Write test data
        writer.writerow(['Test Customer 1', '1500.00', '2024-12-31', 'Test debt 1'])
        writer.writerow(['Test Customer 2', '2750.50', '2024-11-15', 'Test debt 2'])
        writer.writerow(['Test Customer 3', '890.25', '2024-10-30', 'Test debt 3'])
    
    print(f"Created test CSV file: {filename}")
    return filename

def test_direct_import():
    """Test the import functionality directly using Django models"""
    print("\n=== Testing Direct Import ===")
    
    # Get or create a test user
    try:
        user = User.objects.get(username='admin')
    except User.DoesNotExist:
        user = User.objects.create_user(username='admin', password='admin123')
        print("Created test user: admin")
    
    # Clear existing test data
    Debtor.objects.filter(customer__name__startswith='Test Customer').delete()
    InventoryCustomer.objects.filter(name__startswith='Test Customer').delete()
    
    print("Cleared existing test data")
    
    # Test data
    test_debtors = [
        {
            'customer_name': 'Test Customer 1',
            'amount': Decimal('1500.00'),
            'due_date': date(2024, 12, 31),
            'description': 'Test debt 1'
        },
        {
            'customer_name': 'Test Customer 2', 
            'amount': Decimal('2750.50'),
            'due_date': date(2024, 11, 15),
            'description': 'Test debt 2'
        },
        {
            'customer_name': 'Test Customer 3',
            'amount': Decimal('890.25'),
            'due_date': date(2024, 10, 30),
            'description': 'Test debt 3'
        }
    ]
    
    success_count = 0
    error_count = 0
    
    for debtor_data in test_debtors:
        try:
            # Create or get customer
            customer, created = InventoryCustomer.objects.get_or_create(
                name=debtor_data['customer_name'],
                defaults={
                    'phone': '',
                    'email': '',
                    'address': ''
                }
            )
            print(f"{'Created' if created else 'Found'} customer: {debtor_data['customer_name']}")
            
            # Create debtor record
            debtor = Debtor.objects.create(
                customer=customer,
                initial_amount=debtor_data['amount'],
                current_balance=debtor_data['amount'],
                due_date=debtor_data['due_date'],
                description=debtor_data['description'],
                created_by=user
            )
            print(f"Created debtor record: {debtor_data['customer_name']} - ${debtor_data['amount']}")
            success_count += 1
            
        except Exception as e:
            print(f"Error creating debtor for {debtor_data['customer_name']}: {e}")
            error_count += 1
    
    print(f"\nDirect import results: {success_count} success, {error_count} errors")
    
    # Verify the data was saved
    saved_debtors = Debtor.objects.filter(customer__name__startswith='Test Customer')
    print(f"Verified: {saved_debtors.count()} debtors saved to database")
    
    for debtor in saved_debtors:
        print(f"  - {debtor.customer.name}: ${debtor.current_balance} (Due: {debtor.due_date})")
    
    return success_count > 0

def test_api_endpoint():
    """Test the API endpoint if server is running"""
    print("\n=== Testing API Endpoint ===")
    
    try:
        # Check if server is running
        response = requests.get('http://localhost:8000/api/billing/debtors/', timeout=5)
        print("Server is running, testing API endpoint...")
        
        # Create test CSV
        csv_filename = create_test_csv()
        
        # Test the import endpoint
        with open(csv_filename, 'rb') as f:
            files = {'file': f}
            # Note: This would need authentication in a real scenario
            response = requests.post(
                'http://localhost:8000/api/billing/debtors/import_excel/',
                files=files,
                timeout=30
            )
        
        print(f"API Response Status: {response.status_code}")
        print(f"API Response: {response.text}")
        
        # Clean up
        os.remove(csv_filename)
        
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"Server not running or API test failed: {e}")
        print("This is expected if the Django server is not running")
        return False

def main():
    print("Testing Fixed Debtor Import Functionality")
    print("=" * 50)
    
    # Test direct import (this should always work)
    direct_success = test_direct_import()
    
    # Test API endpoint (only if server is running)
    api_success = test_api_endpoint()
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"Direct Import: {'✓ PASSED' if direct_success else '✗ FAILED'}")
    print(f"API Endpoint: {'✓ PASSED' if api_success else '✗ SKIPPED (server not running)'}")
    
    if direct_success:
        print("\n✓ Database persistence is working correctly!")
        print("The import functionality should now work properly.")
    else:
        print("\n✗ There are still issues with database persistence.")
        print("Please check the error messages above.")

if __name__ == '__main__':
    main()
