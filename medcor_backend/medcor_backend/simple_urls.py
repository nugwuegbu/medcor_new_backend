"""
Simplified URL configuration for Django admin deployment
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def api_health(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django Admin Backend running successfully',
        'admin_url': '/admin/',
        'features': ['Django Admin', 'Medical Treatments', 'Patient Appointments']
    })

def api_info(request):
    """API information endpoint"""
    return JsonResponse({
        'backend': 'Django Admin Backend',
        'version': '1.0.0',
        'admin_interface': '/admin/',
        'models': ['Treatments', 'Appointments', 'Doctors', 'Users'],
        'note': 'Full Django admin functionality with complete CRUD operations'
    })

def root_view(request):
    """Root endpoint with admin interface information"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>MedCor Django Admin Backend</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f8f9fa; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; border-radius: 10px 10px 0 0; text-align: center; }
            .status { color: #28a745; font-weight: bold; font-size: 18px; margin: 20px 0; }
            .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .admin-btn { display: inline-block; background: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
            .admin-btn:hover { background: #0056b3; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .api-endpoint { background: #e9ecef; padding: 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 MedCor Django Admin Backend</h1>
                <p>Complete Django administration interface for medical platform</p>
            </div>
            
            <div class="status">✅ Django Admin Fully Deployed and Operational</div>
            
            <div class="section">
                <h2>🔐 Admin Interface Access</h2>
                <a href="/admin/" class="admin-btn">Open Django Admin Interface</a>
                <p><strong>Features:</strong> Full CRUD operations, user management, data administration</p>
                <p><strong>Login:</strong> Use Django superuser credentials to access</p>
            </div>
            
            <div class="section">
                <h2>📊 Available Models</h2>
                <div class="feature">
                    <strong>Medical Treatments</strong><br>
                    Manage treatment types, costs, descriptions, and availability
                </div>
                <div class="feature">
                    <strong>Patient Appointments</strong><br>
                    Complete appointment scheduling and status management
                </div>
                <div class="feature">
                    <strong>Doctor Profiles</strong><br>
                    Doctor information, specializations, and availability
                </div>
                <div class="feature">
                    <strong>User Management</strong><br>
                    Patient and staff account administration
                </div>
            </div>
            
            <div class="section">
                <h2>🔗 API Endpoints</h2>
                <div class="api-endpoint">GET /api/health/ - Backend health status</div>
                <div class="api-endpoint">GET /api/info/ - Backend information</div>
                <div class="api-endpoint">GET /admin/ - Django admin interface</div>
            </div>
            
            <div class="section">
                <h2>💡 Quick Start</h2>
                <ol>
                    <li>Access the Django admin at <a href="/admin/">/admin/</a></li>
                    <li>Login with superuser credentials</li>
                    <li>Add treatments, doctors, and manage appointments</li>
                    <li>Configure user roles and permissions</li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content.encode('utf-8'), content_type='text/html; charset=utf-8')

def api_root(request):
    """Root API endpoint showing all available endpoints"""
    return JsonResponse({
        'message': 'MedCor Backend API',
        'version': '1.0',
        'available_endpoints': {
            'system': {
                'health': '/api/health/',
                'info': '/api/info/'
            },
            'tenant_branding': {
                'presets': '/api/tenants/branding/presets/',
                'tenant_css': '/api/tenants/branding/<id>/css/',
                'tenant_json': '/api/tenants/branding/<id>/json/',
                'tenant_preview': '/api/tenants/branding/<id>/preview/',
                'apply_preset': '/api/tenants/branding/apply-preset/'
            },
            'user_management': {
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'profile': '/api/auth/profile/',
                'stats': '/api/auth/stats/',
                'users': '/api/auth/users/',
                'patients': '/api/tenants/patients/',
                'doctors': '/api/tenants/doctors/',
                'nurses': '/api/tenants/nurses/'
            },
            'medical_api': {
                'patients': '/api/medical/patients/',
                'doctors': '/api/medical/doctors/',
                'treatments': '/api/medical/treatments/',
                'appointments': '/api/medical/appointments/',
                'simple_appointments': '/api/medical/simple-appointments/',
                'patient_stats': '/api/medical/patients/statistics/',
                'doctor_stats': '/api/medical/doctors/statistics/',
                'treatment_stats': '/api/medical/treatments/statistics/',
                'appointment_stats': '/api/medical/appointments/statistics/'
            },
            'tenant_api': {
                'tenants': '/api/tenants/tenants/',
                'domains': '/api/tenants/domains/',
                'branding_presets': '/api/tenants/branding-presets/',
                'tenant_patients': '/api/tenants/patients/',
                'tenant_doctors': '/api/tenants/doctors/',
                'tenant_nurses': '/api/tenants/nurses/',
                'tenant_stats': '/api/tenants/tenants/statistics/',
                'patient_stats': '/api/tenants/patients/statistics/',
                'doctor_stats': '/api/tenants/doctors/statistics/',
                'nurse_stats': '/api/tenants/nurses/statistics/'
            },
            'admin': {
                'interface': '/admin/',
                'login': '/admin/login/'
            },
            'documentation': {
                'docs': '/api/docs/',
                'swagger': '/api/swagger/',
                'redoc': '/api/redoc/',
                'schema': '/api/schema/'
            }
        },
        'authentication': 'Django admin session required for protected endpoints',
        'base_url': 'http://localhost:8000'
    })

def api_docs_redirect(request):
    """Redirect /api/docs/ to Swagger UI for better UX"""
    return redirect('/api/swagger/')

def api_redocs_redirect(request):
    """Redirect /api/redocs/ to ReDoc for better UX (common typo)"""
    return redirect('/api/redoc/')

urlpatterns = [
    # Root and info endpoints
    path('', root_view, name='root'),
    path('api/', api_root, name='api_root'),
    path('api/health/', api_health, name='api_health'),
    path('api/info/', api_info, name='api_info'),
    
    # Django admin interface
    path('admin/', admin.site.urls),
    
    # Tenant branding API endpoints
    path('api/tenants/', include('simple_tenant.urls')),
    
    # User authentication endpoints with Swagger documentation
    path('', include('user_auth.urls')),
    
    # Medical API endpoints with comprehensive Swagger documentation  
    path('', include('medical_api.urls')),
    
    # Tenant API endpoints with comprehensive Swagger documentation
    path('', include('tenant_api.urls')),
    
    # API Documentation endpoints
    path('api/docs/', api_docs_redirect, name='api_docs'),
    path('api/redocs/', api_redocs_redirect, name='api_redocs_redirect'),  # Handle common typo
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Configure admin site
admin.site.site_header = "MedCor Admin Interface"
admin.site.site_title = "MedCor Admin"
admin.site.index_title = "Medical Platform Administration"