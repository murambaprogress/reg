#!/usr/bin/env python
"""
Complete test to verify the debtor total_paid property fix
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
from billing.main_views import DebtorViewSet
from django.test import RequestFactory
from django.contrib.auth.models import User
from decimal import Decimal

def test_model_annotation():
    """Test that the Debtor model can handle total_paid annotation"""
    print("1. Testing Debtor model annotation...")
    
    try:
        # Test the exact annotation from the viewset
        total_paid_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            total=Sum('amount_paid')
        ).values('total')

        queryset = Debtor.objects.annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
        ).select_related('customer')
        
        # This was causing the AttributeError before the fix
        debtors = list(queryset[:5])
        
        print(f"   ✅ Successfully queried {len(debtors)} debtors with annotation")
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_viewset_queryset():
    """Test the DebtorViewSet get_queryset method"""
    print("2. Testing DebtorViewSet queryset...")
    
    try:
        # Create a mock request
        factory = RequestFactory()
        request = factory.get('/api/billing/debtors/')
        
        # Get or create a user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        request.user = user
        
        # Test the viewset
        viewset = DebtorViewSet()
        viewset.request = request
        
        # This should work without errors now
        queryset = viewset.get_queryset()
        debtors = list(queryset[:5])
        
        print(f"   ✅ ViewSet queryset successful: {len(debtors)} debtors")
        
        # Test individual debtor properties
        for debtor in debtors[:3]:
            print(f"      - {debtor.customer.name}: Balance=${debtor.current_balance}, Total Paid=${debtor.total_paid}")
            
        return True
        
    except Exception as e:
        print(f"   ❌ ViewSet error: {e}")
        return False

def test_property_access():
    """Test accessing the total_paid property directly"""
    print("3. Testing total_paid property access...")
    
    try:
        # Get a debtor and test property access
        debtor = Debtor.objects.select_related('customer').first()
        if debtor:
            # Test direct property access
            total_paid = debtor.total_paid
            print(f"   ✅ Direct property access: {debtor.customer.name} - Total Paid: ${total_paid}")
            
            # Test with annotation
            annotated_debtor = Debtor.objects.annotate(
                total_paid=Subquery(
                    DebtorPayment.objects.filter(debtor=OuterRef('pk'))
                    .values('debtor').annotate(total=Sum('amount_paid')).values('total'),
                    output_field=DecimalField()
                )
            ).select_related('customer').first()
            
            if annotated_debtor:
                annotated_total = annotated_debtor.total_paid
                print(f"   ✅ Annotated property access: {annotated_debtor.customer.name} - Total Paid: ${annotated_total}")
            
            return True
        else:
            print("   ⚠️  No debtors found in database")
            return True
            
    except Exception as e:
        print(f"   ❌ Property access error: {e}")
        return False

def test_serializer_compatibility():
    """Test that serializers work with the fixed model"""
    print("4. Testing serializer compatibility...")
    
    try:
        from billing.serializers import DebtorListSerializer
        
        # Get annotated queryset like the viewset does
        total_paid_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            total=Sum('amount_paid')
        ).values('total')

        queryset = Debtor.objects.annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
        ).select_related('customer')[:3]
        
        # Test serialization
        serializer = DebtorListSerializer(queryset, many=True)
        data = serializer.data
        
        print(f"   ✅ Serialization successful: {len(data)} debtors serialized")
        
        # Check that total_paid is in the serialized data
        for item in data:
            if 'total_paid' in item:
                print(f"      - {item.get('customer_name', 'Unknown')}: Total Paid=${item['total_paid']}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Serializer error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("COMPLETE DEBTOR TOTAL_PAID FIX VERIFICATION")
    print("=" * 70)
    
    tests = [
        test_model_annotation,
        test_viewset_queryset,
        test_property_access,
        test_serializer_compatibility
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
        print()
    
    print("=" * 70)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ALL {total} TESTS PASSED!")
        print("The total_paid property fix is working correctly.")
        print("The debtors API endpoint should now work without errors.")
    else:
        print(f"❌ {total - passed} out of {total} tests failed.")
        print("Please check the errors above.")
    
    print("=" * 70)
