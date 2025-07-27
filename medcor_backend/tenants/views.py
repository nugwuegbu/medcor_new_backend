from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Q

from .models import Client, Domain, User
from .serializers import (
    ClientSerializer, DomainSerializer, UserBaseSerializer,
    DoctorSerializer, PatientSerializer, NurseSerializer,
    AdminSerializer, UserCreateSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List Hospitals/Clinics",
        description="Retrieve a list of all hospitals and clinics in the system",
        tags=["Hospitals/Clinics"]
    ),
    create=extend_schema(
        summary="Create Hospital/Clinic",
        description="Create a new hospital or clinic",
        tags=["Hospitals/Clinics"]
    ),
    retrieve=extend_schema(
        summary="Get Hospital/Clinic Details",
        description="Retrieve detailed information about a specific hospital or clinic",
        tags=["Hospitals/Clinics"]
    ),
    update=extend_schema(
        summary="Update Hospital/Clinic",
        description="Update hospital or clinic information",
        tags=["Hospitals/Clinics"]
    ),
    destroy=extend_schema(
        summary="Delete Hospital/Clinic",
        description="Delete a hospital or clinic",
        tags=["Hospitals/Clinics"]
    )
)
class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Hospitals/Clinics (Tenants)
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'schema_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Get Hospital/Clinic Statistics",
        description="Get statistics for a specific hospital or clinic",
        tags=["Hospitals/Clinics"]
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        client = self.get_object()
        stats = {
            'name': client.name,
            'schema_name': client.schema_name,
            'total_users': User.objects.count(),
            'total_doctors': User.objects.filter(role='doctor').count(),
            'total_patients': User.objects.filter(role='patient').count(),
            'total_nurses': User.objects.filter(role='nurse').count(),
            'created_at': client.created_at,
            'updated_at': client.updated_at
        }
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List Domains",
        description="Retrieve a list of all domains",
        tags=["Domains"]
    ),
    create=extend_schema(
        summary="Create Domain",
        description="Create a new domain",
        tags=["Domains"]
    )
)
class DomainViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Domains
    """
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tenant', 'is_primary']
    search_fields = ['domain']


@extend_schema_view(
    list=extend_schema(
        summary="List Doctors",
        description="Retrieve a list of all doctors",
        tags=["Users - Doctors"]
    ),
    create=extend_schema(
        summary="Create Doctor",
        description="Create a new doctor account",
        tags=["Users - Doctors"]
    ),
    retrieve=extend_schema(
        summary="Get Doctor Details",
        description="Retrieve detailed information about a specific doctor",
        tags=["Users - Doctors"]
    )
)
class DoctorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Doctor users
    """
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'role']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name']

    def get_queryset(self):
        return User.objects.filter(role='doctor')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return DoctorSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List Patients",
        description="Retrieve a list of all patients",
        tags=["Users - Patients"]
    ),
    create=extend_schema(
        summary="Create Patient",
        description="Create a new patient account",
        tags=["Users - Patients"]
    )
)
class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Patient users
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'blood_type']
    search_fields = ['first_name', 'last_name', 'email', 'medical_record_number']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name']

    def get_queryset(self):
        return User.objects.filter(role='patient')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return PatientSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List Nurses",
        description="Retrieve a list of all nurses",
        tags=["Users - Nurses"]
    ),
    create=extend_schema(
        summary="Create Nurse",
        description="Create a new nurse account",
        tags=["Users - Nurses"]
    )
)
class NurseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Nurse users
    """
    serializer_class = NurseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name']

    def get_queryset(self):
        return User.objects.filter(role='nurse')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return NurseSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List Admins",
        description="Retrieve a list of all admin users",
        tags=["Users - Admins"]
    ),
    create=extend_schema(
        summary="Create Admin",
        description="Create a new admin account",
        tags=["Users - Admins"]
    )
)
class AdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Admin users
    """
    serializer_class = AdminSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff', 'is_superuser']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name']

    def get_queryset(self):
        return User.objects.filter(role='admin')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return AdminSerializer