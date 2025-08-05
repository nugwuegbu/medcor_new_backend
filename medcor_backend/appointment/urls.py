from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SlotViewSet, SlotExclusionViewSet, AppointmentViewSet

router = DefaultRouter()
router.register('slots', SlotViewSet, basename='slot')
router.register('slot-exclusions', SlotExclusionViewSet, basename='slotexclusion')
router.register('appointments', AppointmentViewSet, basename='appointment')

urlpatterns = router.urls