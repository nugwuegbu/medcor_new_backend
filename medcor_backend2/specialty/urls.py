from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialtyViewSet, DoctorSpecialtyViewSet, SpecialtyStatisticsViewSet

router = DefaultRouter()
router.register(r'specialties', SpecialtyViewSet, basename='specialty')
router.register(r'doctor-specialties', DoctorSpecialtyViewSet, basename='doctor-specialty')
router.register(r'statistics', SpecialtyStatisticsViewSet, basename='specialty-statistics')

urlpatterns = router.urls