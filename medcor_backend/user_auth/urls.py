"""
Simplified User Authentication URLs for Django Admin Backend
"""
from django.urls import path
from . import views
from . import general_views
from . import doctor_views

app_name = 'user_auth'

urlpatterns = [
    # General authentication endpoints (for all users)
    path('login/', general_views.GeneralLoginAPIView.as_view(), name='general_login'),
    path('me/', general_views.UserProfileAPIView.as_view(), name='user_me'),
    path('profile/', general_views.UserProfileAPIView.as_view(), name='user_profile'),
    
    # Doctor list endpoint
    path('doctors/', doctor_views.doctor_list, name='doctor_list'),
    
    # Admin authentication endpoints
    path('admin/login/', views.AdminLoginAPIView.as_view(), name='admin_login'),
    path('logout/', views.AdminLogoutAPIView.as_view(), name='admin_logout'),
    path('admin/profile/', views.AdminProfileAPIView.as_view(), name='admin_profile'),
    path('stats/', views.AdminStatsAPIView.as_view(), name='admin_stats'),
    path('users/', views.AdminUsersAPIView.as_view(), name='admin_users'),
    
    # User management endpoints 
    path('users/<int:pk>/', views.UserDetailAPIView.as_view(), name='user_detail'),
]