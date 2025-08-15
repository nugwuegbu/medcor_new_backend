"""
Public tenant URL configuration for medcor_backend project.
This file handles URLs for the public schema (non-tenant specific).
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def root_view(request):
    """Root view for public schema"""
    return JsonResponse({
        'message': 'MedCor Django Backend - Public Schema',
        'admin_url': '/admin/',
        'api_url': '/api/',
        'documentation': {
            'swagger_ui': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/'
        },
        'endpoints': {
            'tenants': '/api/tenants/',
            'subscriptions': '/api/subscription/',
            'appointments': '/api/appointments/',
            'treatments': '/api/treatments/',
            'analysis_tracking': '/api/track-analysis',
            'analysis_stats': '/api/analysis-tracking-stats'
        },
        'status': 'running'
    })

urlpatterns = [
    # Root endpoint
    path('', root_view, name='root'),
    
    # Admin interface - accessible on public schema
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='api-docs'),
    
    # Public API endpoints
    path('api/', include('api.urls')),
    
    # Main API Endpoints (for public access)
    path('api/tenants/', include('tenants.urls')),
    path('api/subscription/', include('subscription_plan.urls')),
    path('api/appointments/', include('appointment.urls')),
    path('api/treatments/', include('treatment.urls')),
    path('api/', include('medical_records.urls')),  # Medical records management
    
    # Authentication endpoints
    path('api/auth/', include('user_auth.urls')),
    
    # Health check endpoint
    path('health/', lambda request: JsonResponse({'status': 'ok', 'schema': 'public'})),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)