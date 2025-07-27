from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ClientViewSet, DomainViewSet, DoctorViewSet, 
    PatientViewSet, NurseViewSet, AdminViewSet
)

router = DefaultRouter()
router.register('hospitals-clinics', ClientViewSet, basename='client')
router.register('domains', DomainViewSet, basename='domain')
router.register('users/doctors', DoctorViewSet, basename='doctor')
router.register('users/patients', PatientViewSet, basename='patient')
router.register('users/nurses', NurseViewSet, basename='nurse')
router.register('users/admins', AdminViewSet, basename='admin')

urlpatterns = [
    path('api/tenants/', include(router.urls)),
]