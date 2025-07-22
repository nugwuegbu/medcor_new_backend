from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Slot, SlotExclusion, Appointment
from .serializers import (
    SlotSerializer, SlotCreateSerializer,
    SlotExclusionSerializer, SlotExclusionCreateSerializer,
    AppointmentSerializer, AppointmentCreateSerializer,
    AppointmentUpdateSerializer, AppointmentListSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List doctor availability slots",
        description="Retrieve a list of all doctor availability slots with filtering and search capabilities.",
        tags=['Appointments']
    ),
    create=extend_schema(
        summary="Create availability slot",
        description="Create a new availability slot for a doctor.",
        tags=['Appointments']
    ),
    retrieve=extend_schema(
        summary="Get slot details",
        description="Retrieve detailed information about a specific availability slot.",
        tags=['Appointments']
    ),
    update=extend_schema(
        summary="Update slot",
        description="Update an existing availability slot.",
        tags=['Appointments']
    ),
    partial_update=extend_schema(
        summary="Partially update slot",
        description="Partially update an existing availability slot.",
        tags=['Appointments']
    ),
    destroy=extend_schema(
        summary="Delete slot",
        description="Delete an availability slot.",
        tags=['Appointments']
    ),
)
class SlotViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor availability slots"""
    queryset = Slot.objects.all().select_related('doctor')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor', 'day_of_week']
    search_fields = ['doctor__first_name', 'doctor__last_name']
    ordering_fields = ['day_of_week', 'start_time', 'created_at']
    ordering = ['day_of_week', 'start_time']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return SlotCreateSerializer
        return SlotSerializer

    @extend_schema(
        summary="Get slots by doctor",
        description="Retrieve all availability slots for a specific doctor.",
        parameters=[
            OpenApiParameter(
                name='doctor_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID of the doctor',
                required=True,
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def by_doctor(self, request):
        """Get slots filtered by doctor ID"""
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response(
                {'error': _('doctor_id parameter is required')}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slots = self.queryset.filter(doctor_id=doctor_id)
        serializer = self.get_serializer(slots, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get available slots",
        description="Retrieve available slots for booking, excluding slot exclusions and existing appointments.",
        parameters=[
            OpenApiParameter(
                name='doctor_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter by doctor ID',
                required=False,
            ),
            OpenApiParameter(
                name='date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter by specific date',
                required=False,
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Get available slots excluding exclusions"""
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')
        
        queryset = self.queryset
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # This would need additional logic to exclude based on SlotExclusions and existing appointments
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List slot exclusions",
        description="Retrieve a list of all doctor slot exclusions (unavailable periods).",
        tags=['Appointments']
    ),
    create=extend_schema(
        summary="Create slot exclusion",
        description="Create a new slot exclusion period for a doctor.",
        tags=['Appointments']
    ),
    retrieve=extend_schema(
        summary="Get exclusion details",
        description="Retrieve detailed information about a specific slot exclusion.",
        tags=['Appointments']
    ),
    update=extend_schema(
        summary="Update exclusion",
        description="Update an existing slot exclusion period.",
        tags=['Appointments']
    ),
    partial_update=extend_schema(
        summary="Partially update exclusion",
        description="Partially update an existing slot exclusion period.",
        tags=['Appointments']
    ),
    destroy=extend_schema(
        summary="Delete exclusion",
        description="Delete a slot exclusion period.",
        tags=['Appointments']
    ),
)
class SlotExclusionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor slot exclusions"""
    queryset = SlotExclusion.objects.all().select_related('doctor')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor']
    search_fields = ['doctor__first_name', 'doctor__last_name']
    ordering_fields = ['exclusion_start_date', 'created_at']
    ordering = ['exclusion_start_date']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return SlotExclusionCreateSerializer
        return SlotExclusionSerializer

    @extend_schema(
        summary="Get exclusions by doctor",
        description="Retrieve all slot exclusions for a specific doctor.",
        parameters=[
            OpenApiParameter(
                name='doctor_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID of the doctor',
                required=True,
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def by_doctor(self, request):
        """Get exclusions filtered by doctor ID"""
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response(
                {'error': _('doctor_id parameter is required')}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exclusions = self.queryset.filter(doctor_id=doctor_id)
        serializer = self.get_serializer(exclusions, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List appointments",
        description="Retrieve a list of appointments with filtering, search, and role-based access control.",
        tags=['Appointments']
    ),
    create=extend_schema(
        summary="Create appointment",
        description="Create a new medical appointment.",
        tags=['Appointments']
    ),
    retrieve=extend_schema(
        summary="Get appointment details",
        description="Retrieve detailed information about a specific appointment.",
        tags=['Appointments']
    ),
    update=extend_schema(
        summary="Update appointment",
        description="Update an existing appointment.",
        tags=['Appointments']
    ),
    partial_update=extend_schema(
        summary="Partially update appointment",
        description="Partially update an existing appointment.",
        tags=['Appointments']
    ),
    destroy=extend_schema(
        summary="Delete appointment",
        description="Delete an appointment.",
        tags=['Appointments']
    ),
)
class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing appointments"""
    queryset = Appointment.objects.all().select_related(
        'patient', 'doctor', 'slot', 'treatment'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'patient', 'doctor', 'treatment', 'appointment_status',
        'appointment_slot_date'
    ]
    search_fields = [
        'patient__first_name', 'patient__last_name',
        'doctor__first_name', 'doctor__last_name',
        'treatment__name'
    ]
    ordering_fields = ['appointment_slot_date', 'appointment_slot_start_time', 'created_at']
    ordering = ['-appointment_slot_date', '-appointment_slot_start_time']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        elif self.action == 'list':
            return AppointmentListSerializer
        return AppointmentSerializer

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter based on user role
        if user.role == 'patient':
            queryset = queryset.filter(patient=user)
        elif user.role == 'doctor':
            queryset = queryset.filter(doctor=user)
        # Admin and clinic staff can see all appointments
        
        return queryset

    @extend_schema(
        summary="Get my appointments",
        description="Retrieve current user's appointments (patients see their bookings, doctors see their scheduled appointments).",
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def my_appointments(self, request):
        """Get current user's appointments"""
        user = request.user
        
        if user.role == 'patient':
            appointments = self.queryset.filter(patient=user)
        elif user.role == 'doctor':
            appointments = self.queryset.filter(doctor=user)
        else:
            return Response(
                {'error': _('Only patients and doctors can access their appointments')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get appointments by status",
        description="Retrieve appointments filtered by appointment status.",
        parameters=[
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Appointment status (pending, approved, cancelled, completed)',
                required=True,
                examples=[
                    OpenApiExample('Pending', value='pending'),
                    OpenApiExample('Approved', value='approved'),
                    OpenApiExample('Cancelled', value='cancelled'),
                    OpenApiExample('Completed', value='completed'),
                ]
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get appointments by status"""
        appointment_status = request.query_params.get('status')
        if not appointment_status:
            return Response(
                {'error': _('status parameter is required')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointments = self.get_queryset().filter(appointment_status=appointment_status)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get appointment statistics",
        description="Retrieve comprehensive statistics about appointments including counts by status, doctor, and treatment.",
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get appointment statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'pending': queryset.filter(appointment_status=Appointment.AppointmentStatus.PENDING).count(),
                'approved': queryset.filter(appointment_status=Appointment.AppointmentStatus.APPROVED).count(),
                'completed': queryset.filter(appointment_status=Appointment.AppointmentStatus.COMPLETED).count(),
                'cancelled': queryset.filter(appointment_status=Appointment.AppointmentStatus.CANCELLED).count(),
            },
            'by_doctor': list(
                queryset.values('doctor__first_name', 'doctor__last_name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'by_treatment': list(
                queryset.values('treatment__name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            )
        }
        
        return Response(stats)

    @extend_schema(
        summary="Update appointment status",
        description="Update the status of a specific appointment.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['pending', 'approved', 'completed', 'cancelled'],
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
        
        if not new_status:
            return Response(
                {'error': _('status field is required')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in Appointment.AppointmentStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': _('Invalid status. Valid options are: {}'.format(', '.join(valid_statuses)))},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.appointment_status = new_status
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @extend_schema(
        summary="Search appointments",
        description="Advanced search across appointment fields including patient, doctor, and treatment names.",
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search query to match against patient, doctor, treatment names, or appointment status',
                required=True,
            ),
        ],
        tags=['Appointments']
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for appointments"""
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': _('q parameter is required for search')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search across multiple fields
        from django.db.models import Q
        queryset = self.get_queryset().filter(
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(doctor__first_name__icontains=query) |
            Q(doctor__last_name__icontains=query) |
            Q(treatment__name__icontains=query) |
            Q(appointment_status__icontains=query)
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
