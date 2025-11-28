"""
URL patterns for ChatWidget app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatWidgetCustomizationViewSet, AvartaCollectViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'chatwidget', ChatWidgetCustomizationViewSet, basename='chatwidget')
router.register(r'avatar-collections', AvartaCollectViewSet, basename='avatar-collection')

app_name = 'chatwidget'

urlpatterns = [
    path('', include(router.urls)),
]


