from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import (
    Q, Sum, Avg, Count, Subquery, OuterRef, Max, F, ExpressionWrapper,
    DecimalField, DateField, IntegerField
)

from django.utils import timezone
from datetime import datetime, timedelta
from django.db import transaction
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings

from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorPayment, BillingStats
)
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, InvoiceListSerializer,
    ExpenseSerializer, ExpenseListSerializer, PaymentSerializer,
    DebtorSerializer, DebtorListSerializer, DebtorPaymentSerializer,
    DebtorBulkImportSerializer, BillingStatsSerializer
)
from jobs.models import Job, PartsRequest
import pandas as pd
from inventory.models import Part, Customer




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
        job_id = self.request.query_params.get('job_id')
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
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send invoice via email"""
        invoice = self.get_object()
        email_data = request.data
        
        # Validate required fields
        recipient_email = email_data.get('recipient_email')
        if not recipient_email:
            return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Generate email subject and message
            subject = f"Invoice {invoice.invoice_number} - Regimark Motors"
            message = f"""
            Dear Customer,
            
            Please find attached your invoice #{invoice.invoice_number} from Regimark Motors.
            
            Invoice Details:
            - Invoice Number: {invoice.invoice_number}
            - Date: {invoice.invoice_date}
            - Total Amount: ${invoice.total_amount}
            - Status: {invoice.status}
            
            If you have any questions, please contact us at rmakambe@gmail.com or +263 772 980 161.
            
            Thank you for your business!
            
            Regimark Motors
            85 Plymouth Road, Southerton, Harare
            """
            
            # In a real implementation, you would generate the PDF here and attach it
            # For now, we'll just send the email with the invoice details
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                fail_silently=False,
            )
            
            return Response({'status': 'Email sent successfully'})
            
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
            
        # Filter by date range
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
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get expense statistics, grouped by category"""
        expense_type = request.query_params.get('expense_type', 'business')
        
        queryset = self.get_queryset().filter(expense_type=expense_type)
        
        total_expenses = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        
        stats = {
            'total_expenses': total_expenses,
        }

        
        if expense_type == 'business':
            stats.update({
                'parts_supplies_expenses': queryset.filter(category='parts_supplies').aggregate(Sum('amount'))['amount__sum'] or 0,
                'utilities_expenses': queryset.filter(category='utilities').aggregate(Sum('amount'))['amount__sum'] or 0,
                'equipment_expenses': queryset.filter(category='equipment').aggregate(Sum('amount'))['amount__sum'] or 0,
            })
        else: # personal
            stats.update({
                'admin_expenses': queryset.filter(category__in=['office_supplies', 'other']).aggregate(Sum('amount'))['amount__sum'] or 0,
                'travel_meals_expenses': queryset.filter(category__in=['travel', 'meals']).aggregate(Sum('amount'))['amount__sum'] or 0,
                'office_supplies_expenses': queryset.filter(category='office_supplies').aggregate(Sum('amount'))['amount__sum'] or 0,
                'professional_dev_expenses': queryset.filter(category='professional_dev').aggregate(Sum('amount'))['amount__sum'] or 0,
            })

        return Response(stats)


class DebtorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debtors"""
    queryset = Debtor.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return DebtorListSerializer
        elif self.action == 'bulk_import':
            return DebtorBulkImportSerializer
        return DebtorSerializer

    def get_queryset(self):
        # Subquery for total paid amount
        total_paid_subquery = DebtorPayment.objects.filter(
            debtor=OuterRef('pk')
        ).values('debtor').annotate(
            total=Sum('amount_paid')
        ).values('total')

        # Subquery for the last payment date
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
        ).select_related('customer').order_by('customer__name')
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(customer__name__icontains=search) |
                Q(customer__phone__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        """Bulk import debtors from a file (e.g., Excel)."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Let the serializer handle the file processing
                created_debtors = serializer.save(created_by=request.user)
                return Response({
                    'detail': f'Successfully imported {len(created_debtors)} debtors',
                    'imported_count': len(created_debtors),
                    'success_count': len(created_debtors),
                    'error_count': 0,
                    'errors': [],
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                # Return full exception details for debugging
                return Response({
                    'detail': f'Error processing file: {str(e)}',
                    'error': str(e),
                    'errors': getattr(e, 'args', []),
                }, status=status.HTTP_400_BAD_REQUEST)
        # Always return full serializer errors for easier debugging
        return Response({
            'detail': 'Import failed due to invalid data',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record a payment for a debtor"""
        debtor = self.get_object()
        payment_data = request.data
        
        # Validate payment amount
        amount_paid = Decimal(str(payment_data.get('amount_paid', 0)))
        if amount_paid <= 0:
            return Response({'error': 'Payment amount must be greater than 0'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if amount_paid > debtor.current_balance:
            return Response({'error': 'Payment amount cannot exceed current balance'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            payment = DebtorPayment.objects.create(
                debtor=debtor,
                amount_paid=amount_paid,
                payment_date=payment_data.get('payment_date', timezone.now().date()),
                payment_method=payment_data.get('payment_method', 'cash'),
                reference_number=payment_data.get('reference_number', ''),
                notes=payment_data.get('notes', ''),
                received_by=request.user
            )
            
            # Update debtor's balance
            debtor.current_balance -= amount_paid
            debtor.save()
            
        return Response({
            'status': 'Payment recorded successfully',
            'payment_id': payment.id,
            'new_balance': debtor.current_balance
        })

    @action(detail=True, methods=['post'])
    def clear_debt(self, request, pk=None):
        """Clear/mark a debt as fully paid"""
        debtor = self.get_object()
        
        with transaction.atomic():
            # If there's remaining balance, record it as a payment
            if debtor.current_balance > 0:
                DebtorPayment.objects.create(
                    debtor=debtor,
                    amount_paid=debtor.current_balance,
                    payment_date=timezone.now().date(),
                    payment_method=request.data.get('payment_method', 'cash'),
                    reference_number=request.data.get('reference_number', ''),
                    notes=request.data.get('notes', 'Debt cleared/written off'),
                    received_by=request.user
                )
            
            # Set balance to zero and status to paid
            debtor.current_balance = Decimal('0')
            debtor.status = 'paid'
            debtor.save()
            
        return Response({
            'status': 'Debt cleared successfully',
            'debtor_status': debtor.status
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get debtor statistics"""
        total_debtors = Debtor.objects.count()
        active_debtors = Debtor.objects.filter(status='active').count()
        total_debt = Debtor.objects.aggregate(Sum('initial_amount'))['initial_amount__sum'] or 0
        current_debt = Debtor.objects.aggregate(Sum('current_balance'))['current_balance__sum'] or 0
        total_paid = DebtorPayment.objects.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        
        return Response({
            'total_debtors': total_debtors,
            'active_debtors': active_debtors,
            'total_debt': total_debt,
            'current_outstanding': current_debt,
            'total_paid': total_paid,
            'collection_rate': float((total_paid / total_debt * 100) if total_debt > 0 else 0)
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class DebtorPaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debtor payments"""
    queryset = DebtorPayment.objects.all()
    serializer_class = DebtorPaymentSerializer
    permission_classes = [IsAuthenticated]


class BillingStatsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing billing stats"""
    queryset = BillingStats.objects.all()
    serializer_class = BillingStatsSerializer
    permission_classes = [IsAuthenticated]
