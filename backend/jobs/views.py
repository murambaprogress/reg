from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta, datetime

from .serializers import (
    JobSerializer, JobListSerializer, JobPartSerializer, JobStatusHistorySerializer,
    TechnicianProfileSerializer, JobProgressSerializer, JobReassignmentSerializer,
    PartsRequestSerializer, TechnicianMessageSerializer, TechnicianJobSerializer
)
from .models import (
    Job, JobPart, JobStatusHistory, TechnicianProfile, JobProgress, 
    JobReassignment, PartsRequest, TechnicianMessage
)
from inventory.models import Customer
from api.models import User


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def jobs_list(request):
    """List all jobs or create a new job"""
    
    if request.method == 'GET':
        # Get query parameters for filtering
        status_filter = request.GET.get('status')
        priority_filter = request.GET.get('priority')
        technician_filter = request.GET.get('technician')
        customer_filter = request.GET.get('customer')
        search = request.GET.get('search')
        
        # Start with all jobs
        queryset = Job.objects.all().select_related('customer', 'technician')
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if technician_filter:
            queryset = queryset.filter(technician_id=technician_filter)
        if customer_filter:
            queryset = queryset.filter(customer_id=customer_filter)
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(vehicle_model__icontains=search) |
                Q(vehicle_plate__icontains=search) |
                Q(service_description__icontains=search)
            )
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        # Use list serializer for performance
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = JobSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                job = serializer.save()
                return Response(JobSerializer(job, context={'request': request}).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def job_detail(request, pk):
    """Retrieve, update or delete a job"""
    try:
        job = Job.objects.select_related('customer', 'technician').prefetch_related(
            'parts_used', 'status_history'
        ).get(pk=pk)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = JobSerializer(job, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = JobSerializer(job, data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                # Handle status changes with timestamps
                if 'status' in request.data:
                    new_status = request.data['status']
                    if new_status == 'in_progress' and not job.started_at:
                        serializer.validated_data['started_at'] = timezone.now()
                    elif new_status == 'completed' and not job.completed_at:
                        serializer.validated_data['completed_at'] = timezone.now()
                
                updated_job = serializer.save()
                return Response(JobSerializer(updated_job, context={'request': request}).data)
            except Exception as e:
                return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def job_stats(request):
    """Get job statistics"""
    try:
        # Get counts by status
        status_counts = Job.objects.values('status').annotate(count=Count('id'))
        status_data = {item['status']: item['count'] for item in status_counts}
        
        # Get counts by priority
        priority_counts = Job.objects.values('priority').annotate(count=Count('id'))
        priority_data = {item['priority']: item['count'] for item in priority_counts}
        
        # Get overdue jobs
        today = timezone.now().date()
        overdue_count = Job.objects.filter(
            due_date__lt=today,
            status__in=['pending', 'in_progress']
        ).count()
        
        # Get jobs due this week
        week_end = today + timedelta(days=7)
        due_this_week = Job.objects.filter(
            due_date__gte=today,
            due_date__lte=week_end,
            status__in=['pending', 'in_progress']
        ).count()
        
        # Get recent activity (jobs created in last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_jobs = Job.objects.filter(created_at__gte=week_ago).count()
        
        return Response({
            'total_jobs': Job.objects.count(),
            'status_breakdown': status_data,
            'priority_breakdown': priority_data,
            'overdue_jobs': overdue_count,
            'due_this_week': due_this_week,
            'recent_jobs': recent_jobs
        })
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def customer_jobs(request, customer_id):
    """Get all jobs for a specific customer"""
    try:
        jobs = Job.objects.filter(customer_id=customer_id).order_by('-created_at')
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_jobs(request, technician_id):
    """Get all jobs assigned to a specific technician"""
    try:
        jobs = Job.objects.filter(technician_id=technician_id).order_by('-created_at')
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_job_part(request, job_id):
    """Add a part to a job"""
    try:
        job = Job.objects.get(pk=job_id)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    data = request.data.copy()
    data['job'] = job_id
    
    serializer = JobPartSerializer(data=data)
    if serializer.is_valid():
        try:
            part = serializer.save()
            return Response(JobPartSerializer(part).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def job_parts(request, job_id):
    """Get all parts used in a job"""
    try:
        parts = JobPart.objects.filter(job_id=job_id).order_by('-added_at')
        serializer = JobPartSerializer(parts, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_job_status(request, job_id):
    """Update job status and add to history"""
    try:
        job = Job.objects.get(pk=job_id)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    notes = request.data.get('notes', '')
    
    if not new_status:
        return Response({'message': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        old_status = job.status
        job.status = new_status
        
        # Update timestamps based on status
        if new_status == 'in_progress' and not job.started_at:
            job.started_at = timezone.now()
        elif new_status == 'completed' and not job.completed_at:
            job.completed_at = timezone.now()
        
        job.save()
        
        # Create status history entry
        JobStatusHistory.objects.create(
            job=job,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        return Response(JobSerializer(job, context={'request': request}).data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def available_technicians(request):
    """Get list of available technicians"""
    try:
        # Get all users who could be technicians (you might want to filter by role)
        technicians = User.objects.filter(is_active=True).values('id', 'username', 'email')
        return Response(list(technicians))
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def available_customers(request):
    """Get list of available customers"""
    try:
        customers = Customer.objects.all().values('id', 'name', 'phone', 'email')
        return Response(list(customers))
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Technician Management Views

@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_profiles(request):
    """List all technician profiles or create a new one"""
    if request.method == 'GET':
        # Only admins and supervisors can view all technicians
        if request.user.role not in ['admin', 'supervisor']:
            return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        profiles = TechnicianProfile.objects.select_related('user').all()
        serializer = TechnicianProfileSerializer(profiles, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Only admins and supervisors can create technician profiles
        if request.user.role not in ['admin', 'supervisor']:
            return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # First create the user account
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email'),
            'password': request.data.get('password', 'defaultpass123'),
            'role': 'technician'
        }
        
        try:
            user = User.objects.create_user(**user_data)
            
            # Create technician profile
            profile_data = request.data.copy()
            profile_data['user'] = user.id
            
            serializer = TechnicianProfileSerializer(data=profile_data)
            if serializer.is_valid():
                profile = serializer.save(user=user)
                return Response(TechnicianProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
            else:
                # If profile creation fails, delete the user
                user.delete()
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_profile_detail(request, pk):
    """Retrieve, update or delete a technician profile"""
    try:
        profile = TechnicianProfile.objects.select_related('user').get(pk=pk)
    except TechnicianProfile.DoesNotExist:
        return Response({'message': 'Technician not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Technicians can view their own profile, admins/supervisors can view all
        if request.user.role == 'technician' and profile.user != request.user:
            return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TechnicianProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Only admins and supervisors can update profiles
        if request.user.role not in ['admin', 'supervisor']:
            return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TechnicianProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Only admins can delete technician accounts
        if request.user.role != 'admin':
            return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete the user account (this will cascade to profile)
        profile.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_dashboard(request):
    """Get technician's dashboard data - their assigned jobs"""
    if request.user.role != 'technician':
        return Response({'message': 'Only technicians can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get jobs assigned to this technician
        jobs = Job.objects.filter(technician=request.user).prefetch_related(
            'progress_updates', 'parts_requests', 'messages'
        ).order_by('-created_at')
        
        serializer = TechnicianJobSerializer(jobs, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reassign_job(request, job_id):
    """Reassign a job to a different technician"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        job = Job.objects.get(pk=job_id)
        new_technician_id = request.data.get('technician_id')
        reason = request.data.get('reason', '')
        
        if not new_technician_id:
            return Response({'message': 'New technician ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        new_technician = User.objects.get(pk=new_technician_id, role='technician')
        old_technician = job.technician
        
        # Create reassignment record
        JobReassignment.objects.create(
            job=job,
            from_technician=old_technician,
            to_technician=new_technician,
            reassigned_by=request.user,
            reason=reason
        )
        
        # Update job
        job.technician = new_technician
        job.save()
        
        # Create status history entry
        JobStatusHistory.objects.create(
            job=job,
            old_status=job.status,
            new_status=job.status,
            changed_by=request.user,
            notes=f'Job reassigned from {old_technician.username if old_technician else "unassigned"} to {new_technician.username}'
        )
        
        return Response({'message': 'Job reassigned successfully'})
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'message': 'Technician not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_job_progress(request, job_id):
    """Update job progress by technician"""
    try:
        job = Job.objects.get(pk=job_id)
        
        # Only assigned technician can update progress
        if job.technician != request.user:
            return Response({'message': 'You can only update progress for jobs assigned to you'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['job'] = job_id
        data['technician'] = request.user.id
        
        serializer = JobProgressSerializer(data=data)
        if serializer.is_valid():
            progress = serializer.save()
            return Response(JobProgressSerializer(progress).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def request_parts(request, job_id):
    """Request parts for a job"""
    try:
        job = Job.objects.get(pk=job_id)
        
        # Only assigned technician can request parts
        if job.technician != request.user:
            return Response({'message': 'You can only request parts for jobs assigned to you'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['job'] = job_id
        data['technician'] = request.user.id
        
        serializer = PartsRequestSerializer(data=data)
        if serializer.is_valid():
            parts_request = serializer.save()
            return Response(PartsRequestSerializer(parts_request).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def send_message(request, job_id):
    """Send message about a job"""
    try:
        job = Job.objects.get(pk=job_id)
        recipient_id = request.data.get('recipient_id')
        message = request.data.get('message')
        
        if not recipient_id or not message:
            return Response({'message': 'Recipient and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        recipient = User.objects.get(pk=recipient_id)
        
        # Create message
        tech_message = TechnicianMessage.objects.create(
            job=job,
            sender=request.user,
            recipient=recipient,
            message=message
        )
        
        return Response(TechnicianMessageSerializer(tech_message).data, status=status.HTTP_201_CREATED)
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'message': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_messages(request):
    """Get messages for current user"""
    try:
        messages = TechnicianMessage.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user)
        ).order_by('-sent_at')
        
        serializer = TechnicianMessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def assign_job(request, job_id):
    """Assign a job to a technician"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        job = Job.objects.get(pk=job_id)
        technician_id = request.data.get('assigned_technician')
        
        if not technician_id:
            return Response({'message': 'Technician ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        technician = User.objects.get(pk=technician_id, role='technician')
        old_technician = job.assigned_technician
        
        # Update job assignment
        job.assigned_technician = technician
        if job.status == 'Pending':
            job.status = 'Assigned'
        job.save()
        
        # Create status history entry
        JobStatusHistory.objects.create(
            job=job,
            old_status=job.status,
            new_status=job.status,
            changed_by=request.user,
            notes=f'Job assigned to {technician.username}'
        )
        
        return Response({'message': 'Job assigned successfully'})
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'message': 'Technician not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def unassign_job(request, job_id):
    """Unassign a job from a technician"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        job = Job.objects.get(pk=job_id)
        old_technician = job.assigned_technician
        
        # Update job assignment
        job.assigned_technician = None
        job.status = 'Pending'
        job.save()
        
        # Create status history entry
        JobStatusHistory.objects.create(
            job=job,
            old_status='Assigned',
            new_status='Pending',
            changed_by=request.user,
            notes=f'Job unassigned from {old_technician.username if old_technician else "unknown"}'
        )
        
        return Response({'message': 'Job unassigned successfully'})
        
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
