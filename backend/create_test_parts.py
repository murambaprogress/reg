#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from inventory.models import Part, Category

def create_test_parts():
    """Create test parts for testing the parts request system"""
    # Create a test category if it doesn't exist
    category, created = Category.objects.get_or_create(name='Test Parts')

    # Create some test parts
    parts_data = [
        {'part_number': 'OIL001', 'description': 'Engine Oil 5W-30', 'current_stock': 50, 'unit_cost': 25.00},
        {'part_number': 'FLT001', 'description': 'Air Filter', 'current_stock': 30, 'unit_cost': 15.50},
        {'part_number': 'BRK001', 'description': 'Brake Pads Set', 'current_stock': 20, 'unit_cost': 45.00},
        {'part_number': 'BTY001', 'description': 'Car Battery 12V', 'current_stock': 15, 'unit_cost': 120.00},
    ]

    for part_data in parts_data:
        part, created = Part.objects.get_or_create(
            part_number=part_data['part_number'],
            defaults={
                'description': part_data['description'],
                'category': category,
                'current_stock': part_data['current_stock'],
                'minimum_threshold': 5,
                'unit_cost': part_data['unit_cost'],
                'unit': 'pcs',
                'supplier': 'Test Supplier',
                'location': 'Warehouse A'
            }
        )
        if created:
            print(f'Created part: {part.part_number} - {part.description}')
        else:
            print(f'Part already exists: {part.part_number} - {part.description}')

    print('Test parts setup complete!')

if __name__ == '__main__':
    create_test_parts()
