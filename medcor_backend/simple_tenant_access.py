#!/usr/bin/env python3
"""
Simple tenant access URLs that work with main domain SSL certificate
"""

from django.http import JsonResponse
from django.urls import path
from django.shortcuts import redirect

def simple_tenant_list(request):
    """Simple tenant list without database dependencies"""
    return JsonResponse({
        "message": "MedCor Multi-Tenant System",
        "available_tenants": [
            {
                "name": "Public Tenant",
                "schema": "public",
                "api_url": "/api/",
                "admin_url": "/admin/",
                "docs_url": "/api/docs/"
            },
            {
                "name": "Medcor Hospital",
                "schema": "medcorhospital", 
                "api_url": "/hospital/api/",
                "admin_url": "/hospital/admin/",
                "docs_url": "/hospital/docs/"
            },
            {
                "name": "Medcor Clinic",
                "schema": "medcorclinic",
                "api_url": "/clinic/api/",
                "admin_url": "/clinic/admin/",
                "docs_url": "/clinic/docs/"
            }
        ],
        "note": "Use these URLs to access tenant-specific content with main domain SSL certificate"
    })

def hospital_api(request):
    """Hospital API endpoint"""
    return JsonResponse({
        "message": "MedCor Hospital API",
        "tenant": "Medcor Hospital",
        "schema": "medcorhospital",
        "endpoints": {
            "admin": "/hospital/admin/",
            "docs": "/hospital/docs/",
            "treatments": "/api/treatments/",
            "appointments": "/api/appointments/"
        }
    })

def clinic_api(request):
    """Clinic API endpoint"""
    return JsonResponse({
        "message": "MedCor Clinic API", 
        "tenant": "Medcor Clinic",
        "schema": "medcorclinic",
        "endpoints": {
            "admin": "/clinic/admin/",
            "docs": "/clinic/docs/",
            "treatments": "/api/treatments/",
            "appointments": "/api/appointments/"
        }
    })

def hospital_admin(request):
    """Redirect to admin with hospital context"""
    response = redirect('/admin/')
    response.set_cookie('tenant_context', 'medcorhospital')
    return response

def clinic_admin(request):
    """Redirect to admin with clinic context"""
    response = redirect('/admin/')
    response.set_cookie('tenant_context', 'medcorclinic')
    return response

def hospital_docs(request):
    """Redirect to docs with hospital context"""
    response = redirect('/api/docs/')
    response.set_cookie('tenant_context', 'medcorhospital')
    return response

def clinic_docs(request):
    """Redirect to docs with clinic context"""
    response = redirect('/api/docs/')
    response.set_cookie('tenant_context', 'medcorclinic')
    return response

# Simple URL patterns
urlpatterns = [
    path('tenants/', simple_tenant_list, name='simple_tenant_list'),
    path('hospital/api/', hospital_api, name='hospital_api'),
    path('hospital/admin/', hospital_admin, name='hospital_admin'),
    path('hospital/docs/', hospital_docs, name='hospital_docs'),
    path('clinic/api/', clinic_api, name='clinic_api'),
    path('clinic/admin/', clinic_admin, name='clinic_admin'),
    path('clinic/docs/', clinic_docs, name='clinic_docs'),
]