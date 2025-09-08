from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from api.frontend_views import SmartFrontendView
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('api.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/jobs/', include('jobs.urls')),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve frontend static files and handle React routing
frontend_dir = os.path.join(settings.BASE_DIR, 'static', 'frontend')
build_dir = os.path.join(settings.BASE_DIR.parent, 'build')

# Serve static assets from frontend folder (primary)
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(frontend_dir, 'assets')}),
]

# Serve static assets from build folder (fallback)
if os.path.exists(build_dir):
    urlpatterns += [
        re_path(r'^build-assets/(?P<path>.*)$', serve, {'document_root': os.path.join(build_dir, 'assets')}),
        re_path(r'^favicon\.ico$', serve, {'document_root': build_dir, 'path': 'favicon.ico'}),
        re_path(r'^manifest\.json$', serve, {'document_root': build_dir, 'path': 'manifest.json'}),
        re_path(r'^robots\.txt$', serve, {'document_root': build_dir, 'path': 'robots.txt'}),
    ]

# Catch-all pattern for React Router (must be last)
urlpatterns += [
    re_path(r'^(?!api/).*$', SmartFrontendView.as_view(), name='frontend'),
]
