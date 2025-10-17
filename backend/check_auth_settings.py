"""
Utility script to check authentication and CSRF settings

To run this script, execute:
python manage.py shell < check_auth_settings.py
"""

from django.conf import settings
import sys

def check_settings():
    print("\n=== Authentication and CSRF Settings Check ===\n")
    
    # Check CSRF settings
    print("CSRF Settings:")
    print(f"  CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', False)}")
    print(f"  CSRF_USE_SESSIONS: {getattr(settings, 'CSRF_USE_SESSIONS', False)}")
    print(f"  CSRF_COOKIE_HTTPONLY: {getattr(settings, 'CSRF_COOKIE_HTTPONLY', False)}")
    
    # Check CSRF trusted origins
    print("\nCSRF Trusted Origins:")
    csrf_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    if csrf_origins:
        for origin in csrf_origins:
            print(f"  - {origin}")
    else:
        print("  None configured")
    
    # Check CSRF exempt URLs
    print("\nCSRF Exempt URLs:")
    csrf_exempt = getattr(settings, 'CSRF_EXEMPT_URLS', [])
    if csrf_exempt:
        for url in csrf_exempt:
            print(f"  - {url}")
    else:
        print("  None configured")
    
    # Check DRF authentication classes
    print("\nDRF Authentication Classes:")
    if hasattr(settings, 'REST_FRAMEWORK'):
        auth_classes = settings.REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', [])
        if auth_classes:
            for cls in auth_classes:
                print(f"  - {cls}")
        else:
            print("  None configured")
    else:
        print("  REST_FRAMEWORK not configured")
    
    # Check DRF permission classes
    print("\nDRF Permission Classes:")
    if hasattr(settings, 'REST_FRAMEWORK'):
        perm_classes = settings.REST_FRAMEWORK.get('DEFAULT_PERMISSION_CLASSES', [])
        if perm_classes:
            for cls in perm_classes:
                print(f"  - {cls}")
        else:
            print("  None configured")
    else:
        print("  REST_FRAMEWORK not configured")
    
    # Check CORS settings
    print("\nCORS Settings:")
    print(f"  CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)}")
    print(f"  CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', False)}")
    
    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    if cors_origins:
        print("\nCORS Allowed Origins:")
        for origin in cors_origins:
            print(f"  - {origin}")
    
    print("\nMiddleware:")
    for middleware in settings.MIDDLEWARE:
        print(f"  - {middleware}")
    
    print("\n=== Check Complete ===\n")

# Run the check
check_settings()