"""
URL configuration for core authentication app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import health_check, HospitalDoctorsView, HospitalPatientsView, CertificationViewSet
from .views_simple import (
    ChangePasswordView,
    DoctorListView,
    LoginView,
    LogoutView,
    PatientListView,
    RegisterView,
    UserProfileView,
    UserStatsView,
)
# AI Doctor Profile Parser removed
from .ai_query_views import HealthAwareQueryView

# Create router for certifications
router = DefaultRouter()
router.register(r'certifications', CertificationViewSet, basename='certification')

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Profile
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    # User management
    path("doctors/", DoctorListView.as_view(), name="doctors"),
    path("patients/", PatientListView.as_view(), name="patients"),
    path("stats/", UserStatsView.as_view(), name="user_stats"),
    
    # AI Doctor Profile Parser - REMOVED
    
    # AI Query Processing
    path("ai/query/", HealthAwareQueryView.as_view(), name="ai_query"),
    
    # Hospital-specific user endpoints
    path("hospitals/<uuid:hospital_id>/doctors/", HospitalDoctorsView.as_view(), name="hospital_doctors"),
    path("hospitals/<uuid:hospital_id>/patients/", HospitalPatientsView.as_view(), name="hospital_patients"),
    
    # Chat, Voice, and Avatar APIs (temporarily disabled)
    # path('', include('core.chat_urls')),
    # Health check
    path("health/", health_check, name="health_check"),
    
    # Include router URLs
    path("", include(router.urls)),
]
