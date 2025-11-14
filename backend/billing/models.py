from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from inventory.models import Customer
from jobs.models import Job


class Invoice(models.Model):
    """Customer invoices for services and parts"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_TERMS_CHOICES = [
        ('CASH', 'CASH'),
        ('30_DAYS', '30 DAYS'),
        ('60_DAYS', '60 DAYS'),
        ('90_DAYS', '90 DAYS'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('pending', 'Pending'),
    ]
    
    DOCUMENT_TYPE_CHOICES = [
        ('invoice', 'Invoice'),
        ('quotation', 'Quotation'),
    ]

    # Invoice identification and basic details
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    
    # Order information
    order_number = models.CharField(max_length=50, blank=True)
    delivery_note = models.CharField(max_length=50, blank=True)
    
    # Customer and contact details
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    contact_person = models.CharField(max_length=100, blank=True)
    contact_number = models.CharField(max_length=50, blank=True)
    delivery_address = models.TextField(blank=True)
    
    # Job relationship
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    
    # Vehicle information (if applicable)
    vehicle_model = models.CharField(max_length=200, blank=True)
    vehicle_plate = models.CharField(max_length=50, blank=True)
    
    # Service description
    service_description = models.TextField(blank=True)
    
    # Company Details
    company_vat_number = models.CharField(max_length=50, blank=True)
    customer_vat_number = models.CharField(max_length=50, blank=True)
    
    # Payment Terms and Status
    payment_terms = models.CharField(max_length=20, choices=PAYMENT_TERMS_CHOICES, default='CASH')
    
    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_name = models.CharField(max_length=100, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_branch_code = models.CharField(max_length=20, blank=True)
    bank_swift_code = models.CharField(max_length=20, blank=True)
    
    # Financial details
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='pending')
    
    # Dates
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional information
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Auto-calculate totals
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        super().save(*args, **kwargs)
    
    def update_totals(self):
        """Recalculate invoice totals based on items"""
        # Calculate subtotal from items
        self.subtotal = sum(item.total_price for item in self.items.all())
        
        # Calculate tax
        self.tax_amount = (self.subtotal * self.tax_rate / 100)
        
        # Calculate final total
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        
        # Save without triggering the update_totals method again
        type(self).objects.filter(pk=self.pk).update(
            subtotal=self.subtotal,
            tax_amount=self.tax_amount,
            total_amount=self.total_amount
        )
    
    def save(self, *args, **kwargs):
        # Set due date based on payment terms if not set
        if not self.due_date and self.payment_terms:
            from datetime import timedelta
            days = {
                'CASH': 0,
                '30_DAYS': 30,
                '60_DAYS': 60,
                '90_DAYS': 90
            }.get(self.payment_terms, 0)
            self.due_date = self.invoice_date + timedelta(days=days)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.name} - ${self.total_amount}"
    
    class Meta:
        ordering = ['-invoice_date']


class InvoiceItem(models.Model):
    """Individual items/services on an invoice"""
    ITEM_TYPE_CHOICES = [
        ('service', 'Service'),
        ('part', 'Part'),
        ('labor', 'Labor'),
        ('other', 'Other'),
    ]
    
    UNIT_CHOICES = [
        ('pcs', 'Pieces'),
        ('m', 'Meters'),
        ('kg', 'Kilograms'),
        ('hr', 'Hours'),
        ('lot', 'Lot'),
        ('set', 'Set'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, default='service')
    code = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=255)
    part_number = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='pcs')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Calculate price after discount
        base_price = Decimal(self.quantity) * Decimal(self.unit_price)
        discount_rate = Decimal(self.discount) / Decimal(100)
        discount_amount = base_price * discount_rate
        self.total_price = base_price - discount_amount
        super().save(*args, **kwargs)

        # Update invoice totals
        if self.invoice:
            self.invoice.update_totals()
    
    def __str__(self):
        return f"{self.description} - {self.quantity} x ${self.unit_price}"


class Payment(models.Model):
    """Payments received for invoices"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True)  # Check number, transaction ID, etc.
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"Payment ${self.amount} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['-payment_date']


class Expense(models.Model):
    """Business and personal expenses"""
    EXPENSE_TYPE_CHOICES = [
        ('business', 'Business'),
        ('personal', 'Personal'),
    ]
    
    CATEGORY_CHOICES = [
        ('parts_supplies', 'Parts & Supplies'),
        ('utilities', 'Utilities'),
        ('equipment', 'Equipment'),
        ('maintenance', 'Maintenance'),
        ('travel', 'Travel'),
        ('meals', 'Meals'),
        ('office_supplies', 'Office Supplies'),
        ('professional_dev', 'Professional Development'),
        ('insurance', 'Insurance'),
        ('rent', 'Rent'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('pending', 'Pending'),
    ]

    # Basic information
    expense_id = models.CharField(max_length=50, unique=True)
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPE_CHOICES, default='business')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    vendor = models.CharField(max_length=200)
    
    # Financial details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='pending')
    
    # Dates
    expense_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional information
    receipt_url = models.URLField(blank=True)  # Link to receipt image/document
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Job relationship (if expense is related to a specific job)
    related_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    
    def __str__(self):
        return f"{self.expense_id} - {self.vendor} - ${self.amount}"
    
    class Meta:
        ordering = ['-expense_date']


class DebtorContact(models.Model):
    """Track contact attempts with debtors"""
    CONTACT_TYPE_CHOICES = [
        ('phone', 'Phone Call'),
        ('email', 'Email'),
        ('letter', 'Letter'),
        ('visit', 'In-Person Visit'),
        ('sms', 'SMS'),
    ]
    
    OUTCOME_CHOICES = [
        ('no_answer', 'No Answer'),
        ('promised_payment', 'Promised Payment'),
        ('dispute', 'Dispute'),
        ('payment_plan', 'Payment Plan Agreed'),
        ('partial_payment', 'Partial Payment'),
        ('full_payment', 'Full Payment'),
        ('refused', 'Refused to Pay'),
    ]
    
    debtor = models.ForeignKey('billing.Debtor', on_delete=models.CASCADE, related_name='contact_history')
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPE_CHOICES)
    contact_date = models.DateField()
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    notes = models.TextField()
    follow_up_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    contacted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.contact_type} with {self.debtor.customer.name} on {self.contact_date}"
    
    class Meta:
        ordering = ['-contact_date']


class BillingStats(models.Model):
    """Store calculated billing statistics for performance"""
    stat_date = models.DateField(unique=True)
    
    # Revenue stats
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_invoices = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_this_month = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_invoice_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Expense stats
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    parts_supplies_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    utilities_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    equipment_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Personal expenses (if enabled)
    admin_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    travel_meals_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    office_supplies_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    professional_dev_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Billing Stats for {self.stat_date}"
    
    class Meta:
        ordering = ['-stat_date']


class Debtor(models.Model):
    """Model for tracking customers with outstanding payments"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paid', 'Paid'),
        ('defaulted', 'Defaulted'),
        ('payment_plan', 'Payment Plan'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='debts')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='debtor_records', null=True, blank=True)
    
    initial_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    debt_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    description = models.TextField(help_text="Description of services or goods provided")
    payment_terms = models.TextField(blank=True, help_text="Agreed payment terms and conditions")
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def days_due(self):
        """Calculate days remaining until due date (negative if overdue)"""
        from datetime import date
        today = date.today()
        delta = self.due_date - today
        return delta.days
    
    @property
    def is_overdue(self):
        """Check if the debt is overdue"""
        return self.days_due < 0
    
    def get_total_paid(self):
        """Calculate total amount paid from payments"""
        return self.payments.aggregate(total=models.Sum('amount_paid'))['total'] or Decimal('0')
    
    @property
    def total_paid(self):
        """Get total amount paid - can be overridden by annotation"""
        # Check if this was set by annotation (from queryset)
        if hasattr(self, '_total_paid_annotation'):
            return self._total_paid_annotation or Decimal('0')
        # Otherwise calculate from related payments
        return self.get_total_paid()
    
    def __setattr__(self, name, value):
        """Override setattr to handle total_paid annotation"""
        if name == 'total_paid':
            # Store annotated value in a private attribute
            self._total_paid_annotation = Decimal(str(value)) if value is not None else Decimal('0')
        else:
            super().__setattr__(name, value)
    
    def save(self, *args, **kwargs):
        # Update status based on current balance
        if self.current_balance <= 0:
            self.status = 'paid'
        elif self.is_overdue and self.status == 'active':
            self.status = 'defaulted'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.customer.name} - ${self.current_balance} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']


class DebtorPayment(models.Model):
    """Model for tracking payments made by debtors"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('mobile_money', 'Mobile Money'),
    ]

    debtor = models.ForeignKey(Debtor, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    payment_date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True, help_text="Payment reference number or receipt number")
    
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Update the debtor's current balance when payment is made
        if not self.pk:  # Only on new payment creation
            self.debtor.current_balance -= self.amount_paid
            self.debtor.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment of ${self.amount_paid} by {self.debtor.customer.name}"
    
    class Meta:
        ordering = ['-payment_date']
