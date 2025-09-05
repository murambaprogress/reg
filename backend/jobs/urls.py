from django.urls import path
from . import views

urlpatterns = [
    # Main job endpoints
    path('', views.jobs_list, name='jobs_list'),
    path('<int:pk>/', views.job_detail, name='job_detail'),
    
    # Job statistics and filtering
    path('stats/', views.job_stats, name='job_stats'),
    path('customer/<int:customer_id>/', views.customer_jobs, name='customer_jobs'),
    path('technician/<int:technician_id>/', views.technician_jobs, name='technician_jobs'),
    
    # Job parts management
    path('<int:job_id>/parts/', views.job_parts, name='job_parts'),
    path('<int:job_id>/parts/add/', views.add_job_part, name='add_job_part'),
    
    # Job status management
    path('<int:job_id>/status/', views.update_job_status, name='update_job_status'),
    
    # Helper endpoints
    path('technicians/', views.available_technicians, name='available_technicians'),
    path('customers/', views.available_customers, name='available_customers'),
    
    # Technician Management
    path('technician-profiles/', views.technician_profiles, name='technician_profiles'),
    path('technician-profiles/<int:pk>/', views.technician_profile_detail, name='technician_profile_detail'),
    path('technician-dashboard/', views.technician_dashboard, name='technician_dashboard'),
    
    # Job Management for Technicians
    path('<int:job_id>/reassign/', views.reassign_job, name='reassign_job'),
    path('<int:job_id>/progress/', views.update_job_progress, name='update_job_progress'),
    path('<int:job_id>/request-parts/', views.request_parts, name='request_parts'),
    path('<int:job_id>/send-message/', views.send_message, name='send_message'),
    
    # Messages
    path('messages/', views.get_messages, name='get_messages'),
    
    # Job Assignment (Admin/Supervisor only)
    path('<int:job_id>/assign/', views.assign_job, name='assign_job'),
    path('<int:job_id>/unassign/', views.unassign_job, name='unassign_job'),
]
