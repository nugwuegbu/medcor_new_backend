"""
Enhanced URL configuration for appointments app.
Supports weekly patterns and specific date exceptions.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    DoctorScheduleTemplateViewSet,
    DoctorScheduleSlotViewSet,
    ScheduleExceptionViewSet,
)

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"templates", DoctorScheduleTemplateViewSet, basename="schedule-template")
router.register(r"slots", DoctorScheduleSlotViewSet, basename="schedule-slot")
router.register(r"exceptions", ScheduleExceptionViewSet, basename="schedule-exception")

urlpatterns = [
    path("", include(router.urls)),
]