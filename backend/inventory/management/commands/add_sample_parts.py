from django.core.management.base import BaseCommand
from inventory.models import Part, Category

class Command(BaseCommand):
    help = 'Add sample parts to the inventory'

    def handle(self, *args, **kwargs):
        # Create a default category if it doesn't exist
        category, _ = Category.objects.get_or_create(
            name='Auto Parts',
            defaults={'description': 'General automotive parts'}
        )

        # Sample parts data
        parts_data = [
            {
                'part_number': 'OIL-5W30',
                'description': 'Engine Oil 5W30',
                'current_stock': 50,
                'unit_cost': 25.99,
                'unit': 'L',
                'minimum_threshold': 10,
                'category': category
            },
            {
                'part_number': 'FIL-001',
                'description': 'Oil Filter',
                'current_stock': 30,
                'unit_cost': 12.99,
                'unit': 'pcs',
                'minimum_threshold': 5,
                'category': category
            },
            {
                'part_number': 'BRK-001',
                'description': 'Brake Pads (Front)',
                'current_stock': 20,
                'unit_cost': 45.99,
                'unit': 'set',
                'minimum_threshold': 4,
                'category': category
            },
            {
                'part_number': 'BAT-12V',
                'description': 'Car Battery 12V',
                'current_stock': 15,
                'unit_cost': 89.99,
                'unit': 'pcs',
                'minimum_threshold': 3,
                'category': category
            }
        ]

        # Add parts
        for part_data in parts_data:
            Part.objects.get_or_create(
                part_number=part_data['part_number'],
                defaults=part_data
            )

        self.stdout.write(self.style.SUCCESS('Successfully added sample parts'))
