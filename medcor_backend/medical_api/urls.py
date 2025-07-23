"""
Medical API URLs for all core medical endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'medical_api'

# Create router and register ViewSets
router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'doctors', views.CoreDoctorViewSet, basename='doctor')
router.register(r'treatments', views.TreatmentViewSet, basename='treatment')
router.register(r'appointments', views.CoreAppointmentViewSet, basename='appointment')
router.register(r'simple-appointments', views.SimpleAppointmentViewSet, basename='simple-appointment')

urlpatterns = [
    # Include all medical API endpoints
    path('api/medical/', include(router.urls)),
]