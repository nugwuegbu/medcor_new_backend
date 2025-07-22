from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SlotViewSet, SlotExclusionViewSet, AppointmentViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'slots', SlotViewSet, basename='slot')
router.register(r'slot-exclusions', SlotExclusionViewSet, basename='slotexclusion')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]