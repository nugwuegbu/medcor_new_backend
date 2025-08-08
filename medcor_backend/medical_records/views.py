from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import MedicalRecord
from .serializers import (
    MedicalRecordSerializer, 
    MedicalRecordCreateSerializer,
    MedicalRecordUpdateSerializer
)
from tenants.models import User
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

@extend_schema_view(
    list=extend_schema(
        summary="List all medical records",
        description="Get a list of all medical records. Admins see all records, doctors see their patients' records, patients see only their own records.",
        tags=["Medical Records"]
    ),
    create=extend_schema(
        summary="Create a new medical record",
        description="Create a new medical record for a patient",
        tags=["Medical Records"]
    ),
    retrieve=extend_schema(
        summary="Get a specific medical record",
        description="Retrieve details of a specific medical record by ID",
        tags=["Medical Records"]
    ),
    update=extend_schema(
        summary="Update a medical record",
        description="Update all fields of a medical record",
        tags=["Medical Records"]
    ),
    partial_update=extend_schema(
        summary="Partially update a medical record",
        description="Update specific fields of a medical record",
        tags=["Medical Records"]
    ),
    destroy=extend_schema(
        summary="Delete a medical record",
        description="Delete a medical record permanently",
        tags=["Medical Records"]
    )
)
class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing medical records.
    Provides full CRUD operations with role-based access control.
    """
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return MedicalRecordCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MedicalRecordUpdateSerializer
        return MedicalRecordSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on user role:
        - Admin: see all records
        - Doctor: see records of their patients
        - Patient: see only their own records
        """
        user = self.request.user
        queryset = MedicalRecord.objects.all()
        
        if user.role == 'patient':
            # Patients can only see their own records
            queryset = queryset.filter(patient=user)
        elif user.role == 'doctor':
            # Doctors can see records they created or are assigned to
            queryset = queryset.filter(Q(doctor=user) | Q(patient__doctor=user))
        # Admins can see all records (no filtering needed)
        
        # Optional filtering by patient_id from query params
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        return queryset.select_related('patient', 'doctor')
    
    def perform_create(self, serializer):
        """Set the doctor to the current user if they are a doctor"""
        if self.request.user.role == 'doctor':
            serializer.save(doctor=self.request.user)
        else:
            serializer.save()
    
    @extend_schema(
        summary="Get medical records for a specific patient",
        description="Retrieve all medical records for a specific patient",
        parameters=[
            OpenApiParameter(
                name='patient_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID of the patient',
                required=True
            )
        ],
        tags=["Medical Records"]
    )
    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def by_patient(self, request, patient_id=None):
        """Get all medical records for a specific patient"""
        try:
            patient = User.objects.get(id=patient_id, role='patient')
            
            # Check permissions
            if request.user.role == 'patient' and request.user.id != patient.id:
                return Response(
                    {"error": "You can only view your own medical records"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            records = self.get_queryset().filter(patient=patient)
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        summary="Get medical record statistics",
        description="Get statistics about medical records (total count, by status, by type)",
        tags=["Medical Records"]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics about medical records"""
        queryset = self.get_queryset()
        
        stats = {
            'total_records': queryset.count(),
            'by_status': {},
            'by_type': {},
            'recent_records': []
        }
        
        # Count by status
        for status_choice in MedicalRecord._meta.get_field('status').choices:
            count = queryset.filter(status=status_choice[0]).count()
            stats['by_status'][status_choice[1]] = count
        
        # Count by type
        types = queryset.values_list('type', flat=True).distinct()
        for record_type in types:
            count = queryset.filter(type=record_type).count()
            stats['by_type'][record_type] = count
        
        # Get 5 most recent records
        recent = queryset.order_by('-created_at')[:5]
        stats['recent_records'] = MedicalRecordSerializer(recent, many=True).data
        
        return Response(stats)
