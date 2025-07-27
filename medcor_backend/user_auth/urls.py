"""
Simplified User Authentication URLs for Django Admin Backend
"""
from django.urls import path
from . import views

app_name = 'user_auth'

urlpatterns = [
    # Admin authentication endpoints
    path('login/', views.AdminLoginAPIView.as_view(), name='admin_login'),
    path('logout/', views.AdminLogoutAPIView.as_view(), name='admin_logout'),
    path('profile/', views.AdminProfileAPIView.as_view(), name='admin_profile'),
    path('stats/', views.AdminStatsAPIView.as_view(), name='admin_stats'),
    path('users/', views.AdminUsersAPIView.as_view(), name='admin_users'),
    
    # User management endpoints 
    path('users/', views.UserListAPIView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailAPIView.as_view(), name='user_detail'),
]