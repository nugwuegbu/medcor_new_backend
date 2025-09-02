"""
URL configuration for core authentication app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views_simple import (
    RegisterView, LoginView, LogoutView,
    UserProfileView, ChangePasswordView, DoctorListView, PatientListView, UserStatsView
)
from .views import health_check

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # User management
    path('doctors/', DoctorListView.as_view(), name='doctors'),
    path('patients/', PatientListView.as_view(), name='patients'),
    path('stats/', UserStatsView.as_view(), name='user_stats'),
    
    # Chat, Voice, and Avatar APIs (temporarily disabled)
    # path('', include('core.chat_urls')),
    
    # Health check
    path('health/', health_check, name='health_check'),
]