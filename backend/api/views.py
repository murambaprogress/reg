import os
import jwt
import datetime
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from .models import OTP
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import RegisterSerializer, LoginSerializer, OTPSerializer, UserSerializer
import logging

User = get_user_model()


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
    # admin hardcoded flow
    if username == settings.ADMIN_USERNAME:
        if password != settings.ADMIN_PASSWORD:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        otp_code = generate_otp()
        create_and_log_otp(settings.ADMIN_EMAIL, otp_code)
        ok, err = send_otp_email(settings.ADMIN_EMAIL, otp_code, subject='Admin Login OTP')
        if not ok:
            return Response({'message': 'Failed to send OTP to admin', 'error': err}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'OTP sent to admin email', 'otpRequired': True})
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
@require_admin
@api_view(['POST'])
def create_technician(request):
    if request.method != 'POST':
        return Response({'message': 'Only POST'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
        return Response({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
    tech = User.objects.create_user(username=username, email=email, password=password, role='technician', verified=True)
    return Response({'message': 'Technician created', 'id': tech.id})



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
        
        # Get technician stats
        technicians = User.objects.filter(role='technician')
        total_technicians = technicians.count()
        active_technicians = technicians.filter(is_active=True).count()
        
        # Get job stats
        jobs = Job.objects.all()
        total_jobs = jobs.count()
        pending_jobs = jobs.filter(status='Pending').count()
        completed_jobs = jobs.filter(status='Completed', updated_at__date=timezone.now().date()).count()
        
        return Response({
            'totalTechnicians': total_technicians,
            'activeTechnicians': active_technicians,
            'pendingJobs': pending_jobs,
            'completedJobs': completed_jobs,
            'totalJobs': total_jobs
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

# inventory endpoints moved to the inventory app
