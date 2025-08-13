"""
API URL configuration for medcor_backend.
"""

from django.urls import path
from django.http import JsonResponse
from .views import CreateAnalysisTrackingView, AnalysisTrackingStatsView

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
            'appointments': '/api/appointments/',
            'medical_records': '/api/medical-records/',
            'auth': '/api/auth/',
            'tenants': '/api/tenants/',
            'subscriptions': '/api/subscription/',
            'track-analysis': '/api/track-analysis/',
            'analysis-tracking-stats': '/api/analysis-tracking-stats/'
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('health/', health_check, name='health_check'),
    path('track-analysis/', CreateAnalysisTrackingView.as_view(), name='track_analysis'),
    path('analysis-tracking-stats/', AnalysisTrackingStatsView.as_view(), name='analysis_tracking_stats'),
]