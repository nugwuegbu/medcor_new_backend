from django.shortcuts import render
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.hashers import make_password
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Client, Domain, User
from .serializers import (
    ClientSerializer, DomainSerializer, CreateClientSerializer, AdminStatsSerializer,
    PatientSerializer, DoctorSerializer, NurseSerializer,
    CreatePatientSerializer, CreateDoctorSerializer, CreateNurseSerializer,
    PatientListSerializer, DoctorListSerializer, NurseListSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    API viewset for Client (Tenant) management.
    """
    queryset = Client.objects.all().prefetch_related('domain_set')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return the appropriate serializer based on action."""
        if self.action == 'create':
            return CreateClientSerializer
        return ClientSerializer
    
    @action(detail=True, methods=['get'])
    def domains(self, request, pk=None):
        """Get all domains for a specific tenant."""
        client = self.get_object()
        domains = Domain.objects.filter(tenant=client)
        serializer = DomainSerializer(domains, many=True)
        return Response({
            'tenant': client.name,
            'tenant_id': client.id,
            'domains': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive tenant statistics for admin dashboard."""
        # Calculate date ranges
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        
        # Basic counts
        total_tenants = Client.objects.count()
        total_domains = Domain.objects.count()
        active_tenants = Client.objects.filter(created_on__gte=last_month).count()
        
        # Recent tenants
        recent_tenants = Client.objects.order_by('-created_on')[:5]
        recent_tenants_data = ClientSerializer(recent_tenants, many=True).data
        
        # Tenant growth data (last 7 days)
        tenant_growth = {}
        for i in range(7):
            date = (now - timedelta(days=i)).date()
            count = Client.objects.filter(created_on=date).count()
            tenant_growth[date.strftime('%Y-%m-%d')] = count
        
        stats_data = {
            'total_tenants': total_tenants,
            'total_domains': total_domains,
            'active_tenants': active_tenants,
            'recent_tenants': recent_tenants_data,
            'tenant_growth': tenant_growth
        }
        
        serializer = AdminStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class DomainViewSet(viewsets.ModelViewSet):
    """
    API viewset for Domain management.
    """
    queryset = Domain.objects.all().select_related('tenant')
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_tenant(self, request):
        """Get domains grouped by tenant."""
        tenant_id = request.query_params.get('tenant_id')
        if tenant_id:
            domains = Domain.objects.filter(tenant_id=tenant_id).select_related('tenant')
        else:
            domains = Domain.objects.all().select_related('tenant')
            
        serializer = DomainSerializer(domains, many=True)
        return Response(serializer.data)


# Role-Based User ViewSets

@extend_schema_view(
    list=extend_schema(
        summary="List patients",
        description="Retrieve a list of all patients with filtering and search capabilities.",
        tags=['Patients']
    ),
    create=extend_schema(
        summary="Create patient",
        description="Create a new patient user with medical information.",
        tags=['Patients']
    ),
    retrieve=extend_schema(
        summary="Get patient details",
        description="Retrieve detailed information about a specific patient.",
        tags=['Patients']
    ),
    update=extend_schema(
        summary="Update patient",
        description="Update all fields of an existing patient.",
        tags=['Patients']
    ),
    partial_update=extend_schema(
        summary="Partially update patient",
        description="Update specific fields of an existing patient.",
        tags=['Patients']
    ),
    destroy=extend_schema(
        summary="Delete patient",
        description="Delete a patient from the system.",
        tags=['Patients']
    ),
)
class PatientViewSet(viewsets.ModelViewSet):
    """
    API viewset for Patient role users.
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'blood_type', 'insurance_provider']
    search_fields = ['first_name', 'last_name', 'email', 'medical_record_number', 'phone_number']
    ordering_fields = ['first_name', 'last_name', 'date_joined', 'last_login']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to only include patients."""
        return User.objects.filter(role='patient').prefetch_related('tenants')
    
    def get_serializer_class(self):
        """Return the appropriate serializer based on action."""
        if self.action == 'create':
            return CreatePatientSerializer
        elif self.action == 'list':
            return PatientListSerializer
        return PatientSerializer
    
    @extend_schema(
        summary="Get patient statistics",
        description="Retrieve comprehensive statistics about patients.",
        tags=['Patients']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive patient statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total_patients': queryset.count(),
            'active_patients': queryset.filter(is_active=True).count(),
            'new_patients_this_month': queryset.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'by_blood_type': dict(
                queryset.exclude(blood_type__isnull=True)
                .exclude(blood_type='')
                .values_list('blood_type')
                .annotate(count=Count('blood_type'))
            ),
            'recent_patients': PatientListSerializer(
                queryset.order_by('-date_joined')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search patients",
        description="Advanced search across patient fields.",
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search query to match against patient fields',
                required=True,
            ),
        ],
        tags=['Patients']
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for patients."""
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(medical_record_number__icontains=query) |
            Q(phone_number__icontains=query)
        )
        
        serializer = PatientListSerializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List doctors",
        description="Retrieve a list of all doctors with filtering and search capabilities.",
        tags=['Doctors']
    ),
    create=extend_schema(
        summary="Create doctor",
        description="Create a new doctor user with professional information.",
        tags=['Doctors']
    ),
    retrieve=extend_schema(
        summary="Get doctor details",
        description="Retrieve detailed information about a specific doctor.",
        tags=['Doctors']
    ),
    update=extend_schema(
        summary="Update doctor",
        description="Update all fields of an existing doctor.",
        tags=['Doctors']
    ),
    partial_update=extend_schema(
        summary="Partially update doctor",
        description="Update specific fields of an existing doctor.",
        tags=['Doctors']
    ),
    destroy=extend_schema(
        summary="Delete doctor",
        description="Delete a doctor from the system.",
        tags=['Doctors']
    ),
)
class DoctorViewSet(viewsets.ModelViewSet):
    """
    API viewset for Doctor role users.
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['first_name', 'last_name', 'date_joined', 'years_of_experience']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to only include doctors."""
        return User.objects.filter(role='doctor').prefetch_related('tenants')
    
    def get_serializer_class(self):
        """Return the appropriate serializer based on action."""
        if self.action == 'create':
            return CreateDoctorSerializer
        elif self.action == 'list':
            return DoctorListSerializer
        return DoctorSerializer
    
    @extend_schema(
        summary="Get doctor statistics",
        description="Retrieve comprehensive statistics about doctors.",
        tags=['Doctors']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive doctor statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total_doctors': queryset.count(),
            'active_doctors': queryset.filter(is_active=True).count(),
            'new_doctors_this_month': queryset.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'recent_doctors': DoctorListSerializer(
                queryset.order_by('-date_joined')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search doctors",
        description="Advanced search across doctor fields.",
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search query to match against doctor fields',
                required=True,
            ),
        ],
        tags=['Doctors']
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for doctors."""
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone_number__icontains=query)
        )
        
        serializer = DoctorListSerializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List nurses",
        description="Retrieve a list of all nurses with filtering and search capabilities.",
        tags=['Nurses']
    ),
    create=extend_schema(
        summary="Create nurse",
        description="Create a new nurse user with nursing-specific information.",
        tags=['Nurses']
    ),
    retrieve=extend_schema(
        summary="Get nurse details",
        description="Retrieve detailed information about a specific nurse.",
        tags=['Nurses']
    ),
    update=extend_schema(
        summary="Update nurse",
        description="Update all fields of an existing nurse.",
        tags=['Nurses']
    ),
    partial_update=extend_schema(
        summary="Partially update nurse",
        description="Update specific fields of an existing nurse.",
        tags=['Nurses']
    ),
    destroy=extend_schema(
        summary="Delete nurse",
        description="Delete a nurse from the system.",
        tags=['Nurses']
    ),
)
class NurseViewSet(viewsets.ModelViewSet):
    """
    API viewset for Nurse role users.
    """
    serializer_class = NurseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department']
    ordering_fields = ['first_name', 'last_name', 'date_joined', 'department']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to only include nurses."""
        return User.objects.filter(role='nurse').prefetch_related('tenants')
    
    def get_serializer_class(self):
        """Return the appropriate serializer based on action."""
        if self.action == 'create':
            return CreateNurseSerializer
        elif self.action == 'list':
            return NurseListSerializer
        return NurseSerializer
    
    @extend_schema(
        summary="Get nurse statistics",
        description="Retrieve comprehensive statistics about nurses.",
        tags=['Nurses']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive nurse statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total_nurses': queryset.count(),
            'active_nurses': queryset.filter(is_active=True).count(),
            'new_nurses_this_month': queryset.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'recent_nurses': NurseListSerializer(
                queryset.order_by('-date_joined')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search nurses",
        description="Advanced search across nurse fields.",
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search query to match against nurse fields',
                required=True,
            ),
        ],
        tags=['Nurses']
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for nurses."""
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone_number__icontains=query) |
            Q(department__icontains=query)
        )
        
        serializer = NurseListSerializer(queryset, many=True)
        return Response(serializer.data)


