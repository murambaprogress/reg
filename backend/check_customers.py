import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from inventory.models import Customer
from inventory.serializers import CustomerSerializer

# Check if customers exist
customers = Customer.objects.all()
print(f'Total customers: {customers.count()}')

if customers.exists():
    print('\nFirst few customers:')
    for customer in customers[:3]:
        print(f'ID: {customer.id}, Name: {customer.name}, Phone: {customer.phone}, Email: {customer.email}')
    
    # Check serializer output
    print('\nSerialized customer data:')
    serializer = CustomerSerializer(customers.first())
    print(serializer.data)
else:
    print('No customers found in database')
    
    # Create a test customer
    print('Creating a test customer...')
    customer = Customer.objects.create(
        name='Test Customer',
        phone='+263 123 456 789',
        email='test@example.com',
        address='123 Test Street, Harare'
    )
    print(f'Created customer: {customer.name} (ID: {customer.id})')
    
    # Show serialized data of new customer
    serializer = CustomerSerializer(customer)
    print('Serialized data:', serializer.data)
