import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create or get admin user
username = 'admin'
password = 'admin'
email = 'admin@regimark.com'

try:
    user = User.objects.get(username=username)
    print(f'User {username} already exists')
    # Update password
    user.set_password(password)
    user.save()
    print(f'Updated password for user {username}')
except User.DoesNotExist:
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        is_staff=True,
        is_superuser=True
    )
    print(f'Created new admin user: {username}')

# Set role if the user model has a role field
if hasattr(user, 'role'):
    user.role = 'admin'
    user.save()
    print(f'Set role to admin for user {username}')

print(f'Login credentials: {username} / {password}')
