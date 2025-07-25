"""
Simple URL configuration for direct admin access (without django-tenants)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_view(request):
    """Root view for direct admin access"""
    return JsonResponse({
        'message': 'MedCor Django Direct Admin',
        'admin_url': '/admin/',
        'status': 'running',
        'mode': 'direct_access'
    })

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'mode': 'direct_admin',
        'admin_available': True
    })

urlpatterns = [
    # Root endpoint
    path('', root_view, name='root'),
    
    # Admin interface - direct access
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', health_check, name='health'),
    
    # API endpoints (treatment temporarily disabled)
    # path('api/treatments/', include('treatment.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)