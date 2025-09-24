import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from inventory.models import Customer

# Check customers in database
customers = Customer.objects.all()
print(f"Total customers in database: {customers.count()}")

if customers.exists():
    print("\nSample customers:")
    for customer in customers[:5]:
        print(f"ID: {customer.id}, Name: {customer.name}, Phone: {customer.phone}")
else:
    print("No customers found in database. Creating test customers...")
    
    # Create some test customers
    test_customers = [
        {"name": "John Doe", "phone": "+263 77 123 4567", "email": "john@example.com"},
        {"name": "Jane Smith", "phone": "+263 77 234 5678", "email": "jane@example.com"},
        {"name": "Bob Johnson", "phone": "+263 77 345 6789", "email": "bob@example.com"},
    ]
    
    for customer_data in test_customers:
        customer = Customer.objects.create(**customer_data)
        print(f"Created customer: {customer.name} (ID: {customer.id})")
