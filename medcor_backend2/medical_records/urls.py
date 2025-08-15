from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet, MedicalDocumentViewSet

router = DefaultRouter()
router.register(r'records', MedicalRecordViewSet, basename='medical-record')
router.register(r'documents', MedicalDocumentViewSet, basename='medical-document')

urlpatterns = router.urls