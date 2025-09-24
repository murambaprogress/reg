#!/usr/bin/env python
"""
Test script to verify the debtor total_paid property fix
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.db.models import Sum, Subquery, OuterRef, DecimalField
from billing.models import Debtor, DebtorPayment
from decimal import Decimal

def test_debtor_annotation():
    """Test that the Debtor model can handle total_paid annotation"""
    print("Testing Debtor total_paid annotation fix...")
    
    try:
        # Test the annotation that was causing the error
        total_paid_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            total=Sum('amount_paid')
        ).values('total')

        # This should not raise an AttributeError anymore
        queryset = Debtor.objects.annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
        ).select_related('customer')
        
        # Try to iterate through the queryset (this is where the error occurred)
        debtors = list(queryset[:5])  # Limit to first 5 for testing
        
        print(f"✅ Successfully queried {len(debtors)} debtors with total_paid annotation")
        
        # Test individual debtor properties
        for debtor in debtors:
            print(f"  - {debtor.customer.name}: Balance=${debtor.current_balance}, Total Paid=${debtor.total_paid}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_api_endpoint():
    """Test the API endpoint that was failing"""
    print("\nTesting API endpoint simulation...")
    
    try:
        from billing.main_views import DebtorViewSet
        from django.test import RequestFactory
        from django.contrib.auth.models import User
        
        # Create a mock request
        factory = RequestFactory()
        request = factory.get('/api/billing/debtors/')
        
        # Create a mock user (or get existing one)
        try:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user('testuser', 'test@example.com', 'testpass')
        except:
            user = None
            
        request.user = user
        
        # Create viewset instance and test get_queryset
        viewset = DebtorViewSet()
        viewset.request = request
        
        queryset = viewset.get_queryset()
        debtors = list(queryset[:5])  # This should work now
        
        print(f"✅ API endpoint simulation successful: {len(debtors)} debtors retrieved")
        return True
        
    except Exception as e:
        print(f"❌ API endpoint error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("DEBTOR TOTAL_PAID PROPERTY FIX TEST")
    print("=" * 60)
    
    success1 = test_debtor_annotation()
    success2 = test_api_endpoint()
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("🎉 ALL TESTS PASSED! The fix is working correctly.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    print("=" * 60)
