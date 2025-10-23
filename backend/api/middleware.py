import re
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware to exempt certain URLs from CSRF validation
    """
    def process_request(self, request):
        # Exempt all API endpoints that use JWT authentication
        # This includes both /api/* routes and direct routes (for Vite proxy)
        exempt_prefixes = [
            '/api/',
            '/auth/',
            '/suppliers/',
            '/customers/',
            '/inventory/',
            '/jobs/',
            '/sales/',
            '/billing/',
        ]
        
        for prefix in exempt_prefixes:
            if request.path_info.startswith(prefix):
                setattr(request, '_dont_enforce_csrf_checks', True)
                return None
            
        # Also check configured patterns
        if hasattr(settings, 'CSRF_EXEMPT_URLS'):
            for pattern in settings.CSRF_EXEMPT_URLS:
                if re.match(pattern, request.path_info):
                    setattr(request, '_dont_enforce_csrf_checks', True)
                    break
        return None
