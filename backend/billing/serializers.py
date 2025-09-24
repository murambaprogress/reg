from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from decimal import Decimal, InvalidOperation
from .models import (
    Invoice, InvoiceItem, Payment, Expense, 
    Debtor, DebtorPayment, DebtorContact, BillingStats
)
from inventory.models import Customer, Part
from jobs.models import Job, PartsRequest
import pandas as pd


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


class DebtorPaymentListSerializer(serializers.ModelSerializer):
    """Minimal serializer used in DebtorSerializer for displaying payments"""
    class Meta:
        model = DebtorPayment
        fields = [
            'id', 'amount_paid', 'payment_method', 'payment_date', 
            'reference_number', 'created_at'
        ]
        read_only_fields = ['created_at']


class DebtorPaymentSerializer(serializers.ModelSerializer):
    """Full serializer for managing debtor payments"""
    debtor_name = serializers.CharField(source='debtor.customer.name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)

    class Meta:
        model = DebtorPayment
        fields = [
            'id', 'debtor', 'debtor_name', 'amount_paid', 'payment_method',
            'payment_date', 'reference_number', 'notes', 'received_by',
            'received_by_name', 'created_at'
        ]
        read_only_fields = ['received_by_name', 'created_at']

    def create(self, validated_data):
        # Ensure the logged-in user is set as received_by
        validated_data['received_by'] = self.context['request'].user
        return super().create(validated_data)


class DebtorListSerializer(serializers.ModelSerializer):
    """Simplified serializer for debtor lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    payment_progress = serializers.SerializerMethodField()
    total_paid = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    last_payment_date = serializers.DateField(read_only=True)
    days_due = serializers.SerializerMethodField()
    days_due_calc = serializers.IntegerField(read_only=True)  # From queryset annotation
    
    class Meta:
        model = Debtor
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone', 'initial_amount',
            'current_balance', 'debt_date', 'due_date', 'status', 'payment_terms',
            'description', 'notes', 'payment_progress', 'total_paid', 
            'last_payment_date', 'days_due', 'days_due_calc', 'created_at', 'updated_at'
        ]
        read_only_fields = ['current_balance', 'payment_progress', 'total_paid', 
                           'last_payment_date', 'days_due', 'days_due_calc', 'created_at', 'updated_at']

    def get_payment_progress(self, obj):
        if obj.initial_amount == 0:
            return 0
        return ((obj.initial_amount - obj.current_balance) / obj.initial_amount) * 100
    
    def get_days_due(self, obj):
        """Get days due using model property"""
        return obj.days_due


class DebtorSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        # Ensure current_balance is set to initial_amount if not provided
        if 'current_balance' not in validated_data or validated_data['current_balance'] is None:
            validated_data['current_balance'] = validated_data.get('initial_amount', 0)
        return super().create(validated_data)
    """Full serializer for managing debtors"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    payments = DebtorPaymentListSerializer(many=True, read_only=True)
    payment_progress = serializers.SerializerMethodField()
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    last_payment_date = serializers.DateField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)

    class Meta:
        model = Debtor
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone', 'invoice',
            'initial_amount', 'current_balance', 'debt_date', 'due_date',
            'status', 'description', 'payment_terms', 'notes', 'created_by',
            'created_by_name', 'created_at', 'updated_at', 'payments',
            'payment_progress', 'total_paid', 'last_payment_date', 'days_overdue'
        ]
        read_only_fields = ['current_balance', 'created_at', 'updated_at', 'created_by',
                         'created_by_name', 'payment_progress', 'total_paid',
                         'last_payment_date', 'days_overdue']

    def get_payment_progress(self, obj):
        if obj.initial_amount == 0:
            return 0
        return ((obj.initial_amount - obj.current_balance) / obj.initial_amount) * 100


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
    - Handles customer creation from frontend data
    """
    items = InvoiceItemSerializer(many=True, required=False, allow_null=True)
    # Read-only helper so frontend gets customer name after POST
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    
    # Frontend customer data fields (write-only)
    customer_company_name = serializers.CharField(write_only=True, required=False)
    customer_address = serializers.CharField(write_only=True, required=False)
    customer_city = serializers.CharField(write_only=True, required=False)
    customer_phone_input = serializers.CharField(write_only=True, required=False)
    customer_email_input = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'customer', 'customer_name', 'customer_phone', 'customer_email',
            'job', 'vehicle_model', 'vehicle_plate', 'service_description', 'subtotal', 
            'tax_rate', 'discount_amount', 'due_date', 'notes', 'items',
            'customer_company_name', 'customer_address', 'customer_city', 
            'customer_phone_input', 'customer_email_input'
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
        
        # Extract customer data from frontend
        customer_company_name = validated_data.pop('customer_company_name', None)
        customer_address = validated_data.pop('customer_address', None)
        customer_city = validated_data.pop('customer_city', None)
        customer_phone_input = validated_data.pop('customer_phone_input', None)
        customer_email_input = validated_data.pop('customer_email_input', None)

        # Handle customer creation/selection
        if not validated_data.get('customer') and customer_company_name:
            # Create or get customer from frontend data
            customer_data = {
                'name': customer_company_name,
                'phone': customer_phone_input or '',
                'email': customer_email_input or '',
                'address': f"{customer_address or ''} {customer_city or ''}".strip()
            }
            
            # Try to find existing customer by name and phone/email
            customer = None
            if customer_phone_input:
                customer = Customer.objects.filter(
                    name=customer_company_name, 
                    phone=customer_phone_input
                ).first()
            if not customer and customer_email_input:
                customer = Customer.objects.filter(
                    name=customer_company_name, 
                    email=customer_email_input
                ).first()
            
            # Create new customer if not found
            if not customer:
                customer = Customer.objects.create(**customer_data)
            
            validated_data['customer'] = customer

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

            # Calculate totals manually to avoid nested transaction issues
            invoice.tax_amount = (invoice.subtotal * invoice.tax_rate) / 100
            invoice.total_amount = invoice.subtotal + invoice.tax_amount - invoice.discount_amount

            # Update the invoice without triggering the save method again
            Invoice.objects.filter(pk=invoice.pk).update(
                subtotal=invoice.subtotal,
                tax_rate=invoice.tax_rate,
                discount_amount=invoice.discount_amount,
                tax_amount=invoice.tax_amount,
                total_amount=invoice.total_amount
            )

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


class DebtorContactSerializer(serializers.ModelSerializer):

    """Serializer for debtor contact records"""
    contacted_by_name = serializers.CharField(source='contacted_by.username', read_only=True)
    
    class Meta:
        model = DebtorContact
        fields = [
            'id', 'debtor', 'contact_type', 'contact_date', 'outcome',
            'notes', 'follow_up_date', 'created_at', 'contacted_by',
            'contacted_by_name'
        ]
        read_only_fields = ['created_at', 'contacted_by_name']

    def create(self, validated_data):
        # Ensure the request user is set as contacted_by
        if 'contacted_by' not in validated_data and 'request' in self.context:
            validated_data['contacted_by'] = self.context['request'].user
        return super().create(validated_data)


class DebtorBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls', '.csv')):
            raise serializers.ValidationError(
                "Only Excel (.xlsx, .xls) and CSV files are supported."
            )
        return value

    def create(self, validated_data):
        file_obj = validated_data['file']
        created_debtors = []

        try:
            # Load the file with pandas
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)

            # Normalize column names for mapping
            actual_columns = {str(col).strip().lower(): col for col in df.columns}

            # Required and optional columns
            required_mapping = {
                'customer_name': ['customer_name', 'customer name', 'name', 'customer'],
                'amount': ['amount', 'total_outstanding', 'total outstanding', 'balance', '$', 'value', 'total']
            }
            optional_mapping = {
                'due_date': ['due_date', 'due date', 'date'],
                'description': ['description', 'details', 'notes', 'particulars'],
                'customer_phone': ['customer_phone', 'phone', 'customer phone']
            }

            mapped_required = {}
            for target, candidates in required_mapping.items():
                found = False
                for name in candidates:
                    key = name.lower()
                    if key in actual_columns:
                        mapped_required[target] = actual_columns[key]
                        found = True
                        break
                if not found:
                    raise serializers.ValidationError(
                        f"Missing required column. Could not find any of: {', '.join(candidates)}"
                    )

            mapped_optional = {}
            for target, candidates in optional_mapping.items():
                for name in candidates:
                    key = name.lower()
                    if key in actual_columns:
                        mapped_optional[target] = actual_columns[key]
                        break

            with transaction.atomic():
                for _, row in df.iterrows():
                    # Customer name
                    customer_name_raw = row[mapped_required['customer_name']]
                    customer_name = str(customer_name_raw).strip() if not pd.isna(customer_name_raw) else ''
                    if not customer_name or customer_name.lower() == 'nan':
                        continue  # skip empty rows

                    # Amount parsing -> Decimal
                    amount_raw = row[mapped_required['amount']]
                    if pd.isna(amount_raw) or str(amount_raw).strip() == '':
                        amount_dec = Decimal('0')
                    else:
                        amount_str = str(amount_raw)
                        # Keep only digits, sign, and decimal separators
                        amount_str = ''.join(c for c in amount_str if c.isdigit() or c in '.-,')
                        # Handle different decimal separators (EU/US)
                        if ',' in amount_str and '.' in amount_str:
                            if amount_str.rindex(',') > amount_str.rindex('.'):
                                amount_str = amount_str.replace('.', '')
                                amount_str = amount_str.replace(',', '.')
                            else:
                                amount_str = amount_str.replace(',', '')
                        elif ',' in amount_str and '.' not in amount_str:
                            amount_str = amount_str.replace(',', '.')
                        try:
                            amount_dec = Decimal(amount_str)
                        except Exception:
                            amount_dec = Decimal('0')

                    # Optional due_date with default +30 days
                    due_date = None
                    if 'due_date' in mapped_optional:
                        due_raw = row.get(mapped_optional['due_date'])
                        if not pd.isna(due_raw) and str(due_raw).strip() != '':
                            try:
                                due_date = pd.to_datetime(due_raw).date()
                            except Exception:
                                due_date = None
                    if not due_date:
                        due_date = timezone.now().date() + timezone.timedelta(days=30)

                    # Optional description with sensible default
                    description = f"Imported debtor for {customer_name}"
                    if 'description' in mapped_optional:
                        desc_raw = row.get(mapped_optional['description'])
                        if not pd.isna(desc_raw) and str(desc_raw).strip() != '':
                            description = str(desc_raw).strip()

                    # Optional phone used when creating/updating customer
                    phone_value = ''
                    if 'customer_phone' in mapped_optional:
                        phone_raw = row.get(mapped_optional['customer_phone'])
                        if not pd.isna(phone_raw):
                            phone_value = str(phone_raw).strip()
                            if phone_value.lower() == 'nan':
                                phone_value = ''

                    # Create or get customer, update phone if available and empty
                    customer, created = Customer.objects.get_or_create(
                        name=customer_name,
                        defaults={'phone': phone_value or '', 'email': '', 'address': ''}
                    )
                    if not created and phone_value and not customer.phone:
                        customer.phone = phone_value
                        customer.save(update_fields=['phone'])

                    # Create debtor record
                    debtor = Debtor.objects.create(
                        customer=customer,
                        initial_amount=amount_dec,
                        current_balance=amount_dec,
                        due_date=due_date,
                        description=description,
                        created_by=self.context['request'].user
                    )
                    created_debtors.append(debtor)

            return created_debtors

        except pd.errors.EmptyDataError:
            raise serializers.ValidationError("The uploaded file is empty.")
        except (pd.errors.ParserError, ValueError) as e:
            raise serializers.ValidationError(f"Error parsing file: {str(e)}")
        except Exception as e:
            raise serializers.ValidationError(f"Error processing file: {str(e)}")
