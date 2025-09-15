import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend_project.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User
from api import views as api_views

admin, created = User.objects.get_or_create(username='__test_admin_agg__', defaults={'email':'testagg@local','role':'admin','verified':True,'is_staff':True,'is_superuser':True})
admin.set_password('testpass')
admin.save()

factory = APIRequestFactory()
req = factory.get('/api/reports/monthly-revenue?date_range=month')
force_authenticate(req, user=admin)
resp = api_views.monthly_revenue(req)
print('monthly_revenue status:', getattr(resp, 'status_code', None))
try:
    print('data:', resp.data)
except Exception as e:
    print('failed to read resp.data', e)

req2 = factory.get('/api/reports/technician-metrics?date_range=month')
force_authenticate(req2, user=admin)
resp2 = api_views.technician_metrics(req2)
print('technician_metrics status:', getattr(resp2, 'status_code', None))
try:
    print('data sample:', resp2.data['data'][:3])
except Exception as e:
    print('failed to read resp2.data', e)
