"""Test parts request flow:
- Ensure a Part exists with some stock
- Create a technician and admin user (or get existing)
- Create a Job assigned to the technician
- Use PartsRequestSerializer or the request_parts view to create a parts request
- Use approve_parts_request view to approve and verify stock deduction and JobPart creation
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(HERE, '..'))
WORKSPACE_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, '..'))
sys.path.insert(0, WORKSPACE_ROOT)
sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend_project.settings')

import django
django.setup()

from inventory.models import Part
from api.models import User
from jobs.models import Job, PartsRequest, JobPart
from rest_framework.test import APIRequestFactory, force_authenticate
from jobs.views import request_parts, approve_parts_request

# Ensure a Part exists
part_number = 'TEST-PART-001'
part, created = Part.objects.get_or_create(part_number=part_number, defaults={'description': 'Test Part', 'current_stock': 5, 'unit_cost': 10.0})
if created:
    print('Created test part with stock 5')
else:
    print('Found test part with current_stock =', part.current_stock)

# Ensure admin and technician users exist
admin, _ = User.objects.get_or_create(username='parts_admin', defaults={'email': 'parts_admin@example.com', 'role': 'admin', 'verified': True})
if _.__class__.__name__ == 'bool':
    pass

tech, _ = User.objects.get_or_create(username='parts_tech', defaults={'email': 'parts_tech@example.com', 'role': 'technician', 'verified': True})

# Ensure job assigned to technician
job, _ = Job.objects.get_or_create(customer_id=1, defaults={
    'customer_name': 'Test Customer', 'vehicle_model': 'TestCar', 'vehicle_plate': 'TST123', 'vehicle_year': 2020,
    'service_description': 'Test service', 'estimated_hours': 1, 'estimated_cost': 100, 'due_date': '2025-12-31', 'assigned_technician': tech
})

print('Using Job id:', job.id)

factory = APIRequestFactory()
# Create parts request as technician
req_data = {'part_number': part_number, 'quantity_requested': 2, 'reason': 'Needed for repair'}
req = factory.post(f'/api/jobs/{job.id}/request_parts', req_data, format='json')
force_authenticate(req, user=tech)
resp = request_parts(req, job.id)
print('request_parts response status:', getattr(resp, 'status_code', None))
print('response data:', getattr(resp, 'data', None))

# Find the created parts request
pr = PartsRequest.objects.filter(job=job, technician=tech, part_number=part_number).order_by('-requested_at').first()
print('PartsRequest created:', pr and pr.id)
print('Part stock before approval:', Part.objects.get(part_number=part_number).current_stock)

# Approve as admin
approve_req = factory.patch(f'/api/jobs/approve_parts_request/{pr.id}', {'action': 'approve'}, format='json')
force_authenticate(approve_req, user=admin)
approve_resp = approve_parts_request(approve_req, pr.id)
print('approve_parts_request status:', getattr(approve_resp, 'status_code', None))
print('approve response data:', getattr(approve_resp, 'data', None))

print('Part stock after approval:', Part.objects.get(part_number=part_number).current_stock)

# Check JobPart created
jp = JobPart.objects.filter(job=job, part_number=part_number).order_by('-added_at').first()
print('JobPart created:', jp is not None, ' quantity_used=', getattr(jp, 'quantity_used', None))
