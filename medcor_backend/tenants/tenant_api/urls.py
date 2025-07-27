"""
Tenant API URLs for comprehensive tenant-based endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'tenant_api'

# Create router and register ViewSets
router = DefaultRouter()
router.register(r'tenants', views.TenantViewSet, basename='tenant')
router.register(r'domains', views.DomainViewSet, basename='domain')
router.register(r'branding-presets', views.TenantBrandingPresetViewSet, basename='branding-preset')

# Tenant-specific user management
router.register(r'patients', views.TenantPatientViewSet, basename='tenant-patient')
router.register(r'doctors', views.TenantDoctorViewSet, basename='tenant-doctor')
router.register(r'nurses', views.TenantNurseViewSet, basename='tenant-nurse')

urlpatterns = [
    # Include all tenant API endpoints
    path('api/tenants/', include(router.urls)),
]