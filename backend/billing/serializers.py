from rest_framework import serializers
from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorContact, BillingStats
)
from inventory.models import Customer
from jobs.models import Job
from jobs.models import PartsRequest
from inventory.models import Part
from django.utils import timezone
from django.db import transaction
from decimal import Decimal, InvalidOperation


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'item_type', 'description', 'quantity', 
            'unit_price', 'total_price', 'part_number'
        ]
        read_only_fields = ['total_price']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'payment_method', 'payment_date',
            'reference_number', 'notes', 'created_at', 'recorded_by'
        ]
        read_only_fields = ['created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    job_description = serializers.CharField(source='job.service_description', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 
            'customer_email', 'customer_phone', 'job', 'job_description',
            'vehicle_model', 'vehicle_plate', 'service_description',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 
            'total_amount', 'status', 'payment_method',
            'invoice_date', 'due_date', 'paid_date',
            'created_at', 'updated_at', 'notes', 'created_by',
            'items', 'payments'
        ]
        read_only_fields = ['tax_amount', 'total_amount', 'created_at', 'updated_at']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer used when creating invoices.

    Enhancements:
    - Makes items optional so an invoice can be auto-generated from a Job
    - If a job is provided and items are omitted, auto-create:
        * A service line item using job.actual_cost or estimated_cost
        * Part line items from approved/fulfilled technician PartsRequest records
    - Auto-populates customer, vehicle fields, service description from Job when missing
    - Generates an invoice_number if not supplied
    - Computes subtotal from generated items when subtotal not supplied
    """
    items = InvoiceItemSerializer(many=True, required=False, allow_null=True)
    # Read-only helper so frontend gets customer name after POST
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'customer', 'customer_name', 'customer_phone', 'customer_email',
            'job', 'vehicle_model', 'vehicle_plate', 'service_description', 'subtotal', 
            'tax_rate', 'discount_amount', 'due_date', 'notes', 'items'
        ]
    
    def _generate_invoice_number(self):
        now = timezone.now()
        date_part = now.strftime('%Y%m%d')
        # Count existing invoices for today to create a sequence
        count_today = Invoice.objects.filter(invoice_date=now.date()).count() + 1
        return f"INV-{date_part}-{count_today:04d}"

    def create(self, validated_data):
        # Extract nested items if provided
        items_data = validated_data.pop('items', None)
        job = validated_data.get('job')

        # Auto-populate from job if provided
        if job:
            # Customer linkage
            if not validated_data.get('customer'):
                validated_data['customer'] = job.customer
            # Vehicle info
            validated_data.setdefault('vehicle_model', job.vehicle_model)
            validated_data.setdefault('vehicle_plate', job.vehicle_plate)
            # Service description
            validated_data.setdefault('service_description', job.service_description)
            # Default due date to job due_date if not provided
            if not validated_data.get('due_date'):
                validated_data['due_date'] = job.due_date

        # Auto-generate invoice number if missing
        if not validated_data.get('invoice_number'):
            validated_data['invoice_number'] = self._generate_invoice_number()

        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)

            auto_generated = False
            generated_items_total = 0

            # If no explicit items provided and we have a job, build them
            if (items_data is None or len(items_data) == 0) and job:
                auto_generated = True
                items_data = []

                # Service line (labor/service) based on job cost
                service_cost = job.actual_cost or job.estimated_cost or 0
                if service_cost:
                    items_data.append({
                        'item_type': 'service',
                        'description': job.service_description[:250],
                        'quantity': 1,
                        'unit_price': service_cost,
                        'total_price': service_cost,
                        'part_number': ''
                    })

                # Part lines from approved/fulfilled PartsRequest
                parts_requests = PartsRequest.objects.filter(
                    job=job, status__in=['approved', 'fulfilled']
                )
                for pr in parts_requests:
                    # Try to fetch part cost; fallback 0
                    unit_price = 0
                    try:
                        part_obj = Part.objects.get(part_number=pr.part_number)
                        unit_price = part_obj.unit_cost
                    except Part.DoesNotExist:
                        pass
                    total_price = unit_price * pr.quantity_requested
                    items_data.append({
                        'item_type': 'part',
                        'description': pr.part_name[:255],
                        'quantity': pr.quantity_requested,
                        'unit_price': unit_price,
                        'total_price': total_price,
                        'part_number': pr.part_number
                    })

            # Persist provided or auto-generated items
            if items_data:
                for item_data in items_data:
                    # total_price recalculated in model save, but keep for clarity
                    quantity = item_data.get('quantity') or 1
                    unit_price = item_data.get('unit_price') or 0
                    # Normalize numeric types to Decimal
                    try:
                        quantity_dec = Decimal(str(quantity))
                    except InvalidOperation:
                        quantity_dec = Decimal('0')
                    try:
                        unit_price_dec = Decimal(str(unit_price))
                    except InvalidOperation:
                        unit_price_dec = Decimal('0')
                    item = InvoiceItem.objects.create(
                        invoice=invoice,
                        item_type=item_data.get('item_type', 'service'),
                        description=item_data['description'],
                        quantity=quantity_dec,
                        unit_price=unit_price_dec,
                        total_price=quantity_dec * unit_price_dec,
                        part_number=item_data.get('part_number', '')
                    )
                    generated_items_total += item.total_price

            # Determine if provided subtotal is valid (>0)
            provided_subtotal_raw = self.initial_data.get('subtotal')
            try:
                provided_subtotal = Decimal(str(provided_subtotal_raw)) if provided_subtotal_raw not in [None, ''] else Decimal('0')
            except InvalidOperation:
                provided_subtotal = Decimal('0')

            # If subtotal missing, zero, or auto_generated, replace with computed total
            if generated_items_total and (auto_generated or provided_subtotal == 0):
                invoice.subtotal = generated_items_total

            # Normalize tax_rate / discount_amount if provided as strings
            for field in ['tax_rate', 'discount_amount']:
                val_raw = getattr(invoice, field)
                try:
                    setattr(invoice, field, Decimal(str(val_raw)))
                except InvalidOperation:
                    setattr(invoice, field, Decimal('0'))

            # Trigger save to recalc tax_amount and total_amount
            invoice.save()

        return invoice


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    related_job_description = serializers.CharField(source='related_job.service_description', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'expense_id', 'expense_type', 'category', 'description',
            'vendor', 'amount', 'tax_amount', 'status', 'payment_method',
            'expense_date', 'due_date', 'paid_date', 'created_at', 
            'updated_at', 'receipt_url', 'notes', 'created_by',
            'created_by_name', 'related_job', 'related_job_description'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def _generate_expense_id(self):
        """Generate a unique expense_id if one was not provided.
        Format: EXP-YYYYMMDD-#### where #### is a daily sequence.
        """
        from django.utils import timezone
        today = timezone.now().date()
        date_part = today.strftime('%Y%m%d')
        # Count existing expenses for today to build sequence
        count_today = Expense.objects.filter(expense_date=today).count() + 1
        return f"EXP-{date_part}-{count_today:04d}"

    def create(self, validated_data):
        # Auto generate expense_id if missing or blank
        expense_id = validated_data.get('expense_id')
        if not expense_id:
            validated_data['expense_id'] = self._generate_expense_id()
        # Ensure tax_amount defaults to 0 if missing
        if validated_data.get('tax_amount') in [None, '']:
            validated_data['tax_amount'] = 0
        return super().create(validated_data)


class DebtorContactSerializer(serializers.ModelSerializer):
    contacted_by_name = serializers.CharField(source='contacted_by.username', read_only=True)
    
    class Meta:
        model = DebtorContact
        fields = [
            'id', 'contact_type', 'contact_date', 'outcome', 'notes',
            'follow_up_date', 'created_at', 'contacted_by', 'contacted_by_name'
        ]
        read_only_fields = ['created_at']


class DebtorSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    contact_history = DebtorContactSerializer(many=True, read_only=True)
    
    class Meta:
        model = Debtor
        fields = [
            'id', 'customer', 'customer_name', 'customer_email', 
            'customer_phone', 'total_outstanding', 'oldest_invoice_date',
            'days_overdue', 'last_contact_date', 'contact_attempts',
            'status', 'notes', 'created_at', 'updated_at', 'contact_history'
        ]
        read_only_fields = ['created_at', 'updated_at']


class BillingStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingStats
        fields = [
            'id', 'stat_date', 'total_revenue', 'outstanding_invoices',
            'paid_this_month', 'avg_invoice_value', 'total_expenses',
            'parts_supplies_expenses', 'utilities_expenses', 'equipment_expenses',
            'admin_expenses', 'travel_meals_expenses', 'office_supplies_expenses',
            'professional_dev_expenses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for invoice lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'vehicle_model',
            'vehicle_plate', 'service_description', 'total_amount',
            'status', 'payment_method', 'invoice_date', 'due_date', 'paid_date'
        ]


class ExpenseListSerializer(serializers.ModelSerializer):
    """Simplified serializer for expense lists"""
    class Meta:
        model = Expense
        fields = [
            'id', 'expense_id', 'expense_type', 'category', 'description', 'vendor',
            'amount', 'tax_amount', 'status', 'payment_method', 'expense_date',
            'due_date', 'paid_date'
        ]


class DebtorListSerializer(serializers.ModelSerializer):
    """Simplified serializer for debtor lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    
    class Meta:
        model = Debtor
        fields = [
            'id', 'customer_name', 'customer_phone', 'total_outstanding',
            'days_overdue', 'last_contact_date', 'status'
        ]
