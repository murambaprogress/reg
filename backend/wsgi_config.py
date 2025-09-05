"""
WSGI config for PythonAnywhere deployment.

This file should be used as the WSGI application file in PythonAnywhere.
"""

import os
import sys

# Add your project directory to the Python path
path = '/home/Progress/regimark_motors_control_center/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')

# Import Django's WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
