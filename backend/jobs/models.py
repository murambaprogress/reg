from django.db import models
from inventory.models import Customer
from api.models import User


class Job(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]
    
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    # Customer information
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    customer_name = models.CharField(max_length=200, blank=True)  # For display purposes
    
    # Vehicle information
    vehicle_model = models.CharField(max_length=200)
    vehicle_plate = models.CharField(max_length=50)
    vehicle_year = models.IntegerField()
    
    # Service details
    service_description = models.TextField()
    estimated_hours = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2)
    actual_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Assignment and scheduling
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_jobs')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional information
    notes = models.TextField(blank=True)
    vehicle_photos = models.JSONField(default=list, blank=True)  # Store photo URLs/paths
    
    def __str__(self):
        return f"Job #{self.id} - {self.customer_name} - {self.vehicle_model} ({self.vehicle_plate})"
    
    class Meta:
        ordering = ['-created_at']


class JobStatusHistory(models.Model):
    """Track status changes for jobs"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Job #{self.job.id} status changed from {self.old_status} to {self.new_status}"
    
    class Meta:
        ordering = ['-changed_at']


class JobPart(models.Model):
    """Parts used in a job"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='parts_used')
    part_number = models.CharField(max_length=100)
    part_name = models.CharField(max_length=255)
    quantity_used = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity_used * self.unit_cost
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity_used} x {self.part_name} for Job #{self.job.id}"


class TechnicianProfile(models.Model):
    """Extended profile for technicians"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='technician_profile')
    specialization = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    skills = models.JSONField(default=list, blank=True)  # List of skills/certifications
    
    def __str__(self):
        return f"{self.user.username} - {self.specialization}"


class JobProgress(models.Model):
    """Track detailed progress of jobs by technicians"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='progress_updates')
    technician = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_progress')
    progress_percentage = models.IntegerField(default=0)  # 0-100
    time_spent = models.DurationField(null=True, blank=True)  # Time spent on this update
    description = models.TextField()
    photos = models.JSONField(default=list, blank=True)  # Progress photos
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Job #{self.job.id} - {self.progress_percentage}% by {self.technician.username}"
    
    class Meta:
        ordering = ['-created_at']


class JobReassignment(models.Model):
    """Track job reassignments"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='reassignments')
    from_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reassigned_from')
    to_technician = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reassigned_to')
    reassigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reassignments_made')
    reason = models.TextField(blank=True)
    reassigned_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Job #{self.job.id} reassigned from {self.from_technician} to {self.to_technician}"
    
    class Meta:
        ordering = ['-reassigned_at']


class PartsRequest(models.Model):
    """Parts requests made by technicians"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='parts_requests')
    technician = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parts_requests')
    part_number = models.CharField(max_length=100)
    part_name = models.CharField(max_length=255)
    quantity_requested = models.IntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_parts_requests')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Parts request for Job #{self.job.id} - {self.part_name}"
    
    class Meta:
        ordering = ['-requested_at']


class TechnicianMessage(models.Model):
    """Messages between technicians and supervisors"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username} about Job #{self.job.id}"
    
    class Meta:
        ordering = ['-sent_at']
