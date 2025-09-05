from django.db import models
from inventory.models import Customer


class Sale(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        customer_name = self.customer.name if self.customer else "Walk-in"
        return f"Sale {self.id} - {customer_name} - {self.total}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    part_number = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=255)
    qty = models.IntegerField()
    unit = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.qty} x {self.name}"
