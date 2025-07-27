from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    SubscriptionPlanViewSet, SubscriptionViewSet, 
    PaymentViewSet, UsageTrackingViewSet
)

router = DefaultRouter()
router.register('plans', SubscriptionPlanViewSet, basename='subscriptionplan')
router.register('subscriptions', SubscriptionViewSet, basename='subscription')
router.register('payments', PaymentViewSet, basename='payment')
router.register('usage', UsageTrackingViewSet, basename='usagetracking')

urlpatterns = [
    path('api/subscription/', include(router.urls)),
]