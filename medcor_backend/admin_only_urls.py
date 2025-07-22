"""
URL configuration for Django admin only - NO CSRF
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "message": "Django Admin Backend running successfully",
        "admin_url": "/admin/",
        "features": [
            "Django Admin",
            "Medical Treatments", 
            "Patient Appointments"
        ]
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health'),
]