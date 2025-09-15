from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Fix existing technicians by setting verified=True'

    def handle(self, *args, **options):
        # Get all technicians that are not verified
        unverified_technicians = User.objects.filter(role='technician', verified=False)
        
        if not unverified_technicians.exists():
            self.stdout.write(
                self.style.SUCCESS('All technicians are already verified')
            )
            return
        
        # Update all unverified technicians
        updated_count = unverified_technicians.update(verified=True)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully verified {updated_count} technicians')
        )
        
        # List the updated technicians
        for tech in unverified_technicians:
            self.stdout.write(f'  - {tech.username} ({tech.email})')
