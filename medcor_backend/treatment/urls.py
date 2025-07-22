from django.urls import path
from .views import (
    TreatmentListCreateView,
    TreatmentDetailView,
    TreatmentByTenantView,
    TreatmentSearchView,
    TreatmentStatsView
)

app_name = 'treatment'

urlpatterns = [
    # Main CRUD endpoints
    path('', TreatmentListCreateView.as_view(), name='treatment-list-create'),
    path('<int:pk>/', TreatmentDetailView.as_view(), name='treatment-detail'),
    
    # Tenant-specific endpoints
    path('tenant/<int:tenant_id>/', TreatmentByTenantView.as_view(), name='treatment-by-tenant'),
    
    # Search and filter endpoints
    path('search/', TreatmentSearchView.as_view(), name='treatment-search'),
    
    # Statistics endpoint
    path('stats/', TreatmentStatsView.as_view(), name='treatment-stats'),
]