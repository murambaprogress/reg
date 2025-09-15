import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend_project.settings')
import django
django.setup()
import api.views as api_views
from rest_framework.test import APIRequestFactory
from api.models import User

factory = APIRequestFactory()
req = factory.get('/api/reports/service-trends')
admin = User.objects.filter(role='admin').first()
if not admin:
    admin = User.objects.create_user(username='__tmp_admin__', email='admin@example.com', password='pass', role='admin', verified=True)
req.user = admin
# call underlying function
resp = api_views.service_trends.__wrapped__(req)
print('status:', getattr(resp, 'status_code', None))
print('data keys:', list(resp.data.keys()) if hasattr(resp, 'data') else None)
print('dist len', len(resp.data.get('distribution', [])))
print('monthly len', len(resp.data.get('monthly', [])))
