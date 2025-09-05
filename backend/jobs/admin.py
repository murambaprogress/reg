from django.contrib import admin
from .models import (
    Job, JobStatusHistory, JobPart, TechnicianProfile, 
    JobProgress, JobReassignment, PartsRequest, TechnicianMessage
)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'vehicle_model', 'vehicle_plate', 'status', 'priority', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'created_at', 'due_date')
    search_fields = ('customer_name', 'vehicle_model', 'vehicle_plate', 'service_description')
    readonly_fields = ('created_at', 'updated_at', 'started_at', 'completed_at')
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('customer', 'customer_name')
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_model', 'vehicle_plate', 'vehicle_year')
        }),
        ('Service Details', {
            'fields': ('service_description', 'estimated_hours', 'estimated_cost', 'actual_hours', 'actual_cost')
        }),
        ('Assignment & Status', {
            'fields': ('technician', 'priority', 'status', 'due_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'vehicle_photos'),
            'classes': ('collapse',)
        }),
    )


@admin.register(JobStatusHistory)
class JobStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('job', 'old_status', 'new_status', 'changed_by', 'changed_at')
    list_filter = ('old_status', 'new_status', 'changed_at')
    readonly_fields = ('changed_at',)


@admin.register(JobPart)
class JobPartAdmin(admin.ModelAdmin):
    list_display = ('job', 'part_name', 'part_number', 'quantity_used', 'unit_cost', 'total_cost', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('part_name', 'part_number', 'job__customer_name')
    readonly_fields = ('total_cost', 'added_at')


@admin.register(TechnicianProfile)
class TechnicianProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'phone', 'hire_date', 'is_available')
    list_filter = ('specialization', 'is_available', 'hire_date')
    search_fields = ('user__username', 'user__email', 'specialization', 'phone')
    readonly_fields = ('user',)


@admin.register(JobProgress)
class JobProgressAdmin(admin.ModelAdmin):
    list_display = ('job', 'technician', 'progress_percentage', 'created_at')
    list_filter = ('progress_percentage', 'created_at', 'technician')
    search_fields = ('job__customer_name', 'technician__username', 'description')
    readonly_fields = ('created_at',)


@admin.register(JobReassignment)
class JobReassignmentAdmin(admin.ModelAdmin):
    list_display = ('job', 'from_technician', 'to_technician', 'reassigned_by', 'reassigned_at')
    list_filter = ('reassigned_at', 'reassigned_by')
    search_fields = ('job__customer_name', 'from_technician__username', 'to_technician__username')
    readonly_fields = ('reassigned_at',)


@admin.register(PartsRequest)
class PartsRequestAdmin(admin.ModelAdmin):
    list_display = ('job', 'technician', 'part_name', 'quantity_requested', 'status', 'requested_at')
    list_filter = ('status', 'requested_at', 'approved_at')
    search_fields = ('job__customer_name', 'technician__username', 'part_name', 'part_number')
    readonly_fields = ('requested_at',)


@admin.register(TechnicianMessage)
class TechnicianMessageAdmin(admin.ModelAdmin):
    list_display = ('job', 'sender', 'recipient', 'is_read', 'sent_at')
    list_filter = ('is_read', 'sent_at')
    search_fields = ('job__customer_name', 'sender__username', 'recipient__username', 'message')
    readonly_fields = ('sent_at',)
