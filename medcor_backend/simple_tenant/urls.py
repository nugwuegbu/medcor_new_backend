from django.urls import path
from . import views

app_name = 'simple_tenant'

urlpatterns = [
    # Tenant branding CSS endpoint
    path('branding/<int:tenant_id>/css/', views.tenant_branding_css, name='tenant_branding_css'),
    
    # Tenant branding JSON API
    path('branding/<int:tenant_id>/json/', views.tenant_branding_json, name='tenant_branding_json'),
    
    # Tenant branding preview
    path('branding/<int:tenant_id>/preview/', views.tenant_branding_preview, name='tenant_branding_preview'),
    
    # Apply preset to tenant
    path('branding/apply-preset/', views.ApplyPresetView.as_view(), name='apply_preset'),
    
    # List available presets
    path('branding/presets/', views.branding_presets_list, name='branding_presets_list'),
]