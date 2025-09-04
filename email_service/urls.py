"""
URL configuration for email service app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "email_service"

# Create router for email endpoints
router = DefaultRouter()
router.register(r"emails", views.EmailRequestViewSet, basename="email")

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
]
