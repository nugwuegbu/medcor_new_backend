from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    DomainViewSet, DoctorViewSet, 
    PatientViewSet, NurseViewSet, AdminViewSet
)
from .client_views import ClientViewSet  # Import enhanced client viewset

router = DefaultRouter()
# Use the enhanced ClientViewSet with comprehensive Swagger documentation
router.register('clients', ClientViewSet, basename='client')  # Changed to 'clients' for clarity
router.register('hospitals-clinics', ClientViewSet, basename='client-legacy')  # Keep legacy endpoint
router.register('domains', DomainViewSet, basename='domain')
router.register('users/doctors', DoctorViewSet, basename='doctor')
router.register('users/patients', PatientViewSet, basename='patient')
router.register('users/nurses', NurseViewSet, basename='nurse')
router.register('users/admins', AdminViewSet, basename='admin')

urlpatterns = [
    path('api/tenants/', include(router.urls)),
]