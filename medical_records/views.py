"""
ViewSets for Medical Records management.
"""

from datetime import timedelta

from django.db.models import Count, Max, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MedicalDocument, MedicalRecord
from .serializers import (
    CreateMedicalRecordSerializer,
    MedicalDocumentSerializer,
    MedicalRecordListSerializer,
    MedicalRecordSerializer,
    PatientMedicalHistorySerializer,
)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Medical Record CRUD operations.

    Provides endpoints for:
    - List all medical records (with filtering)
    - Create new medical record
    - Retrieve medical record details
    - Update medical record
    - Delete medical record
    - Custom actions for record management
    """

    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["record_type", "patient", "created_by", "is_confidential"]
    search_fields = ["title", "description", "diagnosis", "symptoms"]
    ordering_fields = ["created_at", "record_type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter medical records by hospital/tenant and user role."""
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by hospital if user has one
        if hasattr(user, "hospital_name") and user.hospital_name:
            queryset = queryset.filter(hospital_name=user.hospital_name)

        # Additional filtering based on user role
        if user.role == "PATIENT":
            # Patients can only see their own records
            queryset = queryset.filter(patient=user)
        elif user.role == "DOCTOR":
            # Doctors can see records for their patients
            queryset = queryset.filter(Q(created_by=user) | Q(patient__doctor=user))
        elif user.role == "NURSE":
            # Nurses can see non-confidential records
            queryset = queryset.filter(Q(created_by=user) | Q(is_confidential=False))

        # Apply access restrictions
        if not user.is_superuser and user.role not in ["DOCTOR", "ADMIN"]:
            queryset = queryset.filter(access_restricted=False)

        return queryset.select_related("patient", "created_by").prefetch_related(
            "documents"
        )

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == "list":
            return MedicalRecordListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return CreateMedicalRecordSerializer
        return MedicalRecordSerializer

    def perform_create(self, serializer):
        """Set hospital and created_by when creating record."""
        hospital_name = None
        if (
            hasattr(self.request.user, "hospital_name")
            and self.request.user.hospital_name
        ):
            hospital_name = self.request.user.hospital_name

        serializer.save(hospital_name=hospital_name, created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def by_patient(self, request):
        """Get medical records for a specific patient."""
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            return Response(
                {"error": "patient_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(patient_id=patient_id)
        serializer = MedicalRecordSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent medical records (last 30 days)."""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        queryset = self.get_queryset().filter(created_at__gte=thirty_days_ago)
        serializer = MedicalRecordListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def allergies(self, request):
        """Get all allergy records."""
        queryset = self.get_queryset().filter(record_type="ALLERGY")
        serializer = MedicalRecordSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def lab_results(self, request):
        """Get all lab result records."""
        queryset = self.get_queryset().filter(record_type="LAB_RESULT")
        serializer = MedicalRecordSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def patient_history(self, request):
        """Get comprehensive patient medical history."""
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            # If no patient_id, use current user if they're a patient
            if request.user.role == "PATIENT":
                patient_id = request.user.id
            else:
                return Response(
                    {"error": "patient_id parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        records = self.get_queryset().filter(patient_id=patient_id)

        # Compile history summary
        history_data = {
            "total_records": records.count(),
            "records_by_type": dict(
                records.values("record_type")
                .annotate(count=Count("id"))
                .values_list("record_type", "count")
            ),
            "recent_diagnoses": list(
                records.filter(record_type="DIAGNOSIS")
                .order_by("-created_at")[:5]
                .values("title", "diagnosis", "created_at")
            ),
            "allergies": list(
                records.filter(record_type="ALLERGY").values("title", "description")
            ),
            "recent_lab_results": list(
                records.filter(record_type="LAB_RESULT")
                .order_by("-created_at")[:5]
                .values("title", "lab_results", "created_at")
            ),
            "recent_appointments": records.filter(appointment__isnull=False).count(),
            "confidential_records": records.filter(is_confidential=True).count(),
        }

        serializer = PatientMedicalHistorySerializer(history_data)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_confidential(self, request, pk=None):
        """Mark a medical record as confidential."""
        record = self.get_object()
        record.is_confidential = True
        record.save()
        serializer = MedicalRecordSerializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def restrict_access(self, request, pk=None):
        """Restrict access to a medical record."""
        record = self.get_object()
        record.access_restricted = True
        record.save()
        serializer = MedicalRecordSerializer(record)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def documents(self, request, pk=None):
        """Manage documents for a medical record."""
        record = self.get_object()

        if request.method == "GET":
            documents = record.documents.all()
            serializer = MedicalDocumentSerializer(documents, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = MedicalDocumentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    medical_record=record,
                    hospital_name=record.hospital_name,
                    uploaded_by=request.user,
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Medical Document management.
    """

    queryset = MedicalDocument.objects.all()
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["document_type", "medical_record"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter documents by hospital/tenant."""
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by hospital
        if hasattr(user, "hospital_name") and user.hospital_name:
            queryset = queryset.filter(hospital_name=user.hospital_name)

        # Filter by user role
        if user.role == "PATIENT":
            queryset = queryset.filter(medical_record__patient=user)
        elif user.role == "DOCTOR":
            queryset = queryset.filter(
                Q(uploaded_by=user) | Q(medical_record__patient__doctor=user)
            )

        return queryset.select_related("medical_record__patient", "uploaded_by")

    def perform_create(self, serializer):
        """Set hospital and uploaded_by when creating document."""
        hospital_name = None
        if (
            hasattr(self.request.user, "hospital_name")
            and self.request.user.hospital_name
        ):
            hospital_name = self.request.user.hospital_name

        # Extract file metadata
        file = self.request.FILES.get("file")
        if file:
            serializer.save(
                hospital_name=hospital_name,
                uploaded_by=self.request.user,
                file_size=file.size,
                file_type=file.content_type or "application/octet-stream",
            )
        else:
            serializer.save(hospital_name=hospital_name, uploaded_by=self.request.user)

    @action(detail=False, methods=["get"])
    def by_type(self, request):
        """Get documents grouped by type."""
        document_type = request.query_params.get("type")
        if not document_type:
            return Response(
                {"error": "type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(document_type=document_type)
        serializer = MedicalDocumentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def recent_uploads(self, request):
        """Get recently uploaded documents (last 7 days)."""
        seven_days_ago = timezone.now() - timedelta(days=7)
        queryset = self.get_queryset().filter(created_at__gte=seven_days_ago)
        serializer = MedicalDocumentSerializer(queryset, many=True)
        return Response(serializer.data)
