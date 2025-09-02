"""
Views for appointment management with doctor availability slots.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, F
from django.db import models
from datetime import datetime, timedelta, date
from .models import Appointment, DoctorAvailabilitySlot
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    DoctorAvailabilitySlotSerializer,
    DoctorAvailabilitySlotCreateSerializer
)


class DoctorAvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing doctor availability slots.
    """
    
    queryset = DoctorAvailabilitySlot.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor', 'status', 'is_recurring']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'notes']
    ordering_fields = ['start_time']
    ordering = ['start_time']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DoctorAvailabilitySlotCreateSerializer
        return DoctorAvailabilitySlotSerializer
    
    def get_queryset(self):
        """Filter slots based on user's hospital and role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by hospital
        if not user.is_superuser:
            if hasattr(user, 'hospital') and user.hospital:
                queryset = queryset.filter(hospital=user.hospital)
        
        # Additional filters from query params
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # Filter by date range using DateTime fields
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            # Convert date string to datetime at start of day
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                start_datetime = timezone.make_aware(start_datetime) if timezone.is_naive(start_datetime) else start_datetime
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            # Convert date string to datetime at end of day
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
                end_datetime = timezone.make_aware(end_datetime) if timezone.is_naive(end_datetime) else end_datetime
                queryset = queryset.filter(start_time__lte=end_datetime)
            except ValueError:
                pass
        
        # Filter available slots only
        available_only = self.request.query_params.get('available_only', 'false').lower() == 'true'
        if available_only:
            queryset = queryset.filter(
                status='AVAILABLE',
                start_time__gte=timezone.now()
            ).exclude(
                current_appointments__gte=F('max_appointments')
            )
        
        return queryset.select_related('doctor', 'created_by', 'hospital')
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available slots for booking."""
        queryset = self.get_queryset().filter(
            status='AVAILABLE',
            start_time__gte=timezone.now()
        )
        
        # Filter by doctor if specified
        doctor_id = request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # Filter by date if specified
        date_str = request.query_params.get('date')
        if date_str:
            try:
                slot_date = datetime.strptime(date_str, '%Y-%m-%d')
                start_datetime = timezone.make_aware(slot_date) if timezone.is_naive(slot_date) else slot_date
                end_datetime = start_datetime.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(
                    start_time__gte=start_datetime,
                    start_time__lte=end_datetime
                )
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Filter by appointment type if specified
        appointment_type = request.query_params.get('appointment_type')
        if appointment_type:
            queryset = queryset.filter(
                Q(allowed_appointment_types__contains=[appointment_type]) |
                Q(allowed_appointment_types=[])
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def generate_weekly_slots(self, request):
        """Generate weekly recurring slots for a doctor."""
        data = request.data
        doctor_id = data.get('doctor_id')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        daily_slots = data.get('daily_slots', [])
        
        if not all([doctor_id, start_date, end_date, daily_slots]):
            return Response(
                {'error': 'doctor_id, start_date, end_date, and daily_slots are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse dates
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            # Get doctor
            from core.models import User
            doctor = User.objects.get(id=doctor_id, role='DOCTOR')
            
            created_slots = []
            current_date = start
            
            while current_date <= end:
                # Get day of week (0=Monday, 6=Sunday)
                day_of_week = current_date.weekday()
                
                # Check if there are slots for this day
                day_slots = daily_slots.get(str(day_of_week), [])
                
                for slot_config in day_slots:
                    # Parse time strings and combine with date to create DateTime objects
                    start_time_str = slot_config['start_time']
                    end_time_str = slot_config['end_time']
                    
                    # Create datetime objects
                    start_datetime = datetime.strptime(f"{current_date} {start_time_str}", "%Y-%m-%d %H:%M:%S")
                    end_datetime = datetime.strptime(f"{current_date} {end_time_str}", "%Y-%m-%d %H:%M:%S")
                    
                    # Make timezone aware
                    start_datetime = timezone.make_aware(start_datetime) if timezone.is_naive(start_datetime) else start_datetime
                    end_datetime = timezone.make_aware(end_datetime) if timezone.is_naive(end_datetime) else end_datetime
                    
                    slot_data = {
                        'doctor': doctor,
                        'hospital': doctor.hospital,
                        'start_time': start_datetime,
                        'end_time': end_datetime,
                        'slot_duration_minutes': slot_config.get('duration', 30),
                        'max_appointments': slot_config.get('max_appointments', 1),
                        'status': 'AVAILABLE',
                        'created_by': request.user
                    }
                    
                    # Check if slot already exists
                    existing = DoctorAvailabilitySlot.objects.filter(
                        doctor=doctor,
                        start_time=start_datetime,
                        end_time=end_datetime
                    ).first()
                    
                    if not existing:
                        slot = DoctorAvailabilitySlot.objects.create(**slot_data)
                        created_slots.append(slot)
                
                current_date += timedelta(days=1)
            
            serializer = DoctorAvailabilitySlotSerializer(created_slots, many=True)
            return Response({
                'message': f'Created {len(created_slots)} slots',
                'slots': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        """Block a slot from being booked."""
        slot = self.get_object()
        
        if slot.status == 'BOOKED':
            return Response(
                {'error': 'Cannot block a booked slot'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slot.status = 'BLOCKED'
        slot.save()
        
        serializer = self.get_serializer(slot)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        """Unblock a slot to make it available."""
        slot = self.get_object()
        
        if slot.status != 'BLOCKED':
            return Response(
                {'error': 'Slot is not blocked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slot.status = 'AVAILABLE'
        slot.save()
        
        serializer = self.get_serializer(slot)
        return Response(serializer.data)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments.
    """
    
    queryset = Appointment.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'appointment_type', 'doctor', 'patient', 'scheduled_date']
    search_fields = ['patient__first_name', 'patient__last_name', 'doctor__first_name', 
                     'doctor__last_name', 'reason', 'symptoms']
    ordering_fields = ['scheduled_date', 'scheduled_time', 'created_at']
    ordering = ['-scheduled_date', '-scheduled_time']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        """Filter appointments based on user's role and hospital."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by hospital
        if not user.is_superuser:
            if hasattr(user, 'hospital') and user.hospital:
                queryset = queryset.filter(hospital=user.hospital)
        
        # Role-based filtering
        if user.role == 'PATIENT':
            queryset = queryset.filter(patient=user)
        elif user.role == 'DOCTOR':
            # Doctors can see their appointments
            show_all = self.request.query_params.get('show_all', 'false').lower() == 'true'
            if not show_all:
                queryset = queryset.filter(doctor=user)
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(scheduled_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(scheduled_date__lte=end_date)
        
        # Today's appointments
        today_only = self.request.query_params.get('today', 'false').lower() == 'true'
        if today_only:
            queryset = queryset.filter(scheduled_date=timezone.now().date())
        
        # Upcoming appointments
        upcoming_only = self.request.query_params.get('upcoming', 'false').lower() == 'true'
        if upcoming_only:
            queryset = queryset.filter(scheduled_date__gte=timezone.now().date())
        
        return queryset.select_related(
            'patient', 'doctor', 'slot', 'cancelled_by', 'hospital'
        ).prefetch_related('follow_ups')
    
    def create(self, validated_data):
        """Create appointment with hospital from user."""
        # Auto-set hospital
        if 'hospital' not in validated_data:
            validated_data['hospital'] = self.request.user.hospital
        
        return super().create(validated_data)
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in patient for appointment."""
        appointment = self.get_object()
        
        if appointment.status != 'SCHEDULED':
            return Response(
                {'error': 'Can only check in scheduled appointments'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.check_in_time = timezone.now()
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start appointment."""
        appointment = self.get_object()
        
        if appointment.status not in ['SCHEDULED', 'IN_PROGRESS']:
            return Response(
                {'error': 'Cannot start this appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = 'IN_PROGRESS'
        appointment.start_time = timezone.now()
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete appointment."""
        appointment = self.get_object()
        
        if appointment.status != 'IN_PROGRESS':
            return Response(
                {'error': 'Can only complete in-progress appointments'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = 'COMPLETED'
        appointment.end_time_actual = timezone.now()
        appointment.save()
        
        # Release the slot if it was booked
        if appointment.slot:
            appointment.slot.cancel_booking()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel appointment."""
        appointment = self.get_object()
        
        if appointment.status in ['COMPLETED', 'CANCELLED']:
            return Response(
                {'error': 'Cannot cancel this appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = 'CANCELLED'
        appointment.cancellation_reason = request.data.get('reason', '')
        appointment.cancelled_by = request.user
        appointment.cancelled_at = timezone.now()
        appointment.save()
        
        # Release the slot if it was booked
        if appointment.slot:
            appointment.slot.cancel_booking()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get appointment statistics for dashboard."""
        queryset = self.get_queryset()
        
        today = timezone.now().date()
        
        stats = {
            'total_appointments': queryset.count(),
            'today_appointments': queryset.filter(scheduled_date=today).count(),
            'upcoming_appointments': queryset.filter(
                scheduled_date__gt=today,
                status='SCHEDULED'
            ).count(),
            'completed_appointments': queryset.filter(status='COMPLETED').count(),
            'cancelled_appointments': queryset.filter(status='CANCELLED').count(),
            'by_status': queryset.values('status').annotate(count=Count('id')),
            'by_type': queryset.values('appointment_type').annotate(count=Count('id')),
        }
        
        # If user is a doctor, add patient count
        if request.user.role == 'DOCTOR':
            stats['total_patients'] = queryset.filter(
                doctor=request.user
            ).values('patient').distinct().count()
        
        return Response(stats)
