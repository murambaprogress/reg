import os
from pathlib import Path
# load local .env if present
import load_env  # loads environment variables from backend/.env if present

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'change-me')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'progress.pythonanywhere.com',
    '*'  # Remove this in production
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
    'inventory',
    'customers',
    'suppliers',
    'sales',
    'jobs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'api.middleware.CSRFExemptMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Exempt API endpoints from CSRF validation
CSRF_EXEMPT_URLS = [
    r'^/api/',
]

ROOT_URLCONF = 'backend_project.urls'

# Frontend template directory
FRONTEND_DIR = os.path.join(BASE_DIR, 'static', 'frontend')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            FRONTEND_DIR,
            os.path.join(BASE_DIR, 'templates'),  # Add fallback template directory
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_project.wsgi.application'

# Database (MySQL via PythonAnywhere)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'Progress$regimark_motors'),
        'USER': os.environ.get('DB_USER', 'Progress'),
        'PASSWORD': os.environ.get('DB_PASS', 'prog003done'),
        'HOST': os.environ.get('DB_HOST', 'Progress.mysql.pythonanywhere-services.com'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

AUTH_USER_MODEL = 'api.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Frontend static files (built React app)
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS - Allow all origins in development for easier testing
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_ALL_HEADERS = True
    CORS_ALLOW_ALL_METHODS = True
    # Disable CSRF for development
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        'https://progress.pythonanywhere.com',
        'http://progress.pythonanywhere.com',
    ]
    CORS_ALLOW_CREDENTIALS = True

CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']

# REST Framework and JWT settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# JWT legacy settings (for backward compatibility)
JWT_SECRET = SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 86400  # 24 hours


# Email (Gmail SMTP - system email)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('SYSTEM_EMAIL', '')
EMAIL_HOST_PASSWORD = os.environ.get('SYSTEM_EMAIL_PASS', '')

# Default from address (avoid webmaster@localhost)
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Enable 2FA testing mode: when ENABLE_2FA is '1' (default), use console backend so OTPs print to the server console.
# Set ENABLE_2FA=0 in your .env to use real SMTP (requires SYSTEM_EMAIL and SYSTEM_EMAIL_PASS / app password).
ENABLE_2FA = os.environ.get('ENABLE_2FA', '1') == '1'
if ENABLE_2FA:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-this-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 86400

# Supervisor hardcoded credentials
SUPERVISOR_EMAIL = os.environ.get('SUPERVISOR_EMAIL', 'murambaprogress@gmail.com')
SUPERVISOR_USERNAME = os.environ.get('SUPERVISOR_USERNAME', 'supervisor')
SUPERVISOR_PASSWORD = os.environ.get('SUPERVISOR_PASSWORD', 'supervisor123')
# Admin hardcoded credentials
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'murambaprogress@gmail.com')
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
