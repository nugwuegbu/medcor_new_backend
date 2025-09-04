"""
URL configuration for tenants app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "tenants"

# Create router for hospital endpoints
router = DefaultRouter()
router.register(r"hospitals", views.HospitalViewSet, basename="hospital")

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
]
