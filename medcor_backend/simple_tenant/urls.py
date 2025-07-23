from django.urls import path
from . import views

app_name = 'simple_tenant'

urlpatterns = [
    # Legacy Django views (for backwards compatibility)
    path('branding/<int:tenant_id>/css/', views.tenant_branding_css, name='tenant_branding_css'),
    path('branding/<int:tenant_id>/preview/', views.tenant_branding_preview, name='tenant_branding_preview'),
    
    # NEW DRF API Views (documented in Swagger)
    path('branding/<int:tenant_id>/json/', views.TenantBrandingJSONAPIView.as_view(), name='tenant_branding_json_api'),
    path('branding/presets/', views.BrandingPresetsListAPIView.as_view(), name='branding_presets_api'),
    path('branding/apply-preset/', views.ApplyPresetAPIView.as_view(), name='apply_preset_api'),
]