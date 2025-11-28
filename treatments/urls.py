from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PrescriptionViewSet, TreatmentViewSet

router = DefaultRouter()
router.register(r"treatments", TreatmentViewSet, basename="treatment")
router.register(r"prescriptions", PrescriptionViewSet, basename="prescription")

urlpatterns = router.urls
