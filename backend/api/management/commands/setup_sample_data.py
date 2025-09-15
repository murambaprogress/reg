from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
import random

from api.models import User
from inventory.models import Customer, Supplier, Part, Category, InventoryTransaction
from jobs.models import Job, TechnicianProfile
from sales.models import Sale, SaleItem
from billing.models import Invoice, InvoiceItem, Expense


class Command(BaseCommand):
    help = 'Setup sample data for testing the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing data before adding sample data',
        )

    def handle(self, *args, **options):
        if options['clean']:
            self.stdout.write('Cleaning existing data...')
            self.clean_data()

        self.stdout.write('Creating sample data...')
        with transaction.atomic():
            self.create_users()
            self.create_categories()
            self.create_suppliers()
            self.create_customers()
            self.create_parts()
            self.create_jobs()
            self.create_sales()
            self.create_expenses()
            self.create_invoices()

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )

    def clean_data(self):
        """Clean existing sample/dummy data"""
        # Delete in reverse dependency order
        Invoice.objects.all().delete()
        Expense.objects.all().delete()
        Sale.objects.all().delete()
        Job.objects.all().delete()
        InventoryTransaction.objects.all().delete()
        Part.objects.all().delete()
        Category.objects.all().delete()
        Supplier.objects.all().delete()
        Customer.objects.all().delete()
        TechnicianProfile.objects.all().delete()
        # Keep admin/supervisor users, only delete technicians
        User.objects.filter(role='technician').delete()

    def create_users(self):
        """Create sample technicians"""
        technicians_data = [
            {
                'username': 'tech_john',
                'email': 'john@regimark.com',
                'specialization': 'Engine Repair',
                'experience_years': 5
            },
            {
                'username': 'tech_mary',
                'email': 'mary@regimark.com',
                'specialization': 'Electrical Systems',
                'experience_years': 3
            },
            {
                'username': 'tech_david',
                'email': 'david@regimark.com',
                'specialization': 'Transmission',
                'experience_years': 7
            }
        ]

        for tech_data in technicians_data:
            if not User.objects.filter(username=tech_data['username']).exists():
                user = User.objects.create_user(
                    username=tech_data['username'],
                    email=tech_data['email'],
                    password='tech123',
                    role='technician',
                    verified=True
                )
                
                TechnicianProfile.objects.create(
                    user=user,
                    specialization=tech_data['specialization'],
                    is_available=True
                )

    def create_categories(self):
        """Create part categories"""
        categories = [
            'Engine Parts',
            'Electrical Components',
            'Brake System',
            'Transmission',
            'Suspension',
            'Filters',
            'Fluids & Oils',
            'Body Parts'
        ]

        for cat_name in categories:
            Category.objects.get_or_create(name=cat_name)

    def create_suppliers(self):
        """Create suppliers"""
        suppliers_data = [
            {
                'name': 'AutoParts Direct',
                'contact_person': 'Mike Anderson',
                'phone': '+263-4-123-4567',
                'email': 'orders@autopartsdirect.co.zw',
                'address': '123 Industrial Road, Harare'
            },
            {
                'name': 'Zimbabwe Motor Spares',
                'contact_person': 'Sarah Mukamuri',
                'phone': '+263-4-234-5678',
                'email': 'sales@zimspares.co.zw',
                'address': '456 Seke Road, Chitungwiza'
            },
            {
                'name': 'Quality Auto Components',
                'contact_person': 'James Chikwanha',
                'phone': '+263-4-345-6789',
                'email': 'info@qualityauto.co.zw',
                'address': '789 Samora Machel Ave, Harare'
            }
        ]

        for supplier_data in suppliers_data:
            Supplier.objects.get_or_create(
                name=supplier_data['name'],
                defaults=supplier_data
            )

    def create_customers(self):
        """Create customers"""
        customers_data = [
            {
                'name': 'Tendai Moyo',
                'phone': '+263-77-123-4567',
                'email': 'tendai.moyo@gmail.com',
                'address': '12 Borrowdale Road, Harare',
                'status': 'active'
            },
            {
                'name': 'Grace Mutasa',
                'phone': '+263-71-234-5678',
                'email': 'grace.mutasa@yahoo.com',
                'address': '34 Avondale Drive, Harare',
                'status': 'active'
            },
            {
                'name': 'Peter Ncube',
                'phone': '+263-78-345-6789',
                'email': 'peter.ncube@outlook.com',
                'address': '56 Mount Pleasant Heights, Harare',
                'status': 'active'
            },
            {
                'name': 'Chipo Madziva',
                'phone': '+263-73-456-7890',
                'email': 'chipo.madziva@gmail.com',
                'address': '78 Greendale Avenue, Harare',
                'status': 'active'
            },
            {
                'name': 'Robert Chigumba',
                'phone': '+263-77-567-8901',
                'email': 'robert.chigumba@gmail.com',
                'address': '90 Marlborough Drive, Harare',
                'status': 'active'
            }
        ]

        for customer_data in customers_data:
            Customer.objects.get_or_create(
                name=customer_data['name'],
                defaults=customer_data
            )

    def create_parts(self):
        """Create inventory parts"""
        categories = Category.objects.all()
        suppliers = Supplier.objects.all()

        parts_data = [
            {
                'part_number': 'ENG001',
                'description': 'Engine Oil Filter',
                'current_stock': 25,
                'minimum_threshold': 5,
                'unit_cost': 15.50,
                'unit': 'piece',
                'location': 'A1-01'
            },
            {
                'part_number': 'BRK002',
                'description': 'Brake Pads - Front',
                'current_stock': 12,
                'minimum_threshold': 3,
                'unit_cost': 45.00,
                'unit': 'set',
                'location': 'B2-05'
            },
            {
                'part_number': 'ELC003',
                'description': 'Spark Plugs',
                'current_stock': 30,
                'minimum_threshold': 8,
                'unit_cost': 8.75,
                'unit': 'piece',
                'location': 'C1-03'
            },
            {
                'part_number': 'TRN004',
                'description': 'Transmission Fluid',
                'current_stock': 18,
                'minimum_threshold': 4,
                'unit_cost': 22.00,
                'unit': 'liter',
                'location': 'D3-02'
            },
            {
                'part_number': 'SUS005',
                'description': 'Shock Absorber',
                'current_stock': 8,
                'minimum_threshold': 2,
                'unit_cost': 85.00,
                'unit': 'piece',
                'location': 'E1-04'
            },
            {
                'part_number': 'FLT006',
                'description': 'Air Filter',
                'current_stock': 20,
                'minimum_threshold': 5,
                'unit_cost': 12.50,
                'unit': 'piece',
                'location': 'A2-06'
            },
            {
                'part_number': 'OIL007',
                'description': 'Engine Oil 5W-30',
                'current_stock': 35,
                'minimum_threshold': 10,
                'unit_cost': 18.00,
                'unit': 'liter',
                'location': 'F1-01'
            },
            {
                'part_number': 'BDY008',
                'description': 'Side Mirror',
                'current_stock': 6,
                'minimum_threshold': 2,
                'unit_cost': 65.00,
                'unit': 'piece',
                'location': 'G2-03'
            }
        ]

        for part_data in parts_data:
            if not Part.objects.filter(part_number=part_data['part_number']).exists():
                part_data['category'] = random.choice(categories)
                part_data['supplier'] = random.choice(suppliers).name
                Part.objects.create(**part_data)

    def create_jobs(self):
        """Create sample jobs"""
        customers = Customer.objects.all()
        technicians = User.objects.filter(role='technician')

        jobs_data = [
            {
                'customer_name': 'Tendai Moyo',
                'vehicle_model': '2018 Toyota Corolla',
                'vehicle_plate': 'ABC-1234',
                'vehicle_year': 2018,
                'service_description': 'Engine oil change and brake inspection',
                'estimated_cost': 120.00,
                'priority': 'medium',
                'status': 'completed'
            },
            {
                'customer_name': 'Grace Mutasa',
                'vehicle_model': '2020 Honda Civic',
                'vehicle_plate': 'XYZ-5678',
                'vehicle_year': 2020,
                'service_description': 'Transmission service and fluid change',
                'estimated_cost': 250.00,
                'priority': 'high',
                'status': 'in_progress'
            },
            {
                'customer_name': 'Peter Ncube',
                'vehicle_model': '2019 Nissan Sentra',
                'vehicle_plate': 'DEF-9012',
                'vehicle_year': 2019,
                'service_description': 'Electrical system diagnosis',
                'estimated_cost': 180.00,
                'priority': 'medium',
                'status': 'pending'
            },
            {
                'customer_name': 'Chipo Madziva',
                'vehicle_model': '2017 Mazda 3',
                'vehicle_plate': 'GHI-3456',
                'vehicle_year': 2017,
                'service_description': 'Brake pad replacement',
                'estimated_cost': 95.00,
                'priority': 'low',
                'status': 'assigned'
            }
        ]

        for job_data in jobs_data:
            customer = customers.filter(name=job_data['customer_name']).first()
            if customer:
                job_data['customer'] = customer
                
                # Assign technician for non-pending jobs
                if job_data['status'] != 'pending':
                    job_data['assigned_technician'] = random.choice(technicians)
                
                # Set dates based on status
                created_date = timezone.now() - timedelta(days=random.randint(1, 30))
                job_data['created_at'] = created_date
                job_data['due_date'] = created_date + timedelta(days=random.randint(1, 7))
                
                if job_data['status'] in ['in_progress', 'completed']:
                    job_data['started_at'] = created_date + timedelta(hours=random.randint(1, 24))
                
                if job_data['status'] == 'completed':
                    job_data['completed_at'] = job_data['started_at'] + timedelta(hours=random.randint(2, 8))
                    job_data['actual_cost'] = job_data['estimated_cost'] + random.uniform(-20, 50)
                    job_data['actual_hours'] = random.uniform(1, 6)

                Job.objects.create(**job_data)

    def create_sales(self):
        """Create sample sales"""
        customers = Customer.objects.all()
        parts = Part.objects.all()

        for i in range(5):
            customer = random.choice(customers)
            sale = Sale.objects.create(
                customer=customer,
                customer_name=customer.name,
                customer_phone=customer.phone,
                date=timezone.now() - timedelta(days=random.randint(1, 30)),
                payment_method=random.choice(['cash', 'card', 'mobile']),
                total=0  # Will be calculated
            )

            # Add 1-3 items per sale
            total = 0
            for j in range(random.randint(1, 3)):
                part = random.choice(parts)
                qty = random.randint(1, 3)
                unit_price = float(part.unit_cost) * 1.3  # 30% markup
                
                SaleItem.objects.create(
                    sale=sale,
                    part_number=part.part_number,
                    name=part.description,
                    qty=qty,
                    unit=unit_price
                )
                total += qty * unit_price

            sale.total = total
            sale.save()

    def create_expenses(self):
        """Create sample expenses"""
        admin_user = User.objects.filter(role='admin').first()
        
        expenses_data = [
            {
                'expense_id': 'EXP001',
                'description': 'Office rent - September',
                'amount': 800.00,
                'category': 'utilities',
                'expense_type': 'business',
                'vendor': 'Property Management Co.',
                'payment_method': 'bank_transfer'
            },
            {
                'expense_id': 'EXP002',
                'description': 'Parts inventory purchase',
                'amount': 1500.00,
                'category': 'parts_supplies',
                'expense_type': 'business',
                'vendor': 'AutoParts Direct',
                'payment_method': 'cash'
            },
            {
                'expense_id': 'EXP003',
                'description': 'Equipment maintenance',
                'amount': 350.00,
                'category': 'equipment',
                'expense_type': 'business',
                'vendor': 'Tech Services Ltd',
                'payment_method': 'card'
            }
        ]

        for expense_data in expenses_data:
            expense_data['created_by'] = admin_user
            expense_data['expense_date'] = timezone.now() - timedelta(days=random.randint(1, 30))
            Expense.objects.create(**expense_data)

    def create_invoices(self):
        """Create sample invoices"""
        jobs = Job.objects.filter(status='completed')
        admin_user = User.objects.filter(role='admin').first()

        for job in jobs:
            invoice = Invoice.objects.create(
                invoice_number=f'INV-{job.id:04d}',
                customer=job.customer,
                job=job,
                vehicle_model=job.vehicle_model,
                vehicle_plate=job.vehicle_plate,
                service_description=job.service_description,
                invoice_date=job.completed_at.date() if job.completed_at else timezone.now().date(),
                due_date=(job.completed_at + timedelta(days=30)).date() if job.completed_at else timezone.now().date() + timedelta(days=30),
                subtotal=job.actual_cost or job.estimated_cost,
                tax_amount=(job.actual_cost or job.estimated_cost) * 0.15,  # 15% tax
                total_amount=(job.actual_cost or job.estimated_cost) * 1.15,
                status='paid' if random.choice([True, False]) else 'sent',
                created_by=admin_user
            )

            # Add invoice items
            InvoiceItem.objects.create(
                invoice=invoice,
                description=job.service_description,
                quantity=1,
                unit_price=job.actual_cost or job.estimated_cost,
                total_price=job.actual_cost or job.estimated_cost
            )

            if invoice.status == 'paid':
                invoice.paid_date = invoice.invoice_date + timedelta(days=random.randint(1, 15))
                invoice.payment_method = random.choice(['cash', 'card', 'bank_transfer'])
                invoice.save()
