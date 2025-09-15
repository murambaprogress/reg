from django.db import models
from django.conf import settings
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
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('pending', 'Pending'),
    ]

    # Invoice identification
    invoice_number = models.CharField(max_length=50, unique=True)
    
    # Customer and job relationship
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    
    # Vehicle information (copied from job for record keeping)
    vehicle_model = models.CharField(max_length=200, blank=True)
    vehicle_plate = models.CharField(max_length=50, blank=True)
    
    # Service details
    service_description = models.TextField()
    
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
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.name} - ${self.total_amount}"
    
    class Meta:
        ordering = ['-created_at']


class InvoiceItem(models.Model):
    """Individual items/services on an invoice"""
    ITEM_TYPE_CHOICES = [
        ('service', 'Service'),
        ('part', 'Part'),
        ('labor', 'Labor'),
        ('other', 'Other'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, default='service')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Reference to parts if applicable
    part_number = models.CharField(max_length=100, blank=True)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
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


class Debtor(models.Model):
    """Customers with outstanding payments"""
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='debtor_profile')
    total_outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    oldest_invoice_date = models.DateField(null=True, blank=True)
    days_overdue = models.IntegerField(default=0)
    
    # Contact attempts
    last_contact_date = models.DateField(null=True, blank=True)
    contact_attempts = models.IntegerField(default=0)
    
    # Status and notes
    status = models.CharField(max_length=50, default='active')  # active, payment_plan, legal, resolved
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_outstanding_amount(self):
        """Recalculate debtor fields including draft invoices.
        Unpaid statuses now include draft, sent, overdue.
        Mirrors logic in signals to keep consistency when manually refreshed (admin action/API).
        """
        from django.db.models import Sum
        from django.utils import timezone

        unpaid_statuses = ['draft', 'sent', 'overdue']
        qs_unpaid = self.customer.invoices.filter(status__in=unpaid_statuses)
        self.total_outstanding = qs_unpaid.aggregate(total=Sum('total_amount'))['total'] or 0
        self.oldest_invoice_date = qs_unpaid.order_by('invoice_date').values_list('invoice_date', flat=True).first()
        earliest_due = qs_unpaid.order_by('due_date').values_list('due_date', flat=True).first()
        if earliest_due:
            self.days_overdue = max((timezone.now().date() - earliest_due).days, 0)
        else:
            self.days_overdue = 0

        # Status determination
        if self.total_outstanding > 0:
            if earliest_due and earliest_due < timezone.now().date():
                self.status = 'overdue'
            else:
                self.status = 'due'
        else:
            self.status = 'paid'

        self.save()
    
    def __str__(self):
        return f"{self.customer.name} - Outstanding: ${self.total_outstanding}"
    
    class Meta:
        ordering = ['-total_outstanding']


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
    
    debtor = models.ForeignKey(Debtor, on_delete=models.CASCADE, related_name='contact_history')
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
