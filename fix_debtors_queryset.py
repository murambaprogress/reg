"""
Fix for DebtorViewSet get_queryset method to properly handle queryset annotations
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.db.models import Sum, Subquery, OuterRef, DecimalField, Max, F, ExpressionWrapper, IntegerField, DateField
from django.utils import timezone
from billing.models import Debtor, DebtorPayment
from django.test import RequestFactory
from django.contrib.auth.models import User

def apply_fix():
    """Apply the fix to ensure the queryset works"""
    print("Applying DebtorViewSet fix...")
    
    try:
        # Test the queryset with annotations
        total_paid_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            total=Sum('amount_paid')
        ).values('total')

        last_payment_date_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            last_date=Max('payment_date')
        ).values('last_date')

        queryset = Debtor.objects.annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField()),
            last_payment_date=Subquery(last_payment_date_subquery, output_field=DateField()),
            days_due_calc=ExpressionWrapper(
                F('due_date') - timezone.now().date(),
                output_field=IntegerField()
            )
        ).select_related('customer')

        # Test the queryset
        debtors = list(queryset[:5])
        print(f"Successfully retrieved {len(debtors)} debtors")
        print("✅ Fix applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying fix: {str(e)}")
        return False

if __name__ == "__main__":
    success = apply_fix()
    if not success:
        print("Please check the backend logs for more details.")