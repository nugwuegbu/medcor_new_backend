"""
Simplified User Authentication URLs for Django Admin Backend
"""
from django.urls import path
from . import views

app_name = 'user_auth'

urlpatterns = [
    # Admin authentication endpoints
    path('api/auth/login/', views.AdminLoginAPIView.as_view(), name='admin_login'),
    path('api/auth/logout/', views.AdminLogoutAPIView.as_view(), name='admin_logout'),
    path('api/auth/profile/', views.AdminProfileAPIView.as_view(), name='admin_profile'),
    path('api/auth/stats/', views.AdminStatsAPIView.as_view(), name='admin_stats'),
    path('api/auth/users/', views.AdminUsersAPIView.as_view(), name='admin_users'),
    
    # User management endpoints
    path('api/users/', views.UserListAPIView.as_view(), name='user_list'),
    path('api/users/<int:pk>/', views.UserDetailAPIView.as_view(), name='user_detail'),
]