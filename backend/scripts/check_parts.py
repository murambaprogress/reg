import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend_project.settings')
django.setup()
from inventory.models import Part
print('Parts count:', Part.objects.count())
