"""
URL configuration for core authentication app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView,
    ProfileView, ChangePasswordView, UserViewSet,
    AvailableHospitalsView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('hospitals/', AvailableHospitalsView.as_view(), name='available_hospitals'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # User management
    path('', include(router.urls)),
    
    # Chat, Voice, and Avatar APIs
    path('', include('core.chat_urls')),
]