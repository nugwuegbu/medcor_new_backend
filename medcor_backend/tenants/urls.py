from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, admin_views

router = DefaultRouter()
router.register(r'clients', views.ClientViewSet)
router.register(r'domains', views.DomainViewSet)

urlpatterns = [
    # API routes for tenant management
    path('api/tenants/', include(router.urls)),
    
    # Admin authentication endpoints  
    path('api/admin/login/', admin_views.admin_login, name='admin_login'),
    path('api/admin/logout/', admin_views.admin_logout, name='admin_logout'),
    path('api/admin/profile/', admin_views.admin_profile, name='admin_profile'),
    path('api/admin/stats/', admin_views.admin_stats, name='admin_stats'),
    path('api/admin/users/', admin_views.admin_users, name='admin_users'),
]