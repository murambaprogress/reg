#!/usr/bin/env python
import os
import sys
import json
import django
from django.test import TestCase, Client
from django.conf import settings
from django.contrib.auth import get_user_model

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from inventory.models import Customer

def test_invoice_creation():
    """Test invoice creation to ensure no TransactionManagementError"""
    client = Client()

    # Create or get a test user
    User = get_user_model()
    try:
        user = User.objects.get(username='admin')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='admin',
            password='admin',
            email='admin@test.com',
            is_staff=True,
            is_superuser=True
        )

    # Create or get a test customer
    try:
        customer = Customer.objects.get(name='Test Customer')
    except Customer.DoesNotExist:
        customer = Customer.objects.create(
            name='Test Customer',
            phone='123456789',
            email='test@example.com',
            address='Test Address'
        )

    # Login the user
    client.login(username='admin', password='admin')

    print("Testing invoice creation...")

    # Prepare invoice data
    invoice_data = {
        'customer': customer.id,
        'invoice_number': 'TEST-001',
        'subtotal': 100.00,
        'tax_rate': 15.00,
        'discount_amount': 0.00,
        'due_date': '2025-12-31',
        'notes': 'Test invoice'
    }

    # Post to create invoice
    response = client.post('/api/billing/invoices/', data=json.dumps(invoice_data), content_type='application/json')

    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ Invoice created successfully!")
        print(f"Response: {response.json()}")
    elif response.status_code == 400:
        print("❌ Bad request - validation error")
        print(f"Errors: {response.json()}")
    elif response.status_code == 500:
        print("❌ Internal server error - TransactionManagementError likely")
        print(f"Response: {response.content}")
    else:
        print(f"⚠️ Unexpected status: {response.status_code}")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_invoice_creation()
