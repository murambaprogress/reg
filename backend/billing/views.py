from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from datetime import datetime, timedelta
from django.db import transaction

from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorContact, BillingStats
)
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, InvoiceListSerializer,
    ExpenseSerializer, ExpenseListSerializer, PaymentSerializer,
    DebtorSerializer, DebtorListSerializer, DebtorContactSerializer,
    BillingStatsSerializer
)
from jobs.models import Job, PartsRequest
from inventory.models import Part


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices"""
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        elif self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        queryset = Invoice.objects.select_related('customer', 'job').prefetch_related('items', 'payments')
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(vehicle_model__icontains=search) |
                Q(vehicle_plate__icontains=search) |
                Q(service_description__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_range = self.request.query_params.get('date_range', None)
        if date_range:
            today = timezone.now().date()
            if date_range == 'this-week':
                start_date = today - timedelta(days=today.weekday())
                queryset = queryset.filter(invoice_date__gte=start_date)
            elif date_range == 'this-month':
                start_date = today.replace(day=1)
                queryset = queryset.filter(invoice_date__gte=start_date)
            elif date_range == 'last-month':
                first_day_this_month = today.replace(day=1)
                last_month = first_day_this_month - timedelta(days=1)
                start_date = last_month.replace(day=1)
                queryset = queryset.filter(
                    invoice_date__gte=start_date,
                    invoice_date__lt=first_day_this_month
                )
            elif date_range == 'this-quarter':
                quarter = (today.month - 1) // 3 + 1
                start_date = datetime(today.year, (quarter - 1) * 3 + 1, 1).date()
                queryset = queryset.filter(invoice_date__gte=start_date)
            elif date_range == 'this-year':
                start_date = datetime(today.year, 1, 1).date()
                queryset = queryset.filter(invoice_date__gte=start_date)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='prefill')
    def prefill_from_job(self, request):
        """Return data that frontend can use to pre-fill an invoice form for a given job.

        Query params:
            job_id: required job primary key
        Returns auto-generated invoice draft data mirroring InvoiceCreateSerializer input.
        """
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response({'detail': 'job_id query param is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            job = Job.objects.get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        # Build items draft (service + approved/fulfilled parts requests)
        items = []
        service_cost = job.actual_cost or job.estimated_cost or 0
        if service_cost:
            items.append({
                'item_type': 'service',
                'description': job.service_description[:250],
                'quantity': 1,
                'unit_price': service_cost,
                'total_price': service_cost,
                'part_number': ''
            })

        parts_requests = PartsRequest.objects.filter(job=job, status__in=['approved', 'fulfilled'])
        subtotal = service_cost
        for pr in parts_requests:
            unit_price = 0
            try:
                part_obj = Part.objects.get(part_number=pr.part_number)
                unit_price = part_obj.unit_cost
            except Part.DoesNotExist:
                pass
            total_price = unit_price * pr.quantity_requested
            subtotal += total_price
            items.append({
                'item_type': 'part',
                'description': pr.part_name[:255],
                'quantity': pr.quantity_requested,
                'unit_price': unit_price,
                'total_price': total_price,
                'part_number': pr.part_number
            })

        data = {
            'job': job.id,
            'customer': job.customer.id,
            'customer_name': job.customer.name,
            'customer_phone': job.customer.phone,
            'customer_email': job.customer.email,
            'vehicle_model': job.vehicle_model,
            'vehicle_plate': job.vehicle_plate,
            'service_description': job.service_description,
            'subtotal': subtotal,
            'tax_rate': 0,  # frontend can adjust
            'discount_amount': 0,
            'due_date': job.due_date,
            'notes': '',
            'items': items
        }
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark an invoice as paid"""
        invoice = self.get_object()
        payment_data = request.data
        
        with transaction.atomic():
            # Create payment record
            payment = Payment.objects.create(
                invoice=invoice,
                amount=payment_data.get('amount', invoice.total_amount),
                payment_method=payment_data.get('payment_method', 'cash'),
                payment_date=payment_data.get('payment_date', timezone.now().date()),
                reference_number=payment_data.get('reference_number', ''),
                notes=payment_data.get('notes', ''),
                recorded_by=request.user
            )
            
            # Update invoice status
            invoice.status = 'paid'
            invoice.paid_date = payment.payment_date
            invoice.payment_method = payment.payment_method
            invoice.save()
        
        return Response({'status': 'Invoice marked as paid'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics"""
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        
        stats = {
            'total_revenue': Invoice.objects.filter(status='paid').aggregate(
                Sum('total_amount'))['total_amount__sum'] or 0,
            'outstanding_invoices': Invoice.objects.filter(
                status__in=['sent', 'overdue']).aggregate(
                Sum('total_amount'))['total_amount__sum'] or 0,
            'paid_this_month': Invoice.objects.filter(
                status='paid', paid_date__gte=this_month_start).aggregate(
                Sum('total_amount'))['total_amount__sum'] or 0,
            'avg_invoice_value': Invoice.objects.aggregate(
                Avg('total_amount'))['total_amount__avg'] or 0,
        }
        
        return Response(stats)


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing expenses"""
    queryset = Expense.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        return ExpenseSerializer
    
    def get_queryset(self):
        queryset = Expense.objects.select_related('created_by', 'related_job')
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(expense_id__icontains=search) |
                Q(description__icontains=search) |
                Q(vendor__icontains=search) |
                Q(category__icontains=search)
            )
        
        # Filter by expense type
        expense_type = self.request.query_params.get('expense_type', None)
        if expense_type:
            queryset = queryset.filter(expense_type=expense_type)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range (same logic as invoices)
        date_range = self.request.query_params.get('date_range', None)
        if date_range:
            today = timezone.now().date()
            if date_range == 'this-week':
                start_date = today - timedelta(days=today.weekday())
                queryset = queryset.filter(expense_date__gte=start_date)
            elif date_range == 'this-month':
                start_date = today.replace(day=1)
                queryset = queryset.filter(expense_date__gte=start_date)
            elif date_range == 'last-month':
                first_day_this_month = today.replace(day=1)
                last_month = first_day_this_month - timedelta(days=1)
                start_date = last_month.replace(day=1)
                queryset = queryset.filter(
                    expense_date__gte=start_date,
                    expense_date__lt=first_day_this_month
                )
            elif date_range == 'this-quarter':
                quarter = (today.month - 1) // 3 + 1
                start_date = datetime(today.year, (quarter - 1) * 3 + 1, 1).date()
                queryset = queryset.filter(expense_date__gte=start_date)
            elif date_range == 'this-year':
                start_date = datetime(today.year, 1, 1).date()
                queryset = queryset.filter(expense_date__gte=start_date)
        
        return queryset.order_by('-expense_date')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark an expense as paid"""
        expense = self.get_object()
        expense.status = 'paid'
        expense.paid_date = request.data.get('paid_date', timezone.now().date())
        expense.payment_method = request.data.get('payment_method', expense.payment_method)
        expense.save()
        
        return Response({'status': 'Expense marked as paid'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get expense statistics"""
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        
        # Get expense type filter
        expense_type = request.query_params.get('expense_type', 'business')
        
        base_queryset = Expense.objects.filter(expense_type=expense_type)
        
        stats = {
            'total_expenses': base_queryset.aggregate(
                Sum('amount'))['amount__sum'] or 0,
            'parts_supplies_expenses': base_queryset.filter(
                category='parts_supplies').aggregate(
                Sum('amount'))['amount__sum'] or 0,
            'utilities_expenses': base_queryset.filter(
                category='utilities').aggregate(
                Sum('amount'))['amount__sum'] or 0,
            'equipment_expenses': base_queryset.filter(
                category='equipment').aggregate(
                Sum('amount'))['amount__sum'] or 0,
        }
        
        if expense_type == 'personal':
            stats.update({
                'admin_expenses': base_queryset.filter(
                    category__in=['office_supplies', 'other']).aggregate(
                    Sum('amount'))['amount__sum'] or 0,
                'travel_meals_expenses': base_queryset.filter(
                    category__in=['travel', 'meals']).aggregate(
                    Sum('amount'))['amount__sum'] or 0,
                'office_supplies_expenses': base_queryset.filter(
                    category='office_supplies').aggregate(
                    Sum('amount'))['amount__sum'] or 0,
                'professional_dev_expenses': base_queryset.filter(
                    category='professional_dev').aggregate(
                    Sum('amount'))['amount__sum'] or 0,
            })
        
        return Response(stats)


class DebtorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debtors"""
    queryset = Debtor.objects.all()
    serializer_class = DebtorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DebtorListSerializer
        return DebtorSerializer
    
    def get_queryset(self):
        queryset = Debtor.objects.select_related('customer').prefetch_related('contact_history')
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(customer__name__icontains=search) |
                Q(customer__phone__icontains=search) |
                Q(customer__email__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-total_outstanding')
    
    @action(detail=True, methods=['post'])
    def add_contact(self, request, pk=None):
        """Add a contact attempt to a debtor"""
        debtor = self.get_object()
        
        contact_data = request.data.copy()
        contact_data['debtor'] = debtor.id
        contact_data['contacted_by'] = request.user.id
        
        serializer = DebtorContactSerializer(data=contact_data)
        if serializer.is_valid():
            contact = serializer.save()
            
            # Update debtor's last contact date and attempt count
            debtor.last_contact_date = contact.contact_date
            debtor.contact_attempts += 1
            debtor.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_outstanding(self, request, pk=None):
        """Manually update outstanding amount for a debtor"""
        debtor = self.get_object()
        debtor.update_outstanding_amount()
        
        serializer = self.get_serializer(debtor)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def refresh_all(self, request):
        """Refresh outstanding amounts for all debtors"""
        debtors = Debtor.objects.all()
        for debtor in debtors:
            debtor.update_outstanding_amount()
        
        return Response({'status': f'Updated {debtors.count()} debtors'})


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('invoice', 'recorded_by')
        
        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        return queryset.order_by('-payment_date')
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class BillingStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for billing statistics"""
    queryset = BillingStats.objects.all()
    serializer_class = BillingStatsSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def calculate_stats(self, request):
        """Calculate and store billing statistics for a specific date"""
        stat_date = request.data.get('date', timezone.now().date())
        if isinstance(stat_date, str):
            stat_date = datetime.strptime(stat_date, '%Y-%m-%d').date()
        
        # Calculate stats
        month_start = stat_date.replace(day=1)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        # Revenue stats
        total_revenue = Invoice.objects.filter(status='paid').aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        outstanding_invoices = Invoice.objects.filter(
            status__in=['sent', 'overdue']).aggregate(
            Sum('total_amount'))['total_amount__sum'] or 0
        paid_this_month = Invoice.objects.filter(
            status='paid', 
            paid_date__gte=month_start,
            paid_date__lt=next_month
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        avg_invoice_value = Invoice.objects.aggregate(
            Avg('total_amount'))['total_amount__avg'] or 0
        
        # Expense stats
        business_expenses = Expense.objects.filter(expense_type='business')
        total_expenses = business_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        parts_supplies_expenses = business_expenses.filter(
            category='parts_supplies').aggregate(Sum('amount'))['amount__sum'] or 0
        utilities_expenses = business_expenses.filter(
            category='utilities').aggregate(Sum('amount'))['amount__sum'] or 0
        equipment_expenses = business_expenses.filter(
            category='equipment').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Personal expenses
        personal_expenses = Expense.objects.filter(expense_type='personal')
        admin_expenses = personal_expenses.filter(
            category__in=['office_supplies', 'other']).aggregate(
            Sum('amount'))['amount__sum'] or 0
        travel_meals_expenses = personal_expenses.filter(
            category__in=['travel', 'meals']).aggregate(
            Sum('amount'))['amount__sum'] or 0
        office_supplies_expenses = personal_expenses.filter(
            category='office_supplies').aggregate(
            Sum('amount'))['amount__sum'] or 0
        professional_dev_expenses = personal_expenses.filter(
            category='professional_dev').aggregate(
            Sum('amount'))['amount__sum'] or 0
        
        # Create or update stats record
        stats_obj, created = BillingStats.objects.update_or_create(
            stat_date=stat_date,
            defaults={
                'total_revenue': total_revenue,
                'outstanding_invoices': outstanding_invoices,
                'paid_this_month': paid_this_month,
                'avg_invoice_value': avg_invoice_value,
                'total_expenses': total_expenses,
                'parts_supplies_expenses': parts_supplies_expenses,
                'utilities_expenses': utilities_expenses,
                'equipment_expenses': equipment_expenses,
                'admin_expenses': admin_expenses,
                'travel_meals_expenses': travel_meals_expenses,
                'office_supplies_expenses': office_supplies_expenses,
                'professional_dev_expenses': professional_dev_expenses,
            }
        )
        
        serializer = self.get_serializer(stats_obj)
        return Response(serializer.data)
