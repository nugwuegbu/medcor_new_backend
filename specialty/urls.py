from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (DoctorSpecialtyViewSet, SpecialtyStatisticsViewSet,
                    SpecialtyViewSet)

router = DefaultRouter()
router.register(r"specialties", SpecialtyViewSet, basename="specialty")
router.register(
    r"doctor-specialties", DoctorSpecialtyViewSet, basename="doctor-specialty"
)
router.register(
    r"statistics", SpecialtyStatisticsViewSet, basename="specialty-statistics"
)

urlpatterns = router.urls
