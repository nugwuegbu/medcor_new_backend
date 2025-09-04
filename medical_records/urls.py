from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicalDocumentViewSet, MedicalRecordViewSet

router = DefaultRouter()
router.register(r"records", MedicalRecordViewSet, basename="medical-record")
router.register(r"documents", MedicalDocumentViewSet, basename="medical-document")

urlpatterns = router.urls
