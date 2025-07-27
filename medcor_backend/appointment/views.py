from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Count, Q
from datetime import datetime, timedelta

from .models import Slot, SlotExclusion, Appointment
from .serializers import (
    SlotSerializer, SlotExclusionSerializer, AppointmentSerializer,
    AppointmentDetailSerializer, AppointmentCreateSerializer, AppointmentUpdateSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List Doctor Slots",
        description="Retrieve a list of all available doctor time slots",
        tags=["Doctor Slots"]
    ),
    create=extend_schema(
        summary="Create Doctor Slot",
        description="Create a new time slot for a doctor",
        tags=["Doctor Slots"]
    ),
    retrieve=extend_schema(
        summary="Get Slot Details",
        description="Retrieve detailed information about a specific slot",
        tags=["Doctor Slots"]
    )
)
class SlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Doctor Time Slots
    """
    queryset = Slot.objects.all()
    serializer_class = SlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor', 'day_of_week']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'doctor__email']
    ordering_fields = ['day_of_week', 'start_time', 'end_time']
    ordering = ['day_of_week', 'start_time']

    @extend_schema(
        summary="Get Available Slots",
        description="Get available slots for a specific doctor on a specific date",
        tags=["Doctor Slots"]
    )
    @action(detail=False, methods=['get'])
    def available(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')
        
        if not doctor_id or not date:
            return Response(
                {'error': 'doctor_id and date parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d').date()
            day_of_week = target_date.isoweekday()
            
            # Get doctor's slots for that day
            slots = self.queryset.filter(
                doctor_id=doctor_id,
                day_of_week=day_of_week
            )
            
            # Exclude slots that have exclusions
            exclusions = SlotExclusion.objects.filter(
                doctor_id=doctor_id,
                exclusion_start_date__lte=target_date,
                exclusion_end_date__gte=target_date
            )
            
            if exclusions.exists():
                slots = slots.none()
            
            # Filter out already booked slots
            booked_slots = Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_slot_date=target_date
            ).values_list('slot_id', flat=True)
            
            available_slots = slots.exclude(id__in=booked_slots)
            
            serializer = self.get_serializer(available_slots, many=True)
            return Response(serializer.data)
            
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema_view(
    list=extend_schema(
        summary="List Slot Exclusions",
        description="Retrieve a list of all slot exclusions",
        tags=["Slot Exclusions"]
    ),
    create=extend_schema(
        summary="Create Slot Exclusion",
        description="Create a new slot exclusion period",
        tags=["Slot Exclusions"]
    )
)
class SlotExclusionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Slot Exclusions
    """
    queryset = SlotExclusion.objects.all()
    serializer_class = SlotExclusionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor', 'exclusion_start_date', 'exclusion_end_date']
    search_fields = ['doctor__first_name', 'doctor__last_name']
    ordering_fields = ['exclusion_start_date', 'exclusion_end_date']
    ordering = ['-exclusion_start_date']


@extend_schema_view(
    list=extend_schema(
        summary="List Appointments",
        description="Retrieve a list of all appointments",
        tags=["Appointments"]
    ),
    create=extend_schema(
        summary="Create Appointment",
        description="Create a new appointment",
        tags=["Appointments"]
    ),
    retrieve=extend_schema(
        summary="Get Appointment Details",
        description="Retrieve detailed information about a specific appointment",
        tags=["Appointments"]
    ),
    update=extend_schema(
        summary="Update Appointment",
        description="Update appointment information",
        tags=["Appointments"]
    )
)
class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Appointments
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'appointment_status', 'doctor', 'patient', 'treatment',
        'appointment_slot_date'
    ]
    search_fields = [
        'patient__first_name', 'patient__last_name', 'patient__email',
        'doctor__first_name', 'doctor__last_name', 'doctor__email',
        'treatment__name'
    ]
    ordering_fields = [
        'appointment_slot_date', 'appointment_slot_start_time', 'created_at'
    ]
    ordering = ['-appointment_slot_date', '-appointment_slot_start_time']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        elif self.action == 'retrieve':
            return AppointmentDetailSerializer
        return AppointmentSerializer

    @extend_schema(
        summary="Get Appointments by Status",
        description="Get appointments filtered by status",
        tags=["Appointments"]
    )
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        status_param = request.query_params.get('status')
        if not status_param:
            return Response(
                {'error': 'status parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointments = self.queryset.filter(appointment_status=status_param)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Today's Appointments",
        description="Get all appointments scheduled for today",
        tags=["Appointments"]
    )
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = datetime.now().date()
        appointments = self.queryset.filter(appointment_slot_date=today)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Upcoming Appointments",
        description="Get all upcoming appointments",
        tags=["Appointments"]
    )
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = datetime.now().date()
        appointments = self.queryset.filter(appointment_slot_date__gte=today)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Appointment Statistics",
        description="Get appointment statistics and analytics",
        tags=["Appointments"]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        # Overall statistics
        total_appointments = self.queryset.count()
        
        # Status breakdown
        status_stats = self.queryset.values('appointment_status').annotate(
            count=Count('id')
        )
        
        # Monthly appointments (last 12 months)
        monthly_appointments = []
        for i in range(12):
            date = datetime.now() - timedelta(days=30 * i)
            month_count = self.queryset.filter(
                appointment_slot_date__year=date.year,
                appointment_slot_date__month=date.month
            ).count()
            
            monthly_appointments.append({
                'month': date.strftime('%Y-%m'),
                'count': month_count
            })
        
        # Doctor workload
        doctor_stats = self.queryset.values(
            'doctor__first_name', 'doctor__last_name'
        ).annotate(
            appointment_count=Count('id')
        ).order_by('-appointment_count')[:10]
        
        # Treatment popularity
        treatment_stats = self.queryset.values(
            'treatment__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        stats = {
            'total_appointments': total_appointments,
            'status_breakdown': list(status_stats),
            'monthly_trends': monthly_appointments,
            'top_doctors': list(doctor_stats),
            'popular_treatments': list(treatment_stats)
        }
        
        return Response(stats)

    @extend_schema(
        summary="Update Appointment Status",
        description="Update the status of an appointment",
        tags=["Appointments"]
    )
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in [choice[0] for choice in Appointment.AppointmentStatus.choices]:
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.appointment_status = new_status
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)