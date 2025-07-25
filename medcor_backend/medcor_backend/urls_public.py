"""
Public tenant URL configuration for medcor_backend project.
This file handles URLs for the public schema (non-tenant specific).
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_view(request):
    """Root view for public schema"""
    return JsonResponse({
        'message': 'MedCor Django Backend - Public Schema',
        'admin_url': '/admin/',
        'api_url': '/api/',
        'status': 'running'
    })

urlpatterns = [
    # Root endpoint
    path('', root_view, name='root'),
    
    # Admin interface - accessible on public schema
    path('admin/', admin.site.urls),
    
    # Public API endpoints
    path('api/', include('api.urls')),
    
    # Health check endpoint
    path('health/', lambda request: JsonResponse({'status': 'ok', 'schema': 'public'})),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)