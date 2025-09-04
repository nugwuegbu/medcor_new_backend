"""
URL configuration for appointments app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, DoctorAvailabilitySlotViewSet

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"slots", DoctorAvailabilitySlotViewSet, basename="doctor-slot")

urlpatterns = [
    path("", include(router.urls)),
]
