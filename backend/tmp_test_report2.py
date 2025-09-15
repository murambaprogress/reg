import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend_project.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User
from api import views as api_views

# create admin user
admin, created = User.objects.get_or_create(username='__test_admin2__', defaults={'email':'test2@local','role':'admin','verified':True,'is_staff':True,'is_superuser':True})
admin.set_password('testpass')
admin.save()

factory = APIRequestFactory()
req = factory.get('/api/reports/generate?type=revenue&format=csv&date_range=month')
force_authenticate(req, user=admin)
resp = api_views.generate_report(req)
print('generate_report resp status:', getattr(resp, 'status_code', None))
# If it's a Response with .streaming_content or .data
try:
    if hasattr(resp, 'data'):
        print('data keys/type:', type(resp.data))
        if isinstance(resp.data, str):
            print('data snippet:', resp.data[:200])
    if hasattr(resp, 'content'):
        print('content bytes snippet:', resp.content[:200])
except Exception as e:
    print('error reading response:', e)

# Test whatsapp endpoint
req2 = factory.post('/api/reports/whatsapp', {'type':'revenue','date_range':'month','summary_only':True}, format='json')
force_authenticate(req2, user=admin)
resp2 = api_views.whatsapp_share(req2)
print('whatsapp status:', getattr(resp2, 'status_code', None), 'data:', getattr(resp2, 'data', None))

# Test email_report (will attempt to send mail; may fail if SMTP not configured)
req3 = factory.post('/api/reports/email', {'type':'revenue','date_range':'month','recipients':'test@example.com','subject':'Test','message':'Here is report'}, format='json')
force_authenticate(req3, user=admin)
resp3 = api_views.email_report(req3)
print('email_report status:', getattr(resp3, 'status_code', None), 'data:', getattr(resp3, 'data', None))
