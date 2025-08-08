from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from .models import MedicalRecord, MedicalRecordFile
from .serializers import (
    MedicalRecordSerializer, 
    MedicalRecordCreateSerializer,
    MedicalRecordUpdateSerializer,
    MedicalRecordFileSerializer
)
from tenants.models import User
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

@extend_schema_view(
    list=extend_schema(
        summary="List all medical records",
        description="Get a list of all medical records. Admins see all records, doctors see all records, patients see only their own records.",
        tags=["Medical Records"]
    ),
    create=extend_schema(
        summary="Create a new medical record",
        description="Create a new medical record for a patient with optional file uploads",
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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
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
        - Doctor: see all records (any doctor can see patient records)
        - Patient: see only their own records
        """
        user = self.request.user
        queryset = MedicalRecord.objects.all()
        
        if user.role == 'patient':
            # Patients can only see their own records
            queryset = queryset.filter(patient=user)
        # Admins and doctors can see all records (no filtering needed)
        
        # Optional filtering by patient_id from query params
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        return queryset.select_related('patient').prefetch_related('files')
    
    def perform_create(self, serializer):
        """Create the medical record with uploaded files"""
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
        summary="Download a medical record file",
        description="Download a specific file attached to a medical record",
        parameters=[
            OpenApiParameter(
                name='file_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID of the file to download',
                required=True
            )
        ],
        tags=["Medical Records"]
    )
    @action(detail=True, methods=['get'], url_path='files/(?P<file_id>[^/.]+)/download')
    def download_file(self, request, pk=None, file_id=None):
        """Download a specific file from a medical record"""
        medical_record = self.get_object()
        
        # Check if user has permission to view this record
        if request.user.role == 'patient' and medical_record.patient != request.user:
            return Response(
                {"error": "You can only view your own medical records"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            file_record = medical_record.files.get(id=file_id)
            if file_record.file:
                return FileResponse(
                    file_record.file.open('rb'),
                    as_attachment=True,
                    filename=file_record.file_name
                )
            else:
                raise Http404("File not found")
        except MedicalRecordFile.DoesNotExist:
            raise Http404("File not found")
    
    @extend_schema(
        summary="Delete a file from medical record",
        description="Delete a specific file attached to a medical record",
        parameters=[
            OpenApiParameter(
                name='file_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID of the file to delete',
                required=True
            )
        ],
        tags=["Medical Records"]
    )
    @action(detail=True, methods=['delete'], url_path='files/(?P<file_id>[^/.]+)')
    def delete_file(self, request, pk=None, file_id=None):
        """Delete a specific file from a medical record"""
        medical_record = self.get_object()
        
        # Check if user has permission to modify this record
        if request.user.role == 'patient' and medical_record.patient != request.user:
            return Response(
                {"error": "You can only modify your own medical records"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            file_record = medical_record.files.get(id=file_id)
            # Delete the actual file
            if file_record.file:
                file_record.file.delete()
            # Delete the database record
            file_record.delete()
            return Response(
                {"message": "File deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except MedicalRecordFile.DoesNotExist:
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        summary="Get medical record statistics",
        description="Get statistics about medical records (total count, recent records)",
        tags=["Medical Records"]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics about medical records"""
        queryset = self.get_queryset()
        
        stats = {
            'total_records': queryset.count(),
            'total_with_files': queryset.filter(files__isnull=False).distinct().count(),
            'recent_records': []
        }
        
        # Get 5 most recent records
        recent = queryset.order_by('-created_at')[:5]
        stats['recent_records'] = MedicalRecordSerializer(recent, many=True, context={'request': request}).data
        
        return Response(stats)