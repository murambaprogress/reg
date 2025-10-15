import os
import jwt
import datetime
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from .models import OTP, Department
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import RegisterSerializer, LoginSerializer, OTPSerializer, UserSerializer
import logging
import json
import platform
import django

User = get_user_model()


def calculate_technician_efficiency(technician):
    """
    Calculate enhanced efficiency score based on:
    1. Time management (40%): Completing jobs within estimated hours
    2. On-time delivery (35%): Completing jobs by due date
    3. Inventory efficiency (25%): Using parts within estimated cost variance
    """
    from jobs.models import Job, JobPart
    from django.db.models import Sum, F
    
    completed_jobs = Job.objects.filter(
        assigned_technician=technician,
        status='completed'
    )
    
    if not completed_jobs.exists():
        return 0
    
    total_completed_count = completed_jobs.count()
    
    # Time efficiency calculation
    time_efficient_jobs = completed_jobs.filter(
        actual_hours__lte=F('estimated_hours')
    ).count()
    
    # On-time delivery calculation
    on_time_jobs = completed_jobs.filter(
        completed_at__date__lte=F('due_date')
    ).count()
    
    # Inventory efficiency calculation
    inventory_efficient_jobs = 0
    
    for job in completed_jobs:
        parts_used = JobPart.objects.filter(job=job)
        if parts_used.exists():
            actual_parts_cost = parts_used.aggregate(
                total=Sum('total_cost')
            )['total'] or 0
            
            # Consider job efficient if parts cost is within 10% of estimated cost
            if job.estimated_cost > 0:
                cost_variance = abs(actual_parts_cost - job.estimated_cost) / job.estimated_cost
                if cost_variance <= 0.1:  # Within 10% variance
                    inventory_efficient_jobs += 1
            elif actual_parts_cost == 0:  # No parts used and none estimated
                inventory_efficient_jobs += 1
        else:
            # No parts used - efficient if estimated cost was low/zero
            if job.estimated_cost <= 50:  # Low cost threshold
                inventory_efficient_jobs += 1
    
    # Calculate component efficiencies
    time_efficiency = (time_efficient_jobs / total_completed_count) * 100
    delivery_efficiency = (on_time_jobs / total_completed_count) * 100
    inventory_efficiency = (inventory_efficient_jobs / total_completed_count) * 100
    
    # Weighted efficiency score
    efficiency_score = (
        (time_efficiency * 0.40) +
        (delivery_efficiency * 0.35) +
        (inventory_efficiency * 0.25)
    )
    
    return min(100, max(0, round(efficiency_score)))


def generate_otp():
    from random import randint
    return str(randint(100000, 999999))


def send_otp_email(email, otp, subject='Your verification code'):
    import time
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
    attempts = int(os.environ.get('EMAIL_SEND_RETRIES', '3'))
    last_err = None
    for attempt in range(1, attempts + 1):
        try:
            send_mail(subject, f'Your OTP is: {otp}', from_email, [email], fail_silently=False)
            print(f"OTP sent to {email} from {from_email} (attempt {attempt})")
            return True, None
        except Exception as e:
            err = f"{e.__class__.__name__}: {str(e)}"
            print(f"Attempt {attempt} failed to send OTP to {email}: {err}")
            last_err = err
            # short backoff between tries
            if attempt < attempts:
                time.sleep(1)
    # All attempts failed - fallback: log OTP to console so developer can proceed
    print(f"All {attempts} attempts failed to send OTP to {email}. Falling back to console log. OTP for {email}: {otp}")
    return False, last_err


def create_jwt(user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def permissions_for_role(role: str):
    # Admin sees everything including personal expenses
    # Supervisor sees everything except personal expenses
    # Technician has limited view (no personal expenses)
    return {
        'show_personal_expenses': True if role == 'admin' else False
    }


# dev-only OTP logger
otp_log_file = settings.BASE_DIR / 'otp.log' if hasattr(settings, 'BASE_DIR') else 'otp.log'
logger = logging.getLogger('otp_logger')
if not logger.handlers:
    fh = logging.FileHandler(str(otp_log_file))
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    logger.propagate = False


def create_and_log_otp(email, code):
    """Create OTP DB record and append to dev log file."""
    try:
        OTP.objects.create(email=email, code=code)
    except Exception as e:
        # if DB write fails, still log to file
        logger.info(f"FAILED_DB_WRITE OTP for {email}: {code} - {e}")
    logger.info(f"OTP for {email}: {code}")


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, email=email, password=password, role=role, verified=False)
    otp_code = generate_otp()
    create_and_log_otp(email, otp_code)
    ok, err = send_otp_email(email, otp_code, subject='Verification Code')
    if not ok:
        return Response({'message': 'Registered but failed to send OTP', 'error': err}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'message': 'Registered. OTP sent to email.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = OTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    email = data.get('email')
    otp = data.get('otp')
    try:
        otp_obj = OTP.objects.filter(email=email, code=otp, used=False).order_by('-created_at').first()
        if not otp_obj:
            return Response({'message': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        # optional expiry check (15 minutes)
        if (timezone.now() - otp_obj.created_at).total_seconds() > 900:
            return Response({'message': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
        otp_obj.used = True
        otp_obj.save()
        # verify user
        user = User.objects.filter(email=email).first()
        if user:
            user.verified = True
            user.save()
        # If supervisor login flow, return token
        if email == settings.SUPERVISOR_EMAIL:
            # Create or get supervisor user record (hardcoded credentials)
            supervisor, created = User.objects.get_or_create(username=settings.SUPERVISOR_USERNAME, defaults={
                'email': settings.SUPERVISOR_EMAIL,
                'role': 'supervisor',
                'verified': True,
            })
            # ensure password matches hardcoded
            supervisor.set_password(settings.SUPERVISOR_PASSWORD)
            supervisor.verified = True
            supervisor.save()
            token = create_jwt(supervisor)
            perms = permissions_for_role('supervisor')
            return Response({'message': 'Supervisor verified', 'token': token, 'role': 'supervisor', 'permissions': perms})
        # If admin login flow, return token
        if email == settings.ADMIN_EMAIL:
            admin, created = User.objects.get_or_create(username=settings.ADMIN_USERNAME, defaults={
                'email': settings.ADMIN_EMAIL,
                'role': 'admin',
                'verified': True,
            })
            admin.set_password(settings.ADMIN_PASSWORD)
            admin.verified = True
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            token = create_jwt(admin)
            perms = permissions_for_role('admin')
            return Response({'message': 'Admin verified', 'token': token, 'role': 'admin', 'permissions': perms})
        return Response({'message': 'Email verified.'})
    except Exception as e:
        return Response({'message': 'Error verifying OTP', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'permissions': permissions_for_role(user.role),
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    from rest_framework_simplejwt.tokens import RefreshToken
    
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    username = data.get('username')
    password = data.get('password')
    # supervisor hardcoded flow
    if username == settings.SUPERVISOR_USERNAME:
        if password != settings.SUPERVISOR_PASSWORD:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        otp_code = generate_otp()
        create_and_log_otp(settings.SUPERVISOR_EMAIL, otp_code)
        ok, err = send_otp_email(settings.SUPERVISOR_EMAIL, otp_code, subject='Supervisor Login OTP')
        if not ok:
            return Response({'message': 'Failed to send OTP to supervisor', 'error': err}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'OTP sent to supervisor email', 'otpRequired': True})
    # admin hardcoded flow - temporarily skip OTP for testing
    if username == settings.ADMIN_USERNAME:
        if password != settings.ADMIN_PASSWORD:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        # Create or get admin user record (hardcoded credentials)
        admin, created = User.objects.get_or_create(username=settings.ADMIN_USERNAME, defaults={
            'email': settings.ADMIN_EMAIL,
            'role': 'admin',
            'verified': True,
        })
        admin.set_password(settings.ADMIN_PASSWORD)
        admin.verified = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        token = create_jwt(admin)
        perms = permissions_for_role('admin')
        return Response({'message': 'Admin login successful', 'token': token, 'role': 'admin', 'permissions': perms})
    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    if not user.verified:
        return Response({'message': 'Email not verified'}, status=status.HTTP_403_FORBIDDEN)
    if not user.check_password(password):
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    token = create_jwt(user)
    perms = permissions_for_role(user.role)
    return Response({'token': token, 'role': user.role, 'permissions': perms})

def require_admin(fn):
    def wrapper(request, *args, **kwargs):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth.startswith('Bearer '):
            return Response({'message': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            if payload.get('role') != 'admin':
                return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            request.user_payload = payload
            return fn(request, *args, **kwargs)
        except Exception as e:
            return Response({'message': 'Invalid token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    return wrapper
@csrf_exempt
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_technician(request):
    print(f"DEBUG: create_technician called by user: {request.user}")
    print(f"DEBUG: user role: {getattr(request.user, 'role', 'NO_ROLE')}")
    print(f"DEBUG: user authenticated: {request.user.is_authenticated}")
    print(f"DEBUG: request data: {request.data}")
    
    # Check if user is admin or supervisor
    if not hasattr(request.user, 'role') or request.user.role not in ['admin', 'supervisor']:
        print(f"DEBUG: Access denied - user role is {getattr(request.user, 'role', 'NO_ROLE')}")
        return Response({'message': f'Forbidden - user role is {getattr(request.user, "role", "NO_ROLE")}'}, status=status.HTTP_403_FORBIDDEN)
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    print(f"DEBUG: Creating technician with username: {username}, email: {email}")
    
    if not username or not email or not password:
        print(f"DEBUG: Missing required fields - username: {username}, email: {email}, password: {'***' if password else None}")
        return Response({'message': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        print(f"DEBUG: Username already exists: {username}")
        return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        print(f"DEBUG: Email already exists: {email}")
        return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        tech = User.objects.create_user(
            username=username, 
            email=email, 
            password=password, 
            role='technician', 
            verified=True
        )
        print(f"DEBUG: Technician created successfully: {tech.id}")
        return Response({
            'message': 'Technician created successfully', 
            'id': tech.id,
            'username': tech.username,
            'email': tech.email
        })
    except Exception as e:
        print(f"DEBUG: Error creating technician: {str(e)}")
        return Response({'message': 'Error creating technician', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([AllowAny])
def list_otps(request):
    """Dev-only endpoint to list recent OTPs (for testing)."""
    if not settings.DEBUG:
        return Response({'message': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
    otps = OTP.objects.all().order_by('-created_at')[:100]
    serializer = OTPSerializer(otps, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def dev_otps(request):
    # dev-only: return last 50 lines from otp.log
    if os.environ.get('ENABLE_2FA', '1') == '0':
        return Response({'message': 'Dev OTP listing disabled in production mode'}, status=403)
    try:
        path = str(otp_log_file)
        if not os.path.exists(path):
            return Response({'otps': []})
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        lines = [l.strip() for l in lines if l.strip()]
        return Response({'otps': lines[-50:]})
    except Exception as e:
        return Response({'message': 'Failed to read OTP log', 'error': str(e)}, status=500)

# Admin endpoints
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Get admin dashboard statistics"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from jobs.models import Job
        from django.db.models import Count, Q
        
        # Get technician stats
        technicians = User.objects.filter(role='technician')
        total_technicians = technicians.count()
        active_technicians = technicians.filter(is_active=True).count()
        
        # Get detailed job stats by status
        jobs = Job.objects.all()
        total_jobs = jobs.count()
        pending_jobs = jobs.filter(status='pending').count()
        in_progress_jobs = jobs.filter(status='in_progress').count()
        ready_to_collect_jobs = jobs.filter(status='ready_to_collect').count()
        completed_jobs = jobs.filter(status='completed').count()
        on_hold_jobs = jobs.filter(status='on_hold').count()
        cancelled_jobs = jobs.filter(status='cancelled').count()
        
        # Today's stats
        today = timezone.now().date()
        completed_today = jobs.filter(status='completed', updated_at__date=today).count()
        assigned_today = jobs.filter(created_at__date=today).count()
        
        # Overdue jobs (past due date and not completed)
        overdue_jobs = jobs.filter(
            due_date__lt=today,
            status__in=['pending', 'in_progress', 'on_hold']
        ).count()
        
        # Technician workload with efficiency scores
        technician_workload = []
        for tech in technicians.filter(is_active=True):
            tech_jobs = jobs.filter(assigned_technician=tech)
            active_jobs = tech_jobs.filter(status__in=['pending', 'in_progress', 'on_hold']).count()
            completed_jobs_tech = tech_jobs.filter(status='completed').count()
            
            # Calculate efficiency score
            efficiency_score = calculate_technician_efficiency(tech)
            
            technician_workload.append({
                'id': tech.id,
                'username': tech.username,
                'email': tech.email,
                'active_jobs': active_jobs,
                'completed_jobs': completed_jobs_tech,
                'total_assigned': tech_jobs.count(),
                'efficiency_score': efficiency_score,
                'last_login': tech.last_login.isoformat() if tech.last_login else None
            })
        
        # Inventory usage statistics
        from jobs.models import JobPart
        from django.db.models import Sum
        
        # Today's inventory usage
        today_parts_usage = JobPart.objects.filter(
            added_at__date=today
        ).aggregate(
            total_cost=Sum('total_cost'),
            total_items=Sum('quantity_used')
        )
        
        # This week's inventory usage
        week_start = today - timezone.timedelta(days=today.weekday())
        week_parts_usage = JobPart.objects.filter(
            added_at__date__gte=week_start
        ).aggregate(
            total_cost=Sum('total_cost'),
            total_items=Sum('quantity_used')
        )
        
        # Most used parts this week
        from django.db.models import Count
        popular_parts = JobPart.objects.filter(
            added_at__date__gte=week_start
        ).values('part_number', 'part_name').annotate(
            usage_count=Sum('quantity_used'),
            total_cost=Sum('total_cost')
        ).order_by('-usage_count')[:5]
        
        return Response({
            'totalTechnicians': total_technicians,
            'activeTechnicians': active_technicians,
            'totalJobs': total_jobs,
            'pendingJobs': pending_jobs,
            'inProgressJobs': in_progress_jobs,
            'readyToCollectJobs': ready_to_collect_jobs,
            'completedJobs': completed_jobs,
            'onHoldJobs': on_hold_jobs,
            'cancelledJobs': cancelled_jobs,
            'completedToday': completed_today,
            'assignedToday': assigned_today,
            'overdueJobs': overdue_jobs,
            'technicianWorkload': technician_workload,
            'inventoryUsage': {
                'today': {
                    'total_cost': float(today_parts_usage['total_cost'] or 0),
                    'total_items': today_parts_usage['total_items'] or 0
                },
                'thisWeek': {
                    'total_cost': float(week_parts_usage['total_cost'] or 0),
                    'total_items': week_parts_usage['total_items'] or 0
                },
                'popularParts': list(popular_parts)
            },
            'lastUpdated': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({'message': 'Error fetching stats', 'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_technicians(request):
    """Get list of all technicians"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from jobs.models import Job
        
        technicians = User.objects.filter(role='technician').order_by('username')
        technician_data = []
        
        for tech in technicians:
            assigned_jobs_count = Job.objects.filter(assigned_technician=tech).count()
            technician_data.append({
                'id': tech.id,
                'username': tech.username,
                'email': tech.email,
                'is_active': tech.is_active,
                'last_login': tech.last_login,
                'assigned_jobs_count': assigned_jobs_count,
                'date_joined': tech.date_joined
            })
        
        return Response(technician_data)
    except Exception as e:
        return Response({'message': 'Error fetching technicians', 'error': str(e)}, status=500)

@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_technician(request, technician_id):
    """Delete a technician (admin only)"""
    if request.user.role != 'admin':
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        technician = User.objects.get(id=technician_id, role='technician')
        technician.delete()
        return Response({'message': 'Technician deleted successfully'})
    except User.DoesNotExist:
        return Response({'message': 'Technician not found'}, status=404)
    except Exception as e:
        return Response({'message': 'Error deleting technician', 'error': str(e)}, status=500)

@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_technician_active(request, technician_id):
    """Toggle technician active status"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        technician = User.objects.get(id=technician_id, role='technician')
        is_active = request.data.get('is_active', not technician.is_active)
        technician.is_active = is_active
        technician.save()
        
        return Response({
            'message': f'Technician {"activated" if is_active else "deactivated"} successfully',
            'is_active': is_active
        })
    except User.DoesNotExist:
        return Response({'message': 'Technician not found'}, status=404)
    except Exception as e:
        return Response({'message': 'Error updating technician', 'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_recent_activity(request):
    """Get recent system activity"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from jobs.models import Job
        
        # Get recent jobs and activities
        recent_jobs = Job.objects.all().order_by('-updated_at')[:10]
        activities = []
        
        for job in recent_jobs:
            if job.status == 'Completed':
                activities.append({
                    'id': f'job_completed_{job.id}',
                    'type': 'job_completed',
                    'message': f'Job #{job.id} completed by {job.assigned_technician.username if job.assigned_technician else "Unknown"}',
                    'timestamp': job.updated_at.isoformat(),
                    'icon': 'CheckCircle',
                    'color': 'text-success'
                })
            elif job.status == 'In Progress':
                activities.append({
                    'id': f'job_started_{job.id}',
                    'type': 'job_started',
                    'message': f'Job #{job.id} started by {job.assigned_technician.username if job.assigned_technician else "Unknown"}',
                    'timestamp': job.updated_at.isoformat(),
                    'icon': 'Play',
                    'color': 'text-primary'
                })
            elif job.assigned_technician:
                activities.append({
                    'id': f'job_assigned_{job.id}',
                    'type': 'job_assigned',
                    'message': f'Job #{job.id} assigned to {job.assigned_technician.username}',
                    'timestamp': job.updated_at.isoformat(),
                    'icon': 'UserCheck',
                    'color': 'text-accent'
                })
        
        # Sort by timestamp and return latest 20
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return Response(activities[:20])
        
    except Exception as e:
        return Response({'message': 'Error fetching recent activity', 'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_system_health(request):
    """Get system health metrics"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from jobs.models import Job
        from inventory.models import Part
        
        # Calculate system metrics
        total_jobs = Job.objects.count()
        completed_jobs = Job.objects.filter(status='completed').count()
        completion_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
        
        # Technician utilization
        active_technicians = User.objects.filter(role='technician', is_active=True).count()
        assigned_jobs = Job.objects.filter(assigned_technician__isnull=False, status__in=['in_progress', 'pending']).count()
        technician_utilization = (assigned_jobs / active_technicians * 100) if active_technicians > 0 else 0
        
        # Parts availability
        total_parts = Part.objects.count()
        available_parts = Part.objects.filter(current_stock__gt=0).count()
        parts_availability = (available_parts / total_parts * 100) if total_parts > 0 else 0
        
        # System uptime (simplified - in production you'd track actual uptime)
        uptime = "99.9%"
        
        # Active connections (simplified)
        active_connections = User.objects.filter(last_login__isnull=False).count()
        
        return Response({
            'status': 'healthy',
            'uptime': uptime,
            'lastBackup': timezone.now().isoformat(),
            'activeConnections': active_connections,
            'jobCompletionRate': round(completion_rate, 1),
            'technicianUtilization': round(technician_utilization, 1),
            'customerSatisfaction': 96.0,  # This would come from customer feedback system
            'partsAvailability': round(parts_availability, 1)
        })
    except Exception as e:
        return Response({'message': 'Error fetching system health', 'error': str(e)}, status=500)

# Dashboard KPI endpoints
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_kpi(request):
    """Get KPI data for dashboard overview cards"""
    try:
        from jobs.models import Job
        from inventory.models import Part, Customer, Supplier
        from sales.models import Sale
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        # Calculate date ranges
        today = timezone.now().date()
        this_month = today.replace(day=1)
        last_month = (this_month - timedelta(days=1)).replace(day=1)
        
        # Jobs KPIs
        total_jobs = Job.objects.count()
        pending_jobs = Job.objects.filter(status='pending').count()
        completed_jobs = Job.objects.filter(status='completed').count()
        in_progress_jobs = Job.objects.filter(status='in_progress').count()
        
        # Monthly job comparison
        this_month_jobs = Job.objects.filter(created_at__date__gte=this_month).count()
        last_month_jobs = Job.objects.filter(
            created_at__date__gte=last_month,
            created_at__date__lt=this_month
        ).count()
        jobs_change = ((this_month_jobs - last_month_jobs) / max(last_month_jobs, 1)) * 100 if last_month_jobs > 0 else 0
        
        # Revenue KPIs
        total_revenue = Job.objects.filter(status='completed').aggregate(
            total=Sum('actual_cost')
        )['total'] or 0
        
        this_month_revenue = Job.objects.filter(
            status='completed',
            completed_at__date__gte=this_month
        ).aggregate(total=Sum('actual_cost'))['total'] or 0
        
        last_month_revenue = Job.objects.filter(
            status='completed',
            completed_at__date__gte=last_month,
            completed_at__date__lt=this_month
        ).aggregate(total=Sum('actual_cost'))['total'] or 0
        
        revenue_change = ((this_month_revenue - last_month_revenue) / max(last_month_revenue, 1)) * 100 if last_month_revenue > 0 else 0
        
        # Sales KPIs
        total_sales = Sale.objects.count()
        sales_revenue = Sale.objects.aggregate(total=Sum('total'))['total'] or 0
        
        this_month_sales = Sale.objects.filter(date__date__gte=this_month).count()
        last_month_sales = Sale.objects.filter(
            date__date__gte=last_month,
            date__date__lt=this_month
        ).count()
        sales_change = ((this_month_sales - last_month_sales) / max(last_month_sales, 1)) * 100 if last_month_sales > 0 else 0
        
        # Inventory KPIs
        total_parts = Part.objects.count()
        from django.db import models as django_models
        low_stock_parts = Part.objects.filter(
            current_stock__lte=django_models.F('minimum_threshold')
        ).count()
        
        # Customer KPIs
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        
        # Technician KPIs
        total_technicians = User.objects.filter(role='technician').count()
        active_technicians = User.objects.filter(role='technician', is_active=True).count()
        
        # Build KPI data array
        kpi_data = [
            {
                'title': 'Total Jobs',
                'value': str(total_jobs),
                'change': f'{abs(jobs_change):.1f}%',
                'changeType': 'increase' if jobs_change >= 0 else 'decrease',
                'icon': 'Briefcase',
                'color': 'primary'
            },
            {
                'title': 'Pending Jobs',
                'value': str(pending_jobs),
                'change': None,
                'changeType': None,
                'icon': 'Clock',
                'color': 'warning'
            },
            {
                'title': 'Completed Jobs',
                'value': str(completed_jobs),
                'change': None,
                'changeType': None,
                'icon': 'CheckCircle',
                'color': 'success'
            },
            {
                'title': 'Active Jobs',
                'value': str(in_progress_jobs),
                'change': None,
                'changeType': None,
                'icon': 'Play',
                'color': 'accent'
            },
            {
                'title': 'Total Revenue',
                'value': f'${total_revenue:,.0f}',
                'change': f'{abs(revenue_change):.1f}%',
                'changeType': 'increase' if revenue_change >= 0 else 'decrease',
                'icon': 'DollarSign',
                'color': 'success'
            },
            {
                'title': 'Total Sales',
                'value': str(total_sales),
                'change': f'{abs(sales_change):.1f}%',
                'changeType': 'increase' if sales_change >= 0 else 'decrease',
                'icon': 'ShoppingCart',
                'color': 'primary'
            },
            {
                'title': 'Sales Revenue',
                'value': f'${sales_revenue:,.0f}',
                'change': None,
                'changeType': None,
                'icon': 'TrendingUp',
                'color': 'success'
            },
            {
                'title': 'Total Parts',
                'value': str(total_parts),
                'change': None,
                'changeType': None,
                'icon': 'Package',
                'color': 'accent'
            },
            {
                'title': 'Low Stock Items',
                'value': str(low_stock_parts),
                'change': None,
                'changeType': None,
                'icon': 'AlertTriangle',
                'color': 'warning'
            },
            {
                'title': 'Total Customers',
                'value': str(total_customers),
                'change': None,
                'changeType': None,
                'icon': 'Users',
                'color': 'primary'
            },
            {
                'title': 'Active Customers',
                'value': str(active_customers),
                'change': None,
                'changeType': None,
                'icon': 'UserCheck',
                'color': 'success'
            },
            {
                'title': 'Total Technicians',
                'value': str(total_technicians),
                'change': None,
                'changeType': None,
                'icon': 'Wrench',
                'color': 'accent'
            }
        ]
        
        return Response(kpi_data)
        
    except Exception as e:
        return Response({'message': 'Error fetching KPI data', 'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_monthly_stats(request):
    """Get monthly statistics for dashboard"""
    try:
        from jobs.models import Job
        from django.db.models import Sum, Avg, Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Calculate current month stats
        today = timezone.now().date()
        this_month = today.replace(day=1)
        
        # Total jobs this month
        total_jobs = Job.objects.filter(created_at__date__gte=this_month).count()
        
        # Monthly revenue from completed jobs
        monthly_revenue = Job.objects.filter(
            status='completed',
            completed_at__date__gte=this_month
        ).aggregate(total=Sum('actual_cost'))['total'] or 0
        
        # Average job duration (in hours)
        avg_duration = Job.objects.filter(
            status='completed',
            actual_hours__isnull=False
        ).aggregate(avg=Avg('actual_hours'))['avg'] or 0
        
        # Format duration
        avg_job_duration = f"{avg_duration:.1f}h" if avg_duration > 0 else "0h"
        
        # On-time completion rate
        completed_jobs = Job.objects.filter(status='completed')
        from django.db import models as django_models
        on_time_jobs = completed_jobs.filter(
            completed_at__date__lte=django_models.F('due_date')
        ).count()
        total_completed = completed_jobs.count()
        on_time_completion = (on_time_jobs / total_completed * 100) if total_completed > 0 else 0
        
        return Response({
            'totalJobs': total_jobs,
            'monthlyRevenue': float(monthly_revenue),
            'avgJobDuration': avg_job_duration,
            'onTimeCompletion': round(on_time_completion, 1)
        })
        
    except Exception as e:
        return Response({'message': 'Error fetching monthly stats', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def active_jobs(request):
    """Return a list of active jobs for admin dashboard (pending/in_progress/on_hold)"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    try:
        from jobs.models import Job

        qs = Job.objects.filter(status__in=['pending', 'in_progress', 'on_hold']).order_by('-created_at')[:50]
        data = []
        for job in qs:
            # Build a minimal payload matching frontend expectations
            customer_name = getattr(job, 'customer_name', None) or (job.customer.name if getattr(job, 'customer', None) else None)
            technician = job.assigned_technician
            services = []
            if getattr(job, 'service_description', None):
                # try to split comma-separated descriptions, otherwise wrap
                try:
                    services = [s.strip() for s in job.service_description.split(',') if s.strip()]
                except Exception:
                    services = [job.service_description]

            data.append({
                'id': job.id,
                'status': job.status,
                'priority': job.priority.lower() if isinstance(job.priority, str) else job.priority,
                'vehicle': f"{getattr(job, 'vehicle_year', '')} {getattr(job, 'vehicle_model', '')}".strip(),
                'customer': customer_name,
                'technician': technician.username if technician else None,
                'technician_id': technician.id if technician else None,
                'services': services,
                'progress': 0,
            })

        return Response(data)
    except Exception as e:
        return Response({'message': 'Error fetching active jobs', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate simple CSV/JSON report based on type and date_range query params.
    Returns CSV as attachment when format=csv, otherwise JSON payload.
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    rtype = request.GET.get('type', 'comprehensive')
    fmt = request.GET.get('format', 'csv')
    date_range = request.GET.get('date_range', 'month')

    try:
        # Use helper to build rows
        rows = build_report_rows(rtype, date_range)

        if fmt == 'csv':
            # create CSV using HttpResponse
            from django.http import HttpResponse
            import csv, io
            output = io.StringIO()
            if rows:
                writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                for r in rows:
                    writer.writerow(r)
            else:
                output.write('No data\n')
            csv_content = output.getvalue()
            filename = f"report_{rtype}_{date_range}_{timezone.now().date().isoformat()}.csv"
            response = HttpResponse(csv_content, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        return Response({'type': rtype, 'date_range': date_range, 'rows': rows})
    except Exception as e:
        return Response({'message': 'Failed to generate report', 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def email_report(request):
    """Generate a report and email it as CSV attachment to recipients.
    Expects JSON body: { type, date_range, format, recipients: 'a@b.com,b@c.com', subject, message }
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    rtype = data.get('type', 'comprehensive')
    date_range = data.get('date_range', 'month')
    recipients = data.get('recipients', '')
    subject = data.get('subject', f'Report: {rtype}')
    body = data.get('message', 'Please find the attached report.')


    # Build CSV from helper
    try:
        rows = build_report_rows(rtype, date_range)
        import csv, io
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
        else:
            output.write('No data\n')
        csv_bytes = output.getvalue()
    except Exception as e:
        return Response({'message': 'Failed to build report for email', 'error': str(e)}, status=500)

    # send email with attachment
    to_list = [e.strip() for e in recipients.split(',') if e.strip()]
    if not to_list:
        return Response({'message': 'No recipients provided'}, status=400)

    try:
        from django.core.mail import EmailMessage
        email = EmailMessage(subject, body, getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER), to_list)
        email.attach(f'report_{rtype}.csv', csv_bytes, 'text/csv')
        email.send(fail_silently=False)
        return Response({'message': 'Report emailed', 'recipients': to_list})
    except Exception as e:
        return Response({'message': 'Failed to send email', 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def whatsapp_share(request):
    """Return a WhatsApp share URL for a brief report summary or downloadable report link.
    Expects { type, date_range, summary_only (bool) }
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    rtype = request.data.get('type', 'comprehensive')
    date_range = request.data.get('date_range', 'month')
    summary_only = bool(request.data.get('summary_only', True))

    try:
        # Build a short summary string
        summary = f"Report: {rtype} | Range: {date_range}"
        import urllib.parse
        if summary_only:
            text = summary + "\nView full report in the dashboard."
            url = f"https://api.whatsapp.com/send?text={urllib.parse.quote_plus(text)}"
            return Response({'whatsapp_url': url})
        else:
            text = summary + "\nPlease download the CSV from the dashboard and share." 
            url = f"https://api.whatsapp.com/send?text={urllib.parse.quote_plus(text)}"
            return Response({'whatsapp_url': url})
    except Exception as e:
        return Response({'message': 'Failed to build whatsapp link', 'error': str(e)}, status=500)


# Helper to build report rows used by multiple endpoints
def build_report_rows(rtype, date_range):
    from jobs.models import Job, JobPart
    from django.utils import timezone
    now = timezone.now().date()
    if date_range == 'today':
        start = now
    elif date_range == 'week':
        start = now - timezone.timedelta(days=now.weekday())
    elif date_range == 'quarter':
        month = (now.month - 1) // 3 * 3 + 1
        start = now.replace(month=month, day=1)
    elif date_range == 'year':
        start = now.replace(month=1, day=1)
    else:
        start = now.replace(day=1)

    jobs = Job.objects.filter(created_at__date__gte=start).order_by('-created_at')
    rows = []
    if rtype in ['revenue', 'comprehensive']:
        from django.db.models import Sum
        for j in jobs:
            parts_cost = JobPart.objects.filter(job=j).aggregate(total=Sum('total_cost'))['total'] or 0
            rows.append({
                'job_id': j.id,
                'customer': getattr(j, 'customer_name', '') or (j.customer.name if getattr(j, 'customer', None) else ''),
                'vehicle': f"{getattr(j,'vehicle_year','')} {getattr(j,'vehicle_model','')}".strip(),
                'status': j.status,
                'created_at': j.created_at.isoformat(),
                'estimated_cost': float(j.estimated_cost or 0),
                'actual_cost': float(j.actual_cost or 0),
                'parts_cost': float(parts_cost or 0)
            })
    elif rtype in ['technicians', 'performance']:
        techs = {}
        for j in jobs:
            tech = j.assigned_technician
            key = tech.username if tech else 'unassigned'
            rec = techs.setdefault(key, {'technician': key, 'jobs': 0, 'completed': 0})
            rec['jobs'] += 1
            if j.status == 'completed':
                rec['completed'] += 1
        rows = list(techs.values())
    else:
        for j in jobs:
            rows.append({'job_id': j.id, 'status': j.status, 'created_at': j.created_at.isoformat()})
    return rows


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def monthly_revenue(request):
    """Return monthly aggregated revenue totals for charts.
    Query params: date_range (today|week|month|quarter|year), department_id (optional filter)
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    date_range = request.GET.get('date_range', 'month')
    department_id = request.GET.get('department_id')
    
    try:
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        from django.utils import timezone
        from jobs.models import Job, TechnicianProfile

        now = timezone.now().date()
        if date_range == 'today':
            start = now
        elif date_range == 'week':
            start = now - timezone.timedelta(days=now.weekday())
        elif date_range == 'quarter':
            month = (now.month - 1) // 3 * 3 + 1
            start = now.replace(month=month, day=1)
        elif date_range == 'year':
            start = now.replace(month=1, day=1)
        else:
            start = now.replace(day=1)

        qs = Job.objects.filter(created_at__date__gte=start)
        
        # Filter by department if provided
        if department_id and department_id != 'all':
            try:
                department = Department.objects.get(id=department_id)
                # Get technicians in this department
                dept_technicians = TechnicianProfile.objects.filter(department=department).values_list('user', flat=True)
                qs = qs.filter(assigned_technician__in=dept_technicians)
            except Department.DoesNotExist:
                return Response({'message': 'Department not found'}, status=404)

        # group by month
        agg = qs.annotate(month=TruncMonth('created_at')).values('month').annotate(
            total_actual=Sum('actual_cost'),
            total_estimated=Sum('estimated_cost'),
            total_parts=Sum('parts_used__total_cost')
        ).order_by('month')

        data = []
        for row in agg:
            month = row.get('month')
            total_actual = float(row.get('total_actual') or 0)
            total_parts = float(row.get('total_parts') or 0)
            total_estimated = float(row.get('total_estimated') or 0)
            data.append({
                'month': month.isoformat() if month else None,
                'total_revenue': round(total_actual + total_parts, 2),
                'total_actual': round(total_actual, 2),
                'total_parts': round(total_parts, 2),
                'total_estimated': round(total_estimated, 2)
            })

        return Response({'date_range': date_range, 'data': data})
    except Exception as e:
        return Response({'message': 'Failed to compute monthly revenue', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_metrics(request):
    """Return per-technician aggregated metrics for charts.
    Query params: date_range (today|week|month|quarter|year), technician_id (optional filter), department_id (optional filter)
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    date_range = request.GET.get('date_range', 'month')
    technician_id = request.GET.get('technician_id')
    department_id = request.GET.get('department_id')
    
    try:
        from django.db.models import Count, Avg, Sum
        from django.utils import timezone
        from jobs.models import Job, JobPart, TechnicianProfile

        now = timezone.now().date()
        if date_range == 'today':
            start = now
        elif date_range == 'week':
            start = now - timezone.timedelta(days=now.weekday())
        elif date_range == 'quarter':
            month = (now.month - 1) // 3 * 3 + 1
            start = now.replace(month=month, day=1)
        elif date_range == 'year':
            start = now.replace(month=1, day=1)
        else:
            start = now.replace(day=1)

        # jobs in range
        jobs_qs = Job.objects.filter(created_at__date__gte=start)

        # Filter by department if provided
        if department_id and department_id != 'all':
            try:
                department = Department.objects.get(id=department_id)
                # Get technicians in this department
                dept_technicians = TechnicianProfile.objects.filter(department=department).values_list('user', flat=True)
                jobs_qs = jobs_qs.filter(assigned_technician__in=dept_technicians)
                technicians = User.objects.filter(id__in=dept_technicians, role='technician')
            except Department.DoesNotExist:
                return Response({'message': 'Department not found'}, status=404)
        else:
            technicians = User.objects.filter(role='technician')

        # Filter by specific technician if provided
        if technician_id and technician_id != 'all':
            try:
                technician = User.objects.get(id=technician_id, role='technician')
                jobs_qs = jobs_qs.filter(assigned_technician=technician)
                technicians = [technician]
            except User.DoesNotExist:
                return Response({'message': 'Technician not found'}, status=404)

        # aggregate per technician
        metrics = []
        for tech in technicians:
            tech_jobs = jobs_qs.filter(assigned_technician=tech)
            total_assigned = tech_jobs.count()
            completed = tech_jobs.filter(status='completed').count()
            avg_actual_hours = tech_jobs.aggregate(avg_hours=Avg('actual_hours'))['avg_hours'] or 0
            
            # Calculate total costs
            total_actual_cost = tech_jobs.aggregate(total=Sum('actual_cost'))['total'] or 0
            total_estimated_cost = tech_jobs.aggregate(total=Sum('estimated_cost'))['total'] or 0
            
            # Calculate parts costs
            parts_cost = 0
            for job in tech_jobs:
                job_parts_cost = JobPart.objects.filter(job=job).aggregate(total=Sum('total_cost'))['total'] or 0
                parts_cost += job_parts_cost
            
            total_revenue = float(total_actual_cost) + float(parts_cost)
            
            efficiency = round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0
            
            # Get recent jobs for this technician
            recent_jobs = tech_jobs.order_by('-created_at')[:5].values(
                'id', 'customer_name', 'vehicle_model', 'vehicle_plate', 
                'service_description', 'status', 'actual_cost', 'estimated_cost',
                'created_at', 'completed_at'
            )
            
            # Add parts cost to each job
            for job in recent_jobs:
                job_parts = JobPart.objects.filter(job_id=job['id']).aggregate(total=Sum('total_cost'))['total'] or 0
                job['parts_cost'] = float(job_parts)
                job['total_cost'] = float(job['actual_cost'] or 0) + float(job_parts)
            
            metrics.append({
                'technician_id': tech.id,
                'technician': tech.username,
                'email': tech.email,
                'total_assigned': total_assigned,
                'completed': completed,
                'avg_actual_hours': float(avg_actual_hours) if avg_actual_hours else 0,
                'efficiency_percent': efficiency,
                'total_actual_cost': float(total_actual_cost),
                'total_estimated_cost': float(total_estimated_cost),
                'total_parts_cost': float(parts_cost),
                'total_revenue': total_revenue,
                'recent_jobs': list(recent_jobs)
            })

        # sort by efficiency desc
        metrics = sorted(metrics, key=lambda x: x['efficiency_percent'], reverse=True)
        return Response({'date_range': date_range, 'data': metrics})
    except Exception as e:
        return Response({'message': 'Failed to compute technician metrics', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def technician_jobs_detail(request, technician_id):
    """Get detailed job information for a specific technician.
    Query params: date_range (today|week|month|quarter|year), status (optional filter)
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    date_range = request.GET.get('date_range', 'month')
    status_filter = request.GET.get('status')
    
    try:
        from django.db.models import Sum
        from django.utils import timezone
        from jobs.models import Job, JobPart

        # Verify technician exists
        try:
            technician = User.objects.get(id=technician_id, role='technician')
        except User.DoesNotExist:
            return Response({'message': 'Technician not found'}, status=404)

        now = timezone.now().date()
        if date_range == 'today':
            start = now
        elif date_range == 'week':
            start = now - timezone.timedelta(days=now.weekday())
        elif date_range == 'quarter':
            month = (now.month - 1) // 3 * 3 + 1
            start = now.replace(month=month, day=1)
        elif date_range == 'year':
            start = now.replace(month=1, day=1)
        else:
            start = now.replace(day=1)

        # Get technician's jobs
        jobs_qs = Job.objects.filter(
            assigned_technician=technician,
            created_at__date__gte=start
        ).order_by('-created_at')

        if status_filter:
            jobs_qs = jobs_qs.filter(status=status_filter)

        jobs_data = []
        for job in jobs_qs:
            # Calculate parts cost for this job
            parts_cost = JobPart.objects.filter(job=job).aggregate(total=Sum('total_cost'))['total'] or 0
            
            jobs_data.append({
                'id': job.id,
                'customer_name': job.customer_name or (job.customer.name if job.customer else 'N/A'),
                'vehicle_model': job.vehicle_model,
                'vehicle_plate': job.vehicle_plate,
                'service_description': job.service_description,
                'status': job.status,
                'priority': job.priority,
                'estimated_cost': float(job.estimated_cost or 0),
                'actual_cost': float(job.actual_cost or 0),
                'parts_cost': float(parts_cost),
                'total_cost': float(job.actual_cost or 0) + float(parts_cost),
                'estimated_hours': float(job.estimated_hours or 0),
                'actual_hours': float(job.actual_hours or 0),
                'created_at': job.created_at.isoformat(),
                'due_date': job.due_date.isoformat() if job.due_date else None,
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
                'notes': job.notes
            })

        # Calculate summary statistics
        total_jobs = len(jobs_data)
        completed_jobs = len([j for j in jobs_data if j['status'] == 'completed'])
        total_revenue = sum(j['total_cost'] for j in jobs_data)
        total_estimated = sum(j['estimated_cost'] for j in jobs_data)
        total_parts = sum(j['parts_cost'] for j in jobs_data)
        
        efficiency = round((completed_jobs / total_jobs * 100), 1) if total_jobs > 0 else 0

        return Response({
            'technician': {
                'id': technician.id,
                'name': technician.username,
                'email': technician.email
            },
            'date_range': date_range,
            'summary': {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'efficiency_percent': efficiency,
                'total_revenue': round(total_revenue, 2),
                'total_estimated_cost': round(total_estimated, 2),
                'total_parts_cost': round(total_parts, 2)
            },
            'jobs': jobs_data
        })
    except Exception as e:
        return Response({'message': 'Failed to fetch technician job details', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def service_trends(request):
    """Return service distribution and monthly trends.
    Query params: date_range (today|week|month|quarter|year), service_type (optional filter), department_id (optional filter)
    """
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    date_range = request.GET.get('date_range', 'month')
    service_type = request.GET.get('service_type')
    department_id = request.GET.get('department_id')
    
    try:
        from django.utils import timezone
        from jobs.models import Job, TechnicianProfile

        now = timezone.now().date()
        if date_range == 'today':
            start = now
        elif date_range == 'week':
            start = now - timezone.timedelta(days=now.weekday())
        elif date_range == 'quarter':
            month = (now.month - 1) // 3 * 3 + 1
            start = now.replace(month=month, day=1)
        elif date_range == 'year':
            start = now.replace(month=1, day=1)
        else:
            start = now.replace(day=1)

        qs = Job.objects.filter(created_at__date__gte=start).order_by('created_at')

        # Filter by department if provided
        if department_id and department_id != 'all':
            try:
                department = Department.objects.get(id=department_id)
                # Get technicians in this department
                dept_technicians = TechnicianProfile.objects.filter(department=department).values_list('user', flat=True)
                qs = qs.filter(assigned_technician__in=dept_technicians)
            except Department.DoesNotExist:
                return Response({'message': 'Department not found'}, status=404)

        # Filter by service type if provided
        if service_type and service_type != 'all':
            # Map frontend service types to database service descriptions
            service_mapping = {
                'oil-change': 'oil',
                'brake-service': 'brake',
                'tire-service': 'tire',
                'engine-repair': 'engine',
                'transmission': 'transmission',
                'electrical': 'electrical'
            }
            
            filter_keyword = service_mapping.get(service_type, service_type)
            qs = qs.filter(service_description__icontains=filter_keyword)

        # Build distribution and monthly trends
        service_map = {}
        monthly_map = {}

        from django.db.models import Sum
        from jobs.models import JobPart
        for j in qs:
            svc_text = (j.service_description or '').strip()
            services = [s.strip() for s in svc_text.split(',') if s.strip()]
            key = services[0] if services else 'Other'

            # accumulate distribution
            rec = service_map.setdefault(key, {'name': key, 'value': 0, 'revenue': 0.0, 'jobs': 0})
            # parts cost for job
            parts_sum = JobPart.objects.filter(job=j).aggregate(total=Sum('total_cost'))['total'] or 0
            rec['value'] += 1
            rec['revenue'] += float((j.actual_cost or 0) + (parts_sum or 0))
            rec['jobs'] += 1

            # monthly aggregation (normalize to month start iso)
            try:
                mstart = j.created_at.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                mlabel = mstart.isoformat()
            except Exception:
                mlabel = None
            if mlabel:
                mrec = monthly_map.setdefault(mlabel, {'month': mlabel, 'categories': {}})
                mrec['categories'][key] = mrec['categories'].get(key, 0) + 1

        # Convert to lists and add colors
        colors = ['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4']
        distribution = []
        for i, (k, v) in enumerate(sorted(service_map.items(), key=lambda x: x[1]['value'], reverse=True)):
            v['color'] = colors[i % len(colors)]
            v['revenue'] = round(v['revenue'], 2)
            distribution.append(v)

        monthly = []
        for k in sorted(monthly_map.keys()):
            item = monthly_map[k]
            monthly.append(item)

        return Response({'date_range': date_range, 'distribution': distribution, 'monthly': monthly})
    except Exception as e:
        return Response({'message': 'Failed to compute service trends', 'error': str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_technician_progress(request):
    """Get detailed technician progress data"""
    if request.user.role not in ['admin', 'supervisor']:
        return Response({'message': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from jobs.models import Job, JobProgress
        from django.db.models import Count, Avg, Q
        from datetime import datetime, timedelta
        
        # Get all technicians
        technicians = User.objects.filter(role='technician').order_by('username')
        technician_data = []
        
        for tech in technicians:
            # Get current jobs for this technician
            current_jobs = Job.objects.filter(
                assigned_technician=tech,
                status__in=['pending', 'in_progress']
            ).order_by('-created_at')
            
            # Get completed jobs today
            today = timezone.now().date()
            completed_today = Job.objects.filter(
                assigned_technician=tech,
                status='completed',
                completed_at__date=today
            ).count()
            
            # Get total assigned jobs
            total_assigned = Job.objects.filter(assigned_technician=tech).count()
            
            # Calculate enhanced efficiency score based on time and inventory usage
            completed_jobs = Job.objects.filter(
                assigned_technician=tech,
                status='completed'
            )
            
            # Calculate enhanced efficiency score and breakdown
            efficiency_score = calculate_technician_efficiency(tech)
            
            # Get detailed efficiency breakdown for display
            completed_jobs = Job.objects.filter(
                assigned_technician=tech,
                status='completed'
            )
            
            efficiency_breakdown = {
                'time_efficiency': 0,
                'delivery_efficiency': 0,
                'inventory_efficiency': 0,
                'overall_efficiency': efficiency_score
            }
            
            if completed_jobs.exists():
                from jobs.models import JobPart
                from django.db.models import Sum, F
                
                total_count = completed_jobs.count()
                
                # Time efficiency
                time_efficient = completed_jobs.filter(
                    actual_hours__lte=F('estimated_hours')
                ).count()
                efficiency_breakdown['time_efficiency'] = round((time_efficient / total_count) * 100)
                
                # Delivery efficiency
                on_time = completed_jobs.filter(
                    completed_at__date__lte=F('due_date')
                ).count()
                efficiency_breakdown['delivery_efficiency'] = round((on_time / total_count) * 100)
                
                # Inventory efficiency
                inventory_efficient = 0
                for job in completed_jobs:
                    parts_used = JobPart.objects.filter(job=job)
                    if parts_used.exists():
                        actual_cost = parts_used.aggregate(Sum('total_cost'))['total_cost__sum'] or 0
                        if job.estimated_cost > 0:
                            variance = abs(actual_cost - job.estimated_cost) / job.estimated_cost
                            if variance <= 0.1:
                                inventory_efficient += 1
                        elif actual_cost == 0:
                            inventory_efficient += 1
                    else:
                        if job.estimated_cost <= 50:
                            inventory_efficient += 1
                
                efficiency_breakdown['inventory_efficiency'] = round((inventory_efficient / total_count) * 100)
            
            # Format current jobs data
            current_jobs_data = []
            for job in current_jobs[:5]:  # Limit to 5 most recent
                # Get latest progress for this job
                latest_progress = JobProgress.objects.filter(
                    job=job,
                    technician=tech
                ).order_by('-created_at').first()
                
                progress_percentage = latest_progress.progress_percentage if latest_progress else 0
                
                current_jobs_data.append({
                    'id': f'JOB-{job.id:04d}',
                    'customer_name': job.customer_name or (job.customer.name if job.customer else 'Unknown'),
                    'vehicle_info': f"{job.vehicle_year} {job.vehicle_model}",
                    'status': job.status.replace('_', ' ').title(),
                    'progress_percentage': progress_percentage,
                    'started_at': job.started_at.isoformat() if job.started_at else None,
                    'estimated_completion': job.due_date.isoformat() if job.due_date else None
                })
            
            technician_data.append({
                'id': tech.id,
                'username': tech.username,
                'email': tech.email,
                'is_active': tech.is_active,
                'current_jobs': current_jobs_data,
                'completed_today': completed_today,
                'total_assigned': total_assigned,
                'efficiency_score': round(efficiency_score),
                'efficiency_breakdown': efficiency_breakdown,
                'last_activity': tech.last_login.isoformat() if tech.last_login else None
            })
        
        return Response(technician_data)
        
    except Exception as e:
        return Response({'message': 'Error fetching technician progress', 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def departments_list(request):
    """Get list of all departments"""
    try:
        departments = Department.objects.all().values('id', 'name', 'description')
        return Response(list(departments))
    except Exception as e:
        return Response({'message': 'Error fetching departments', 'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    API health check endpoint.
    This endpoint is used by monitoring scripts to verify that the API is running.
    """
    try:
        # Basic system info
        system_info = {
            "hostname": platform.node(),
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "django_version": django.__version__
        }

        # Check database connectivity
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_check = cursor.fetchone()[0] == 1

        # Check if we can access models
        department_count = Department.objects.count()
        
        return Response({
            "status": "ok",
            "timestamp": timezone.now().isoformat(),
            "database": "connected" if db_check else "error",
            "system_info": system_info,
            "app_checks": {
                "departments_available": department_count > 0
            }
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e),
            "timestamp": timezone.now().isoformat()
        }, status=500)

# inventory endpoints moved to the inventory app
