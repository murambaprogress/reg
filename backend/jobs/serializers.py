from rest_framework import serializers
from .models import (
    Job, JobStatusHistory, JobPart, TechnicianProfile, 
    JobProgress, JobReassignment, PartsRequest, TechnicianMessage
)
from inventory.models import Customer
from api.models import User


class JobPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPart
        fields = ('id', 'part_number', 'part_name', 'quantity_used', 'unit_cost', 'total_cost', 'added_at')
        read_only_fields = ('total_cost', 'added_at')


class JobStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = JobStatusHistory
        fields = ('id', 'old_status', 'new_status', 'changed_by', 'changed_by_name', 'changed_at', 'notes')
        read_only_fields = ('changed_at',)


class JobSerializer(serializers.ModelSerializer):
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), 
        source='customer', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    customer = serializers.SerializerMethodField(read_only=True)
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    technician_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='technician', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    technician = serializers.SerializerMethodField(read_only=True)
    
    parts_used = JobPartSerializer(many=True, read_only=True)
    status_history = JobStatusHistorySerializer(many=True, read_only=True)
    
    # Frontend field mappings (camelCase)
    vehicleModel = serializers.CharField(source='vehicle_model', required=False)
    vehiclePlate = serializers.CharField(source='vehicle_plate', required=False)
    vehicleYear = serializers.IntegerField(source='vehicle_year', required=False)
    serviceDescription = serializers.CharField(source='service_description', required=False)
    estimatedHours = serializers.DecimalField(source='estimated_hours', max_digits=8, decimal_places=2, required=False)
    estimatedCost = serializers.DecimalField(source='estimated_cost', max_digits=12, decimal_places=2, required=False)
    actualHours = serializers.DecimalField(source='actual_hours', max_digits=8, decimal_places=2, required=False, allow_null=True)
    actualCost = serializers.DecimalField(source='actual_cost', max_digits=12, decimal_places=2, required=False, allow_null=True)
    dueDate = serializers.DateField(source='due_date', required=False)
    vehiclePhotos = serializers.JSONField(source='vehicle_photos', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    startedAt = serializers.DateTimeField(source='started_at', read_only=True)
    completedAt = serializers.DateTimeField(source='completed_at', read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'customer_id', 'customer', 'customer_name', 'technician_id', 'technician',
            'vehicle_model', 'vehicle_plate', 'vehicle_year', 'service_description',
            'estimated_hours', 'estimated_cost', 'actual_hours', 'actual_cost',
            'priority', 'status', 'due_date', 'notes', 'vehicle_photos',
            'created_at', 'updated_at', 'started_at', 'completed_at',
            'parts_used', 'status_history',
            # Frontend camelCase fields
            'vehicleModel', 'vehiclePlate', 'vehicleYear', 'serviceDescription',
            'estimatedHours', 'estimatedCost', 'actualHours', 'actualCost',
            'dueDate', 'vehiclePhotos', 'createdAt', 'updatedAt', 'startedAt', 'completedAt'
        )

    def get_customer(self, obj):
        if obj.customer:
            return {
                'id': obj.customer.id,
                'name': obj.customer.name,
                'phone': obj.customer.phone,
                'email': obj.customer.email
            }
        return None

    def get_technician(self, obj):
        if obj.technician:
            return {
                'id': obj.technician.id,
                'name': obj.technician.username,
                'email': obj.technician.email
            }
        return None

    def validate(self, data):
        # Handle customer creation if needed
        customer_name = data.pop('customer_name', None)
        if not data.get('customer') and customer_name:
            customer, created = Customer.objects.get_or_create(
                name=customer_name,
                defaults={'phone': '', 'email': '', 'address': ''}
            )
            data['customer'] = customer
            
        # Set customer_name for display
        if data.get('customer'):
            data['customer_name'] = data['customer'].name
        elif customer_name:
            data['customer_name'] = customer_name

        return data

    def create(self, validated_data):
        # Create the job
        job = Job.objects.create(**validated_data)
        
        # Create initial status history entry
        JobStatusHistory.objects.create(
            job=job,
            old_status='',
            new_status=job.status,
            changed_by=self.context.get('request').user if self.context.get('request') else None,
            notes='Job created'
        )
        
        return job

    def update(self, instance, validated_data):
        # Track status changes
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Update the job
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Create status history entry if status changed
        if old_status != new_status:
            JobStatusHistory.objects.create(
                job=instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=self.context.get('request').user if self.context.get('request') else None,
                notes=f'Status changed from {old_status} to {new_status}'
            )
        
        return instance


class JobListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job lists"""
    customer_name = serializers.CharField(read_only=True)
    technician_name = serializers.CharField(source='technician.username', read_only=True)
    
    class Meta:
        model = Job
        fields = (
            'id', 'customer_name', 'vehicle_model', 'vehicle_plate', 'vehicle_year',
            'service_description', 'estimated_cost', 'priority', 'status', 'due_date',
            'technician_name', 'created_at', 'updated_at'
        )


class TechnicianProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    class Meta:
        model = TechnicianProfile
        fields = (
            'id', 'username', 'email', 'role', 'is_active', 'specialization', 
            'phone', 'hire_date', 'hourly_rate', 'is_available', 'skills'
        )


class JobProgressSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.username', read_only=True)
    
    class Meta:
        model = JobProgress
        fields = (
            'id', 'job', 'technician', 'technician_name', 'progress_percentage', 
            'time_spent', 'description', 'photos', 'created_at'
        )
        read_only_fields = ('created_at',)


class JobReassignmentSerializer(serializers.ModelSerializer):
    from_technician_name = serializers.CharField(source='from_technician.username', read_only=True)
    to_technician_name = serializers.CharField(source='to_technician.username', read_only=True)
    reassigned_by_name = serializers.CharField(source='reassigned_by.username', read_only=True)
    
    class Meta:
        model = JobReassignment
        fields = (
            'id', 'job', 'from_technician', 'from_technician_name', 
            'to_technician', 'to_technician_name', 'reassigned_by', 
            'reassigned_by_name', 'reason', 'reassigned_at'
        )
        read_only_fields = ('reassigned_at',)


class PartsRequestSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = PartsRequest
        fields = (
            'id', 'job', 'technician', 'technician_name', 'part_number', 
            'part_name', 'quantity_requested', 'reason', 'status', 
            'requested_at', 'approved_by', 'approved_by_name', 'approved_at'
        )
        read_only_fields = ('requested_at',)


class TechnicianMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    
    class Meta:
        model = TechnicianMessage
        fields = (
            'id', 'job', 'sender', 'sender_name', 'recipient', 
            'recipient_name', 'message', 'is_read', 'sent_at'
        )
        read_only_fields = ('sent_at',)


class TechnicianJobSerializer(serializers.ModelSerializer):
    """Serializer for technician's view of their jobs"""
    customer = serializers.SerializerMethodField()
    progress_updates = JobProgressSerializer(many=True, read_only=True)
    parts_requests = PartsRequestSerializer(many=True, read_only=True)
    messages = TechnicianMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Job
        fields = (
            'id', 'customer', 'customer_name', 'vehicle_model', 'vehicle_plate', 
            'vehicle_year', 'service_description', 'estimated_hours', 'estimated_cost',
            'priority', 'status', 'due_date', 'notes', 'vehicle_photos',
            'created_at', 'updated_at', 'started_at', 'completed_at',
            'progress_updates', 'parts_requests', 'messages'
        )
    
    def get_customer(self, obj):
        if obj.customer:
            return {
                'id': obj.customer.id,
                'name': obj.customer.name,
                'phone': obj.customer.phone,
                'email': obj.customer.email
            }
        return None
