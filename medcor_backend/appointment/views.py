from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from .models import Slot, SlotExclusion, Appointment
from .serializers import (
    SlotSerializer, SlotCreateSerializer,
    SlotExclusionSerializer, SlotExclusionCreateSerializer,
    AppointmentSerializer, AppointmentCreateSerializer,
    AppointmentUpdateSerializer, AppointmentListSerializer
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
