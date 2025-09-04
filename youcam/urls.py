"""
URL configuration for YouCam AI Analysis API
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AnalysisHistoryViewSet, YouCamAnalysisViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r"analyses", YouCamAnalysisViewSet, basename="youcam-analysis")
router.register(r"history", AnalysisHistoryViewSet, basename="analysis-history")

app_name = "youcam"

urlpatterns = [
    path("", include(router.urls)),
]
