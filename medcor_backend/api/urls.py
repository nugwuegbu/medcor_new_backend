"""
API URL configuration for medcor_backend.
"""

from django.urls import path
from django.http import JsonResponse

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'message': 'Django backend is running',
        'environment': 'development'
    })

def api_root(request):
    """API root endpoint with available endpoints"""
    return JsonResponse({
        'message': 'MedCor Django API',
        'version': '1.0',
        'endpoints': {
            'health': '/api/health/',
            'admin': '/admin/',
            'treatments': '/api/treatments/',
            'appointments': '/api/appointments/'
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('health/', health_check, name='health_check'),
]