import os
from django.conf import settings
from django.views.generic import TemplateView
from django.http import Http404
from django.template.loader import get_template
from django.template import TemplateDoesNotExist


class SmartFrontendView(TemplateView):
    """
    A smart frontend view that tries multiple template and static file configurations
    as fallbacks to ensure the frontend loads even if some static files are missing.
    """
    
    def get_template_names(self):
        """
        Return a list of template names to try in order of preference:
        1. index.html (from backend/static/frontend or backend/templates)
        2. index-build-fallback.html (uses build directory assets)
        """
        templates_to_try = [
            'index.html',
            'index-build-fallback.html',
        ]
        
        # Test which templates actually exist and can be loaded
        available_templates = []
        for template_name in templates_to_try:
            try:
                get_template(template_name)
                available_templates.append(template_name)
            except TemplateDoesNotExist:
                continue
        
        if not available_templates:
            # If no templates are found, still return the default to get a proper error
            return ['index.html']
            
        return available_templates
    
    def get_context_data(self, **kwargs):
        """
        Add context about which static file directories are available
        """
        context = super().get_context_data(**kwargs)
        
        # Check which static directories exist
        frontend_dir = os.path.join(settings.BASE_DIR, 'static', 'frontend')
        build_dir = os.path.join(settings.BASE_DIR.parent, 'build')
        
        context.update({
            'frontend_static_available': os.path.exists(frontend_dir),
            'build_static_available': os.path.exists(build_dir),
            'debug': settings.DEBUG,
        })
        
        return context
