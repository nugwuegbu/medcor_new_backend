from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
# Unified KnowledgeBase endpoint with hospital_id in URL
router.register(r'hospital/(?P<hospital_id>[^/.]+)/knowledge-base', views.UnifiedKnowledgeBaseViewSet, basename='knowledge-base')
router.register(r'sources', views.SourceViewSet, basename='knowledgebase-source')
router.register(r'source-files', views.SourceFileViewSet, basename='knowledgebase-source-file')

app_name = 'knowledgebase'

urlpatterns = [
    # Include ViewSet URLs
    path('', include(router.urls)),
]