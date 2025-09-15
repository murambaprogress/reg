import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend_project.settings')
import django
django.setup()
from django.test import Client
c=Client()
from api.models import User
admin, created = User.objects.get_or_create(username='__test_admin__', defaults={'email':'test@local','role':'admin','verified':True,'is_staff':True,'is_superuser':True})
admin.set_password('testpass')
admin.save()
resp = c.post('/api/login', {'username':'__test_admin__','password':'testpass'}, content_type='application/json')
print('login status', resp.status_code)
if resp.status_code==200:
    import json
    token = json.loads(resp.content)['token']
    headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    r = c.get('/api/reports/generate?type=revenue&format=csv&date_range=month', **headers)
    print('generate_report status', r.status_code)
    print('content-type', r.get('Content-Type'))
    print('content-snippet:', r.content[:200])
else:
    print('login failed, content:', resp.content)
