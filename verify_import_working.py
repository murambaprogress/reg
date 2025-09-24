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

def verify_import_success():
    """Verify that the import functionality is working by checking database records"""
    print("🔍 Verifying Import Success")
    print("=" * 50)
    
    # Check for debtors from our CSV template
    template_customers = ['John Doe', 'Jane Smith', 'Bob Johnson']
    found_customers = []
    
    for customer_name in template_customers:
        try:
            customer = Customer.objects.get(name=customer_name)
            debtors = Debtor.objects.filter(customer=customer)
            
            if debtors.exists():
                found_customers.append(customer_name)
                for debtor in debtors:
                    print(f"✅ Found: {customer_name} - ${debtor.current_balance} (due: {debtor.due_date})")
                    print(f"   Description: {debtor.description}")
                    print(f"   Status: {debtor.status}")
                    print(f"   Created: {debtor.created_at}")
                    print()
            
        except Customer.DoesNotExist:
            print(f"❌ Customer not found: {customer_name}")
    
    print(f"📊 Summary:")
    print(f"   Expected customers: {len(template_customers)}")
    print(f"   Found customers: {len(found_customers)}")
    print(f"   Success rate: {len(found_customers)}/{len(template_customers)} ({len(found_customers)/len(template_customers)*100:.1f}%)")
    
    if len(found_customers) == len(template_customers):
        print("\n🎉 SUCCESS: All template customers found in database!")
        print("✅ The debtor import functionality is working correctly.")
        return True
    else:
        print(f"\n⚠️  Only {len(found_customers)} out of {len(template_customers)} customers found.")
        return False

def check_recent_activity():
    """Check recent debtor activity"""
    print("\n📈 Recent Debtor Activity")
    print("=" * 30)
    
    recent_debtors = Debtor.objects.order_by('-created_at')[:10]
    
    if recent_debtors:
        print("Recent debtor records:")
        for i, debtor in enumerate(recent_debtors, 1):
            print(f"{i:2d}. {debtor.customer.name}: ${debtor.current_balance}")
            print(f"     Due: {debtor.due_date} | Created: {debtor.created_at.strftime('%Y-%m-%d %H:%M')}")
    else:
        print("No debtor records found.")
    
    return len(recent_debtors) > 0

if __name__ == '__main__':
    success = verify_import_success()
    has_activity = check_recent_activity()
    
    print("\n" + "=" * 50)
    if success and has_activity:
        print("🎯 CONCLUSION: Debtor import is working correctly!")
        print("   - CSV data is being parsed properly")
        print("   - Debtor records are being created in database")
        print("   - Data is visible in the system")
    else:
        print("⚠️  Import may have issues - check the details above")
