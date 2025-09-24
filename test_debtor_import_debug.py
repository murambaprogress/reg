#!/usr/bin/env python3

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from billing.models import Debtor, DebtorPayment
from inventory.models import Customer
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime

def test_debtor_creation():
    """Test creating a debtor record manually to see what works"""
    print("Testing debtor creation...")
    
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={'email': 'test@example.com'}
        )
        print(f"User: {user} (created: {created})")
        
        # Get or create a test customer
        customer, created = Customer.objects.get_or_create(
            name='Test Customer',
            defaults={
                'phone': '123-456-7890',
                'email': 'customer@example.com',
                'address': '123 Test St'
            }
        )
        print(f"Customer: {customer} (created: {created})")
        
        # Try to create a debtor record
        debtor = Debtor.objects.create(
            customer=customer,
            initial_amount=Decimal('100.00'),
            current_balance=Decimal('100.00'),
            due_date=datetime.now().date(),
            description='Test debt',
            created_by=user
        )
        print(f"Debtor created successfully: {debtor}")
        
        # List all debtors
        all_debtors = Debtor.objects.all()
        print(f"Total debtors in database: {all_debtors.count()}")
        for d in all_debtors:
            print(f"  - {d}")
            
        return True
        
    except Exception as e:
        print(f"Error creating debtor: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_model_fields():
    """Check what fields are available in the Debtor model"""
    print("\nDebtor model fields:")
    for field in Debtor._meta.fields:
        print(f"  - {field.name}: {field.__class__.__name__}")

if __name__ == '__main__':
    check_model_fields()
    test_debtor_creation()
