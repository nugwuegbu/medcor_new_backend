"""
URL configuration for YouCam AI Analysis API
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FaceAnalysisViewSet,
    LipsAnalysisViewSet,
    HairAnalysisViewSet,
    HairExtensionAnalysisViewSet,
    SkinAnalysisViewSet,
)

# Create router and register viewsets
router = DefaultRouter()

# Separate endpoints for each analysis type
router.register(r"face-analysis", FaceAnalysisViewSet, basename="face-analysis")
router.register(r"lips-analysis", LipsAnalysisViewSet, basename="lips-analysis")
router.register(r"hair-analysis", HairAnalysisViewSet, basename="hair-analysis")
router.register(r"hair-extension-analysis", HairExtensionAnalysisViewSet, basename="hair-extension-analysis")
router.register(r"skin-analysis", SkinAnalysisViewSet, basename="skin-analysis")

app_name = "youcam"

urlpatterns = [
    path("", include(router.urls)),
]
