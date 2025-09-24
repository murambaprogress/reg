from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from backend.billing.models import Invoice, Customer

class InvoiceApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = Customer.objects.create(name="Test Customer", phone="123456789", email="test@example.com")

    def test_create_invoice(self):
        url = reverse('invoice-list')  # DRF router name for InvoiceViewSet
        data = {
            "invoice_number": "INV-TEST-001",
            "customer": self.customer.id,
            "subtotal": 100.0,
            "tax_rate": 15,
            "discount_amount": 0,
            "items": [
                {
                    "description": "Test Item",
                    "quantity": 1,
                    "unit_price": 100.0
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Invoice.objects.filter(invoice_number="INV-TEST-001").exists())
