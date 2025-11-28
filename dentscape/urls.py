"""
URL configuration for Dentscape AI Analysis and Simulation API
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DentscapeSimulationViewSet,
    DentscapeAnalysisViewSet,
    DentscapeHistoryViewSet,
)

# Create router and register viewsets
router = DefaultRouter()

# Register viewsets
router.register(r"simulations", DentscapeSimulationViewSet, basename="simulations")
router.register(r"analyses", DentscapeAnalysisViewSet, basename="analyses")
router.register(r"history", DentscapeHistoryViewSet, basename="history")

app_name = "dentscape"

urlpatterns = [
    path("", include(router.urls)),
]





