"""
URL configuration for YouCam AI Analysis API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import YouCamAnalysisViewSet, AnalysisHistoryViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'analyses', YouCamAnalysisViewSet, basename='youcam-analysis')
router.register(r'history', AnalysisHistoryViewSet, basename='analysis-history')

app_name = 'youcam'

urlpatterns = [
    path('', include(router.urls)),
]