"""
Alternative URL routing using tenant parameters instead of subdomains
Workaround for SSL certificate limitations
"""

from django.urls import path, include
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
try:
    from tenants.models import Client
except ImportError:
    # Fallback for import issues
    Client = None
import json

def tenant_api_root(request, tenant_name):
    """API root for specific tenant via parameter"""
    if not Client:
        return JsonResponse({"error": "Tenant model not available"}, status=500)
    
    try:
        tenant = Client.objects.get(schema_name=tenant_name)
        return JsonResponse({
            "message": f"MedCor Django API - {tenant.name}",
            "tenant": tenant.name,
            "schema": tenant.schema_name,
            "version": "1.0",
            "endpoints": {
                "health": f"/tenant/{tenant_name}/api/health/",
                "admin": f"/tenant/{tenant_name}/admin/",
                "treatments": f"/tenant/{tenant_name}/api/treatments/",
                "appointments": f"/tenant/{tenant_name}/api/appointments/",
                "docs": f"/tenant/{tenant_name}/api/docs/",
                "schema": f"/tenant/{tenant_name}/api/schema/"
            }
        })
    except Exception as e:
        return JsonResponse({"error": f"Tenant '{tenant_name}' not found: {str(e)}"}, status=404)

def tenant_admin_redirect(request, tenant_name):
    """Redirect to admin with tenant context"""
    try:
        tenant = Client.objects.get(schema_name=tenant_name)
        # Set tenant context and redirect to admin
        response = redirect('/admin/')
        response.set_cookie('tenant_context', tenant_name)
        return response
    except Client.DoesNotExist:
        return JsonResponse({"error": f"Tenant '{tenant_name}' not found"}, status=404)

def tenant_docs_redirect(request, tenant_name):
    """Redirect to API docs with tenant context"""
    try:
        tenant = Client.objects.get(schema_name=tenant_name)
        response = redirect('/api/docs/')
        response.set_cookie('tenant_context', tenant_name)
        return response
    except Client.DoesNotExist:
        return JsonResponse({"error": f"Tenant '{tenant_name}' not found"}, status=404)

def tenant_list(request):
    """List all available tenants"""
    tenants = Client.objects.all()
    tenant_list = []
    
    for tenant in tenants:
        tenant_list.append({
            "name": tenant.name,
            "schema": tenant.schema_name,
            "api_url": f"/tenant/{tenant.schema_name}/api/",
            "admin_url": f"/tenant/{tenant.schema_name}/admin/",
            "docs_url": f"/tenant/{tenant.schema_name}/api/docs/"
        })
    
    return JsonResponse({
        "message": "MedCor Multi-Tenant System",
        "total_tenants": len(tenant_list),
        "tenants": tenant_list
    })

# URL patterns for tenant parameter routing
urlpatterns = [
    # Tenant list
    path('tenants/', tenant_list, name='tenant_list'),
    
    # Tenant-specific routes
    path('tenant/<str:tenant_name>/api/', tenant_api_root, name='tenant_api_root'),
    path('tenant/<str:tenant_name>/admin/', tenant_admin_redirect, name='tenant_admin'),
    path('tenant/<str:tenant_name>/api/docs/', tenant_docs_redirect, name='tenant_docs'),
]