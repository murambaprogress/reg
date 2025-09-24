#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append('backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from billing.views.imports import import_debtors
from billing.models import Debtor
from inventory.models import Customer
from api.models import User

def test_simple_import():
    print("Testing simple debtor import format...")
    
    # Create a test user
    try:
        user = User.objects.get(username='testuser')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser', 
            email='testuser@example.com',
            password='testpass',
            role='admin'
        )
    
    # Create request factory
    factory = RequestFactory()
    
    # Read the test CSV file
    with open('test_simple_debtors_import.csv', 'rb') as f:
        csv_content = f.read()
    
    # Create uploaded file
    uploaded_file = SimpleUploadedFile(
        name='test_simple_debtors_import.csv',
        content=csv_content,
        content_type='text/csv'
    )
    
    # Create POST request
    request = factory.post('/api/billing/import-debtors/', {'file': uploaded_file})
    request.user = user
    
    # Clear existing test data
    Debtor.objects.filter(customer__name__in=['John Doe', 'Jane Smith', 'Bob Johnson']).delete()
    Customer.objects.filter(name__in=['John Doe', 'Jane Smith', 'Bob Johnson']).delete()
    
    # Call the import function
    response = import_debtors(request)
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    # Check if debtors were created
    debtors = Debtor.objects.filter(customer__name__in=['John Doe', 'Jane Smith', 'Bob Johnson'])
    print(f"Created {debtors.count()} debtors:")
    
    for debtor in debtors:
        print(f"  - {debtor.customer.name}: ${debtor.current_balance} due {debtor.due_date}")
        print(f"    Description: {debtor.description}")
    
    return response.status_code == 200

if __name__ == '__main__':
    success = test_simple_import()
    if success:
        print("\n✅ Test passed! Simple import format is working.")
    else:
        print("\n❌ Test failed! There are still issues with the import.")
