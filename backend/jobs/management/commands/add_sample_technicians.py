from django.core.management.base import BaseCommand
from api.models import User
from jobs.models import TechnicianProfile


class Command(BaseCommand):
    help = 'Add sample technicians for testing'

    def handle(self, *args, **options):
        # Sample technicians data
        technicians_data = [
            {
                'username': 'john_tech',
                'email': 'john.tech@regimark.com',
                'password': 'tech123',
                'specialization': 'Engine Repair',
                'phone': '+263771234567'
            },
            {
                'username': 'mary_tech',
                'email': 'mary.tech@regimark.com',
                'password': 'tech123',
                'specialization': 'Electrical Systems',
                'phone': '+263771234568'
            },
            {
                'username': 'david_tech',
                'email': 'david.tech@regimark.com',
                'password': 'tech123',
                'specialization': 'Transmission Repair',
                'phone': '+263771234569'
            },
            {
                'username': 'sarah_tech',
                'email': 'sarah.tech@regimark.com',
                'password': 'tech123',
                'specialization': 'Brake Systems',
                'phone': '+263771234570'
            }
        ]

        created_count = 0
        
        for tech_data in technicians_data:
            # Check if user already exists
            if User.objects.filter(username=tech_data['username']).exists():
                self.stdout.write(
                    self.style.WARNING(f'Technician {tech_data["username"]} already exists')
                )
                continue
            
            try:
                # Create user
                user = User.objects.create_user(
                    username=tech_data['username'],
                    email=tech_data['email'],
                    password=tech_data['password'],
                    role='technician',
                    verified=True
                )
                
                # Create technician profile
                TechnicianProfile.objects.create(
                    user=user,
                    specialization=tech_data['specialization'],
                    phone=tech_data['phone'],
                    is_available=True
                )
                
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created technician: {tech_data["username"]}')
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating technician {tech_data["username"]}: {str(e)}')
                )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} technicians')
            )
        else:
            self.stdout.write(
                self.style.WARNING('No new technicians were created')
            )
