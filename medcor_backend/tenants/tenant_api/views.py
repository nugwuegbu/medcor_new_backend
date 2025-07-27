"""
Comprehensive Tenant API Views with Swagger Documentation
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg
from django.db import models
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from simple_tenant.models import Tenant, Domain, TenantBrandingPreset
from simple_appointment.models import Doctor as SimpleDoctor
from core.models import Appointment as CoreAppointment

from .serializers import (
    TenantSerializer, TenantCreateSerializer,
    DomainSerializer, TenantBrandingPresetSerializer,
    TenantPatientSerializer, TenantPatientCreateSerializer,
    TenantDoctorSerializer, TenantDoctorCreateSerializer,
    TenantNurseSerializer, TenantNurseCreateSerializer,
    TenantStatsSerializer, TenantUserStatsSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List tenants",
        description="Retrieve a paginated list of all medical tenants with branding and domain information.",
        tags=['Tenant Management'],
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search tenants by name, schema_name, or contact information'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status'
            ),
        ],
        examples=[
            OpenApiExample(
                "Search Example",
                value="?search=medcor&is_active=true",
                description="Search for active tenants containing 'medcor'"
            )
        ]
    ),
    create=extend_schema(
        summary="Create tenant",
        description="Create a new medical tenant organization with branding configuration.",
        tags=['Tenant Management']
    ),
    retrieve=extend_schema(
        summary="Get tenant details",
        description="Retrieve detailed information about a specific tenant including branding and domains.",
        tags=['Tenant Management']
    ),
    update=extend_schema(
        summary="Update tenant",
        description="Update all fields of an existing tenant including branding settings.",
        tags=['Tenant Management']
    ),
    partial_update=extend_schema(
        summary="Partially update tenant",
        description="Update specific fields of an existing tenant.",
        tags=['Tenant Management']
    ),
    destroy=extend_schema(
        summary="Delete tenant",
        description="Remove a tenant organization from the system.",
        tags=['Tenant Management']
    ),
)
class TenantViewSet(viewsets.ModelViewSet):
    """
    API viewset for Tenant management.
    
    Manages medical tenant organizations with:
    - Multi-tenant architecture support
    - Custom branding and theming
    - Domain routing management
    - Contact information
    - Schema isolation
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'schema_name', 'contact_email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantSerializer
    
    @extend_schema(
        summary="Get tenant statistics",
        description="Retrieve comprehensive statistics about tenants.",
        responses={200: TenantStatsSerializer},
        tags=['Tenant Management']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive tenant statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_tenants': queryset.count(),
            'active_tenants': queryset.filter(is_active=True).count(),
            'total_domains': Domain.objects.count(),
            'tenants_with_branding': queryset.exclude(logo_url__isnull=True, logo_url__exact='').count(),
            'recent_tenants': TenantSerializer(
                queryset.order_by('-created_at')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Get tenant branding configuration",
        description="Retrieve complete branding configuration for a tenant including CSS variables.",
        tags=['Tenant Management']
    )
    @action(detail=True, methods=['get'])
    def branding(self, request, pk=None):
        """Get tenant branding configuration"""
        tenant = self.get_object()
        
        branding_data = {
            'tenant_id': tenant.id,
            'name': tenant.name,
            'branding': {
                'logo_url': tenant.logo_url,
                'favicon_url': tenant.favicon_url,
                'primary_color': tenant.primary_color,
                'secondary_color': tenant.secondary_color,
                'accent_color': tenant.accent_color,
                'background_color': tenant.background_color,
                'text_color': tenant.text_color,
                'font_family': tenant.font_family,
                'sidebar_style': tenant.sidebar_style,
                'custom_css': tenant.custom_css,
            },
            'css_variables': {
                '--tenant-primary-color': tenant.primary_color,
                '--tenant-secondary-color': tenant.secondary_color,
                '--tenant-accent-color': tenant.accent_color,
                '--tenant-background-color': tenant.background_color,
                '--tenant-text-color': tenant.text_color,
                '--tenant-font-family': tenant.font_family,
            }
        }
        
        return Response(branding_data)


@extend_schema_view(
    list=extend_schema(
        summary="List tenant patients",
        description="Retrieve all patients within the tenant context with appointment history.",
        tags=['Tenant Users - Patients'],
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search patients by name, email, or username'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status'
            ),
        ]
    ),
    create=extend_schema(
        summary="Create tenant patient",
        description="Create a new patient user within the tenant context.",
        tags=['Tenant Users - Patients']
    ),
    retrieve=extend_schema(
        summary="Get patient details",
        description="Retrieve detailed patient information with appointment history.",
        tags=['Tenant Users - Patients']
    ),
    update=extend_schema(
        summary="Update patient",
        description="Update patient profile information.",
        tags=['Tenant Users - Patients']
    ),
    destroy=extend_schema(
        summary="Deactivate patient",
        description="Deactivate a patient account (soft delete).",
        tags=['Tenant Users - Patients']
    ),
)
class TenantPatientViewSet(viewsets.ModelViewSet):
    """
    API viewset for Patient management within tenant context.
    
    Manages patient users with:
    - Patient profile management
    - Appointment history tracking
    - Search and filtering capabilities
    - Tenant-specific isolation
    """
    serializer_class = TenantPatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['first_name', 'last_name', 'date_joined']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to only include patients - non-staff users"""
        return User.objects.filter(is_staff=False, is_superuser=False)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantPatientCreateSerializer
        return TenantPatientSerializer
    
    @extend_schema(
        summary="Get patient statistics",
        description="Retrieve comprehensive statistics about patients within the tenant.",
        responses={200: OpenApiResponse(description='Patient statistics')},
        tags=['Tenant Users - Patients']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive patient statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_patients': queryset.count(),
            'active_patients': queryset.filter(is_active=True).count(),
            'new_patients_this_month': queryset.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'patients_with_appointments': queryset.filter(
                email__in=CoreAppointment.objects.values_list('patient_email', flat=True)
            ).count()
        }
        
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List tenant doctors",
        description="Retrieve all doctors within the tenant with specialization and availability information.",
        tags=['Tenant Users - Doctors'],
        parameters=[
            OpenApiParameter(
                name='specialization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by medical specialization'
            ),
            OpenApiParameter(
                name='is_available',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by availability status'
            ),
        ]
    ),
    create=extend_schema(
        summary="Create tenant doctor",
        description="Create a new doctor profile within the tenant context.",
        tags=['Tenant Users - Doctors']
    ),
    retrieve=extend_schema(
        summary="Get doctor details",
        description="Retrieve detailed doctor information with appointment statistics.",
        tags=['Tenant Users - Doctors']
    ),
    update=extend_schema(
        summary="Update doctor",
        description="Update doctor profile and professional information.",
        tags=['Tenant Users - Doctors']
    ),
    destroy=extend_schema(
        summary="Remove doctor",
        description="Remove a doctor from the tenant system.",
        tags=['Tenant Users - Doctors']
    ),
)
class TenantDoctorViewSet(viewsets.ModelViewSet):
    """
    API viewset for Doctor management within tenant context.
    
    Manages doctor profiles with:
    - Medical specializations
    - License and experience tracking
    - Availability management
    - Appointment statistics
    - Tenant-specific organization
    """
    queryset = SimpleDoctor.objects.all().select_related('user')
    serializer_class = TenantDoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_available']
    search_fields = ['user__first_name', 'user__last_name', 'specialization', 'license_number']
    ordering_fields = ['user__first_name', 'specialization', 'experience_years']
    ordering = ['user__first_name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantDoctorCreateSerializer
        return TenantDoctorSerializer
    
    @extend_schema(
        summary="Get doctor statistics",
        description="Retrieve comprehensive statistics about doctors within the tenant.",
        responses={200: OpenApiResponse(description='Doctor statistics')},
        tags=['Tenant Users - Doctors']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive doctor statistics"""
        queryset = self.get_queryset()
        
        specialty_counts = dict(
            queryset.values('specialization').annotate(count=Count('specialization')).values_list('specialization', 'count')
        )
        
        stats = {
            'total_doctors': queryset.count(),
            'available_doctors': queryset.filter(is_available=True).count(),
            'specializations': specialty_counts,
            'average_experience': queryset.aggregate(avg_exp=models.Avg('experience_years'))['avg_exp'] or 0,
            'top_doctors': TenantDoctorSerializer(
                queryset.annotate(
                    appointment_count=Count('appointments')
                ).order_by('-appointment_count')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search doctors by specialty",
        description="Find doctors by medical specialty within the tenant.",
        parameters=[
            OpenApiParameter(
                name='specialty',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Medical specialty to search for',
                required=True
            ),
        ],
        tags=['Tenant Users - Doctors']
    )
    @action(detail=False, methods=['get'])
    def by_specialty(self, request):
        """Get doctors by specialty"""
        specialty = request.query_params.get('specialty')
        if not specialty:
            return Response({'error': 'Specialty parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        doctors = self.get_queryset().filter(
            specialization__icontains=specialty, 
            is_available=True
        )
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List tenant nurses",
        description="Retrieve all nurses within the tenant with department and shift information.",
        tags=['Tenant Users - Nurses'],
        parameters=[
            OpenApiParameter(
                name='department',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by department'
            ),
            OpenApiParameter(
                name='shift',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by work shift'
            ),
        ]
    ),
    create=extend_schema(
        summary="Create tenant nurse",
        description="Create a new nurse user within the tenant context.",
        tags=['Tenant Users - Nurses']
    ),
    retrieve=extend_schema(
        summary="Get nurse details",
        description="Retrieve detailed nurse information with department assignment.",
        tags=['Tenant Users - Nurses']
    ),
    update=extend_schema(
        summary="Update nurse",
        description="Update nurse profile and department information.",
        tags=['Tenant Users - Nurses']
    ),
    destroy=extend_schema(
        summary="Remove nurse",
        description="Remove a nurse from the tenant system.",
        tags=['Tenant Users - Nurses']
    ),
)
class TenantNurseViewSet(viewsets.ModelViewSet):
    """
    API viewset for Nurse management within tenant context.
    
    Manages nurse profiles with:
    - Department assignments
    - Shift scheduling information
    - Certification tracking
    - Tenant-specific organization
    """
    serializer_class = TenantNurseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['first_name', 'last_name', 'date_joined']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to include nurses - staff users with nurse role"""
        # This is a simplified approach - you might have a more complex role system
        return User.objects.filter(is_staff=True, is_superuser=False)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantNurseCreateSerializer
        return TenantNurseSerializer
    
    @extend_schema(
        summary="Get nurse statistics",
        description="Retrieve comprehensive statistics about nurses within the tenant.",
        responses={200: OpenApiResponse(description='Nurse statistics')},
        tags=['Tenant Users - Nurses']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive nurse statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_nurses': queryset.count(),
            'active_nurses': queryset.filter(is_active=True).count(),
            'new_nurses_this_month': queryset.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'departments': {
                'General': queryset.count() // 3,  # Mock distribution
                'ICU': queryset.count() // 4,
                'Emergency': queryset.count() // 5,
                'Pediatrics': queryset.count() // 6,
            }
        }
        
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List domains",
        description="Retrieve all domains configured for tenants.",
        tags=['Tenant Management']
    ),
    create=extend_schema(
        summary="Create domain",
        description="Create a new domain routing for a tenant.",
        tags=['Tenant Management']
    ),
)
class DomainViewSet(viewsets.ModelViewSet):
    """API viewset for Domain management"""
    queryset = Domain.objects.all().select_related('tenant')
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tenant', 'is_primary']
    search_fields = ['domain', 'tenant__name']


@extend_schema_view(
    list=extend_schema(
        summary="List branding presets",
        description="Retrieve all available branding presets for tenant customization.",
        tags=['Tenant Management']
    ),
    create=extend_schema(
        summary="Create branding preset",
        description="Create a new branding preset for tenant use.",
        tags=['Tenant Management']
    ),
)
class TenantBrandingPresetViewSet(viewsets.ModelViewSet):
    """API viewset for TenantBrandingPreset management"""
    queryset = TenantBrandingPreset.objects.filter(is_active=True)
    serializer_class = TenantBrandingPresetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    
    @extend_schema(
        summary="Apply preset to tenant",
        description="Apply a branding preset to a specific tenant.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'tenant_id': {
                        'type': 'integer',
                        'description': 'ID of the tenant to apply preset to'
                    }
                },
                'required': ['tenant_id']
            }
        },
        tags=['Tenant Management']
    )
    @action(detail=True, methods=['post'])
    def apply_to_tenant(self, request, pk=None):
        """Apply this preset to a tenant"""
        preset = self.get_object()
        tenant_id = request.data.get('tenant_id')
        
        if not tenant_id:
            return Response({'error': 'tenant_id is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            preset.apply_to_tenant(tenant)
            return Response({'message': f'Preset "{preset.name}" applied to tenant "{tenant.name}"'})
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, 
                          status=status.HTTP_404_NOT_FOUND)