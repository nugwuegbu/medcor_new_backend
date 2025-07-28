"""
URL configuration for tenant schemas in medcor_backend project.
This configuration is used for all tenant subdomains (e.g., medcorhospital.domain.com)
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def tenant_root_view(request):
    """Root view for tenant schemas"""
    tenant = getattr(request, 'tenant', None)
    schema_name = tenant.schema_name if tenant else 'unknown'
    tenant_name = tenant.name if tenant else 'Unknown Tenant'
    
    return JsonResponse({
        'message': f'MedCor Django Backend - {tenant_name}',
        'tenant': tenant_name,
        'schema': schema_name,
        'admin_url': '/admin/',
        'api_url': '/api/',
        'documentation': {
            'swagger_ui': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/'
        },
        'tenant_endpoints': {
            'appointments': '/api/appointments/',
            'treatments': '/api/treatments/',
            'medical': '/api/medical/',
            'auth': '/api/auth/'
        },
        'status': 'running'
    })

urlpatterns = [
    # Root endpoint for tenants
    path('', tenant_root_view, name='tenant-root'),
    
    # Admin interface - tenant-specific
    path('admin/', admin.site.urls),
    
    # API Documentation - tenant-specific
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='api-docs'),
    
    # API root endpoint
    path('api/', include('api.urls')),
    
    # Simple tenant access (SSL certificate workaround)
    path('', include('simple_tenant_access')),
    
    # Tenant-specific API Endpoints
    path('api/appointments/', include('appointment.urls')),
    path('api/treatments/', include('treatment.urls')),
    # path('api/medical/', include('medical_api.urls')),  # Temporarily disabled due to import errors
    
    # Authentication endpoints
    path('api/auth/', include('user_auth.urls')),
    
    # Health check endpoint
    path('health/', lambda request: JsonResponse({
        'status': 'ok', 
        'schema': getattr(request.tenant, 'schema_name', 'unknown'),
        'tenant': getattr(request.tenant, 'name', 'Unknown')
    })),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)