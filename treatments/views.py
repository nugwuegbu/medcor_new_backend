"""
ViewSets for Treatment management.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from .models import Treatment, Prescription
from .serializers import (
    TreatmentSerializer, TreatmentListSerializer,
    CreateTreatmentSerializer, PrescriptionSerializer
)


class TreatmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Treatment CRUD operations.
    
    Provides endpoints for:
    - List all treatments (with filtering)
    - Create new treatment
    - Retrieve treatment details
    - Update treatment
    - Delete treatment
    - Custom actions for treatment management
    """
    queryset = Treatment.objects.all()
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'treatment_type', 'patient', 'prescribed_by', 'start_date']
    search_fields = ['name', 'description', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['created_at', 'start_date', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter treatments by hospital/tenant."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by hospital if user has one
        if hasattr(user, 'hospital') and user.hospital:
            queryset = queryset.filter(hospital=user.hospital)
        
        # Additional filtering based on user role
        if user.role == 'PATIENT':
            queryset = queryset.filter(patient=user)
        elif user.role == 'DOCTOR':
            # Doctors can see treatments they prescribed or for their patients
            queryset = queryset.filter(
                Q(prescribed_by=user) | Q(patient__doctor=user)
            )
        
        return queryset.select_related('patient', 'prescribed_by')
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return TreatmentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CreateTreatmentSerializer
        return TreatmentSerializer
    
    def perform_create(self, serializer):
        """Set hospital and prescribed_by when creating treatment."""
        hospital = None
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            hospital = self.request.user.hospital
        
        serializer.save(
            hospital=hospital,
            prescribed_by=self.request.user if self.request.user.role == 'DOCTOR' else None
        )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active treatments."""
        queryset = self.get_queryset().filter(
            status__in=['PLANNED', 'IN_PROGRESS']
        )
        serializer = TreatmentListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get treatments grouped by patient."""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response(
                {'error': 'patient_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(patient_id=patient_id)
        serializer = TreatmentSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a treatment as completed."""
        treatment = self.get_object()
        treatment.status = 'COMPLETED'
        treatment.completed_at = timezone.now()
        treatment.save()
        serializer = TreatmentSerializer(treatment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a treatment."""
        treatment = self.get_object()
        treatment.status = 'CANCELLED'
        treatment.save()
        serializer = TreatmentSerializer(treatment)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get treatment statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total_treatments': queryset.count(),
            'active_treatments': queryset.filter(status__in=['PLANNED', 'IN_PROGRESS']).count(),
            'completed_treatments': queryset.filter(status='COMPLETED').count(),
            'treatments_by_type': dict(
                queryset.values('treatment_type').annotate(count=Count('id')).values_list('treatment_type', 'count')
            ),
            'treatments_by_status': dict(
                queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')
            )
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get', 'post'])
    def prescriptions(self, request, pk=None):
        """Manage prescriptions for a treatment."""
        treatment = self.get_object()
        
        if request.method == 'GET':
            prescriptions = treatment.prescriptions.all()
            serializer = PrescriptionSerializer(prescriptions, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = PrescriptionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(treatment=treatment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Prescription management.
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'treatment', 'start_date']
    search_fields = ['medication_name', 'generic_name']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter prescriptions by hospital/tenant."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by hospital through treatment
        if hasattr(user, 'hospital') and user.hospital:
            queryset = queryset.filter(treatment__hospital=user.hospital)
        
        # Filter by user role
        if user.role == 'PATIENT':
            queryset = queryset.filter(treatment__patient=user)
        elif user.role == 'DOCTOR':
            queryset = queryset.filter(treatment__prescribed_by=user)
        
        return queryset.select_related('treatment__patient', 'treatment__prescribed_by')
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active prescriptions."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = PrescriptionSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a prescription."""
        prescription = self.get_object()
        prescription.is_active = False
        prescription.save()
        serializer = PrescriptionSerializer(prescription)
        return Response(serializer.data)
