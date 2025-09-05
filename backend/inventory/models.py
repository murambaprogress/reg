from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Part(models.Model):
    part_number = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='parts')
    current_stock = models.IntegerField(default=0)
    minimum_threshold = models.IntegerField(default=0)
    supplier = models.CharField(max_length=200, blank=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default='pcs')
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.part_number} - {self.description[:40]}"


class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('stock-in', 'Stock In'),
        ('stock-out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
        ('transfer', 'Transfer'),
    )
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField()
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    related_job_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.type} {self.quantity} x {self.part.part_number} @ {self.timestamp}"


class Supplier(models.Model):
    name = models.CharField(max_length=200, unique=True)
    contact = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    state = models.CharField(max_length=50, default='due')
    products_supplied = models.TextField(blank=True)
    # store previous/future/payments as JSON blob (string) for simplicity
    previous = models.TextField(blank=True)
    future = models.TextField(blank=True)
    payments = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    preferred_contact = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='active')
    join_date = models.DateTimeField(auto_now_add=True)
    last_service_date = models.DateTimeField(null=True, blank=True)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # simple JSON storage for related arrays (invoices, payments, vehicles)
    metadata = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} <{self.email}>"
