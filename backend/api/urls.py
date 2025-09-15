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
    path('admin/technician-progress', views.admin_technician_progress, name='admin_technician_progress'),
    path('admin/recent-activity', views.admin_recent_activity, name='admin_recent_activity'),
    path('admin/system-health', views.admin_system_health, name='admin_system_health'),
    # Dashboard endpoints
    path('dashboard/kpi', views.dashboard_kpi, name='dashboard_kpi'),
    path('dashboard/monthly-stats', views.dashboard_monthly_stats, name='dashboard_monthly_stats'),
    path('dashboard/active-jobs', views.active_jobs, name='dashboard_active_jobs'),
    path('reports/generate', views.generate_report, name='generate_report'),
    path('reports/email', views.email_report, name='email_report'),
    path('reports/whatsapp', views.whatsapp_share, name='whatsapp_share'),
    path('reports/monthly-revenue', views.monthly_revenue, name='monthly_revenue'),
    path('reports/technician-metrics', views.technician_metrics, name='technician_metrics'),
    path('reports/technician-jobs/<int:technician_id>', views.technician_jobs_detail, name='technician_jobs_detail'),
    path('reports/service-trends', views.service_trends, name='service_trends'),
    path('departments', views.departments_list, name='departments_list'),
]
