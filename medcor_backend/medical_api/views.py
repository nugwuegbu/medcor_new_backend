"""
Comprehensive Medical API Views with Swagger Documentation
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from core.models import Doctor as CoreDoctor, Appointment as CoreAppointment
from simple_treatment.models import Treatment
from simple_appointment.models import Doctor as SimpleDoctor, Appointment as SimpleAppointment

from .serializers import (
    PatientSerializer, PatientCreateSerializer,
    CoreDoctorSerializer, CoreDoctorCreateSerializer,
    TreatmentSerializer, TreatmentCreateSerializer,
    CoreAppointmentSerializer, CoreAppointmentCreateSerializer,
    SimpleAppointmentSerializer, SimpleAppointmentCreateSerializer,
    SimpleDoctorSerializer, SimpleDoctorCreateSerializer,
    DoctorStatsSerializer, AppointmentStatsSerializer, TreatmentStatsSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List patients",
        description="Retrieve a paginated list of all patients with filtering and search capabilities.",
        tags=['Patients'],
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
        ],
        examples=[
            OpenApiExample(
                "Search Example",
                value="?search=john&is_active=true",
                description="Search for active patients named 'john'"
            )
        ]
    ),
    create=extend_schema(
        summary="Create patient",
        description="Create a new patient user account with authentication credentials.",
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
        description="Deactivate a patient account (soft delete).",
        tags=['Patients']
    ),
)
class PatientViewSet(viewsets.ModelViewSet):
    """
    API viewset for Patient management.
    
    Provides CRUD operations for patient users including:
    - User account management
    - Patient profile information
    - Search and filtering capabilities
    - Statistics and analytics
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'first_name', 'last_name', 'date_joined']
    ordering = ['first_name', 'last_name']
    
    def get_queryset(self):
        """Filter users to only include patients - customize based on your role system"""
        # This assumes you have a way to identify patient users
        # You might have a role field or use groups
        return User.objects.filter(is_staff=False, is_superuser=False)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer
    
    @extend_schema(
        summary="Get patient statistics",
        description="Retrieve comprehensive statistics about patients.",
        responses={200: OpenApiResponse(description='Patient statistics')},
        tags=['Patients']
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
            'recent_patients': PatientSerializer(
                queryset.order_by('-date_joined')[:5], many=True
            ).data
        }
        
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List doctors",
        description="Retrieve a paginated list of all doctors with their specializations and availability.",
        tags=['Doctors']
    ),
    create=extend_schema(
        summary="Create doctor",
        description="Create a new doctor profile with medical specialization and experience.",
        tags=['Doctors']
    ),
    retrieve=extend_schema(
        summary="Get doctor details",
        description="Retrieve detailed information about a specific doctor including bio and avatar.",
        tags=['Doctors']
    ),
    update=extend_schema(
        summary="Update doctor",
        description="Update all fields of an existing doctor profile.",
        tags=['Doctors']
    ),
    partial_update=extend_schema(
        summary="Partially update doctor",
        description="Update specific fields of an existing doctor profile.",
        tags=['Doctors']
    ),
    destroy=extend_schema(
        summary="Delete doctor",
        description="Remove a doctor profile from the system.",
        tags=['Doctors']
    ),
)
class CoreDoctorViewSet(viewsets.ModelViewSet):
    """
    API viewset for Core Doctor management.
    
    Manages doctor profiles with:
    - Medical specializations
    - Experience and education
    - Avatar integration for HeyGen
    - Availability status
    - Appointment relationships
    """
    queryset = CoreDoctor.objects.all()
    serializer_class = CoreDoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['specialty', 'available']
    search_fields = ['name', 'specialty', 'bio']
    ordering_fields = ['name', 'specialty', 'experience']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CoreDoctorCreateSerializer
        return CoreDoctorSerializer
    
    @extend_schema(
        summary="Get doctor statistics",
        description="Retrieve comprehensive statistics about doctors including specializations.",
        responses={200: DoctorStatsSerializer},
        tags=['Doctors']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive doctor statistics"""
        queryset = self.get_queryset()
        
        specialty_counts = dict(
            queryset.values('specialty').annotate(count=Count('specialty')).values_list('specialty', 'count')
        )
        
        stats = {
            'total_doctors': queryset.count(),
            'available_doctors': queryset.filter(available=True).count(),
            'specializations': specialty_counts,
            'top_doctors': CoreDoctorSerializer(
                queryset.annotate(
                    appointment_count=Count('appointments')
                ).order_by('-appointment_count')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search doctors by specialty",
        description="Find doctors by medical specialty.",
        parameters=[
            OpenApiParameter(
                name='specialty',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Medical specialty to search for',
                required=True
            ),
        ],
        tags=['Doctors']
    )
    @action(detail=False, methods=['get'])
    def by_specialty(self, request):
        """Get doctors by specialty"""
        specialty = request.query_params.get('specialty')
        if not specialty:
            return Response({'error': 'Specialty parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        doctors = self.get_queryset().filter(specialty__icontains=specialty, available=True)
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List treatments",
        description="Retrieve a paginated list of all medical treatments with costs and descriptions.",
        tags=['Treatments']
    ),
    create=extend_schema(
        summary="Create treatment",
        description="Create a new medical treatment with detailed description and pricing.",
        tags=['Treatments']
    ),
    retrieve=extend_schema(
        summary="Get treatment details",
        description="Retrieve detailed information about a specific medical treatment.",
        tags=['Treatments']
    ),
    update=extend_schema(
        summary="Update treatment",
        description="Update all fields of an existing treatment.",
        tags=['Treatments']
    ),
    partial_update=extend_schema(
        summary="Partially update treatment",
        description="Update specific fields of an existing treatment.",
        tags=['Treatments']
    ),
    destroy=extend_schema(
        summary="Delete treatment",
        description="Remove a treatment from the available services.",
        tags=['Treatments']
    ),
)
class TreatmentViewSet(viewsets.ModelViewSet):
    """
    API viewset for Treatment management.
    
    Manages medical treatments with:
    - Rich text descriptions
    - Cost and duration information
    - Active/inactive status
    - Creator tracking
    - Appointment relationships
    """
    queryset = Treatment.objects.all().select_related('created_by')
    serializer_class = TreatmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'cost', 'duration_minutes', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TreatmentCreateSerializer
        return TreatmentSerializer
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    @extend_schema(
        summary="Get treatment statistics",
        description="Retrieve comprehensive statistics about treatments including costs.",
        responses={200: TreatmentStatsSerializer},
        tags=['Treatments']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive treatment statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_treatments': queryset.count(),
            'active_treatments': queryset.filter(is_active=True).count(),
            'average_cost': queryset.aggregate(avg_cost=Avg('cost'))['avg_cost'] or 0,
            'popular_treatments': TreatmentSerializer(
                queryset.annotate(
                    appointment_count=Count('appointments')
                ).order_by('-appointment_count')[:5], many=True
            ).data
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Search treatments by price range",
        description="Find treatments within a specific price range.",
        parameters=[
            OpenApiParameter(
                name='min_cost',
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description='Minimum treatment cost'
            ),
            OpenApiParameter(
                name='max_cost',
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                description='Maximum treatment cost'
            ),
        ],
        tags=['Treatments']
    )
    @action(detail=False, methods=['get'])
    def by_price_range(self, request):
        """Get treatments by price range"""
        min_cost = request.query_params.get('min_cost')
        max_cost = request.query_params.get('max_cost')
        
        queryset = self.get_queryset().filter(is_active=True)
        
        if min_cost:
            queryset = queryset.filter(cost__gte=min_cost)
        if max_cost:
            queryset = queryset.filter(cost__lte=max_cost)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List appointments",
        description="Retrieve a paginated list of all appointments with patient and doctor information.",
        tags=['Appointments']
    ),
    create=extend_schema(
        summary="Create appointment",
        description="Schedule a new appointment between a patient and doctor.",
        tags=['Appointments']
    ),
    retrieve=extend_schema(
        summary="Get appointment details",
        description="Retrieve detailed information about a specific appointment.",
        tags=['Appointments']
    ),
    update=extend_schema(
        summary="Update appointment",
        description="Update all fields of an existing appointment.",
        tags=['Appointments']
    ),
    partial_update=extend_schema(
        summary="Partially update appointment",
        description="Update specific fields of an existing appointment (e.g., status).",
        tags=['Appointments']
    ),
    destroy=extend_schema(
        summary="Cancel appointment",
        description="Cancel an existing appointment.",
        tags=['Appointments']
    ),
)
class CoreAppointmentViewSet(viewsets.ModelViewSet):
    """
    API viewset for Core Appointment management.
    
    Manages patient appointments with:
    - Patient contact information
    - Doctor assignments
    - Appointment scheduling
    - Status tracking
    - Search and filtering
    """
    queryset = CoreAppointment.objects.all().select_related('doctor')
    serializer_class = CoreAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'doctor']
    search_fields = ['patient_name', 'patient_email', 'doctor__name', 'reason']
    ordering_fields = ['appointment_date', 'created_at', 'patient_name']
    ordering = ['-appointment_date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CoreAppointmentCreateSerializer
        return CoreAppointmentSerializer
    
    @extend_schema(
        summary="Get appointment statistics",
        description="Retrieve comprehensive statistics about appointments including status breakdown.",
        responses={200: AppointmentStatsSerializer},
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive appointment statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        stats = {
            'total_appointments': queryset.count(),
            'pending_appointments': queryset.filter(status='pending').count(),
            'confirmed_appointments': queryset.filter(status='confirmed').count(),
            'completed_appointments': queryset.filter(status='completed').count(),
            'cancelled_appointments': queryset.filter(status='cancelled').count(),
            'today_appointments': queryset.filter(appointment_date__date=today).count(),
            'this_week_appointments': queryset.filter(appointment_date__date__gte=week_ago).count(),
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Update appointment status",
        description="Update the status of an appointment (confirm, complete, cancel).",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['pending', 'confirmed', 'completed', 'cancelled'],
                        'description': 'New appointment status'
                    }
                },
                'required': ['status']
            }
        },
        tags=['Appointments']
    )
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update appointment status"""
        appointment = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['pending', 'confirmed', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = new_status
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get appointments by date range",
        description="Retrieve appointments within a specific date range.",
        parameters=[
            OpenApiParameter(
                name='start_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Start date (YYYY-MM-DD)',
                required=True
            ),
            OpenApiParameter(
                name='end_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='End date (YYYY-MM-DD)',
                required=True
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """Get appointments by date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({'error': 'Both start_date and end_date are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            appointments = self.get_queryset().filter(
                appointment_date__date__range=[start_date, end_date]
            )
            serializer = self.get_serializer(appointments, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                          status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        summary="List simple appointments",
        description="Retrieve appointments with treatment and doctor information from simplified model.",
        tags=['Simple Appointments']
    ),
    create=extend_schema(
        summary="Create simple appointment",
        description="Create a new appointment with treatment selection.",
        tags=['Simple Appointments']
    ),
)
class SimpleAppointmentViewSet(viewsets.ModelViewSet):
    """
    API viewset for Simple Appointment management (with treatments).
    """
    queryset = SimpleAppointment.objects.all().select_related('doctor__user', 'treatment')
    serializer_class = SimpleAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'doctor', 'treatment']
    search_fields = ['patient_name', 'patient_email', 'doctor__user__first_name', 'treatment__name']
    ordering = ['-appointment_date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SimpleAppointmentCreateSerializer
        return SimpleAppointmentSerializer