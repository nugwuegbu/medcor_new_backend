from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TreatmentViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register(r'treatments', TreatmentViewSet, basename='treatment')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = router.urls