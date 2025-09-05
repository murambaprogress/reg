from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register', views.register, name='register'),
    path('login', views.login, name='login'),
    path('verify-otp', views.verify_otp, name='verify_otp'),
    path('create-technician', views.create_technician, name='create_technician'),
    path('me', views.me, name='me'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += [
    path('dev/otps', views.dev_otps, name='dev_otps'),
    # Admin endpoints
    path('admin/stats', views.admin_stats, name='admin_stats'),
    path('admin/technicians', views.admin_technicians, name='admin_technicians'),
    path('admin/technicians/<int:technician_id>', views.delete_technician, name='delete_technician'),
    path('admin/technicians/<int:technician_id>/toggle-active', views.toggle_technician_active, name='toggle_technician_active'),
    path('admin/recent-activity', views.admin_recent_activity, name='admin_recent_activity'),
]
