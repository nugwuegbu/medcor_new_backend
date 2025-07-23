from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, admin_views

router = DefaultRouter()
router.register(r'clients', views.ClientViewSet)
router.register(r'domains', views.DomainViewSet)
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'doctors', views.DoctorViewSet, basename='doctor')
router.register(r'nurses', views.NurseViewSet, basename='nurse')

urlpatterns = [
    # API routes for tenant management
    path('api/tenants/', include(router.urls)),
    
    # Admin authentication endpoints (legacy function-based views)
    path('api/admin/login/', admin_views.admin_login, name='admin_login_legacy'),
    path('api/admin/logout/', admin_views.admin_logout, name='admin_logout_legacy'),
    path('api/admin/profile/', admin_views.admin_profile, name='admin_profile_legacy'),
    path('api/admin/stats/', admin_views.admin_stats, name='admin_stats_legacy'),
    path('api/admin/users/', admin_views.admin_users, name='admin_users_legacy'),
    
    # NEW DRF Admin API endpoints (documented in Swagger)
    path('api/auth/login/', admin_views.AdminLoginAPIView.as_view(), name='admin_login_api'),
    path('api/auth/logout/', admin_views.AdminLogoutAPIView.as_view(), name='admin_logout_api'),
    path('api/auth/profile/', admin_views.AdminProfileAPIView.as_view(), name='admin_profile_api'),
    path('api/auth/stats/', admin_views.AdminStatsAPIView.as_view(), name='admin_stats_api'),
    path('api/auth/users/', admin_views.AdminUsersAPIView.as_view(), name='admin_users_api'),
]