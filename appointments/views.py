"""
Enhanced Appointment views for healthcare scheduling system.
Supports weekly patterns and specific date exceptions.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from django.db import models
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.types import OpenApiTypes

from core.models import User
from tenants.models import Hospital
from appointments.models import (
    Appointment,
    DoctorScheduleTemplate,
    DoctorScheduleSlot,
    ScheduleException,
)
from appointments.serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    DoctorScheduleTemplateSerializer,
    DoctorScheduleTemplateCreateSerializer,
    DoctorScheduleSlotSerializer,
    DoctorScheduleSlotCreateSerializer,
    ScheduleExceptionSerializer,
    ScheduleExceptionCreateSerializer,
    BulkScheduleTemplateCreateSerializer,
    GenerateSlotsSerializer,
    AppointmentBookingSerializer,
    AppointmentBookingRequestSerializer,
    DoctorAvailabilitySerializer,
    SimpleAvailabilityCheckSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary="List appointments",
        description="Get a list of appointments with filtering options",
        tags=["Appointments"],
    ),
    create=extend_schema(
        summary="Create appointment",
        description="Create a new appointment",
        tags=["Appointments"],
    ),
    retrieve=extend_schema(
        summary="Get appointment",
        description="Get details of a specific appointment",
        tags=["Appointments"],
    ),
    update=extend_schema(
        summary="Update appointment",
        description="Update an existing appointment",
        tags=["Appointments"],
    ),
    partial_update=extend_schema(
        summary="Partially update appointment",
        description="Partially update an existing appointment",
        tags=["Appointments"],
    ),
    destroy=extend_schema(
        summary="Delete appointment",
        description="Delete an appointment",
        tags=["Appointments"],
    ),
)
class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing appointments."""

    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "hospital",
        "patient",
        "doctor",
        "appointment_type",
        "status",
        "priority",
        "scheduled_date",
    ]
    search_fields = ["reason", "notes", "symptoms", "diagnosis"]
    ordering_fields = ["scheduled_date", "scheduled_time", "created_at"]
    ordering = ["scheduled_date", "scheduled_time"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        """Filter queryset based on user role and hospital."""
        queryset = super().get_queryset()
        
        # Filter by hospital if user belongs to one
        if hasattr(self.request.user, "hospital") and self.request.user.hospital:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by role
        if self.request.user.role == "DOCTOR":
            queryset = queryset.filter(doctor=self.request.user)
        elif self.request.user.role == "PATIENT":
            queryset = queryset.filter(patient=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)

    @extend_schema(
        summary="Get today's appointments",
        description="Get all appointments scheduled for today",
        tags=["Appointments"],
    )
    @action(detail=False, methods=["get"])
    def today(self, request):
        """Get today's appointments."""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(scheduled_date=today)
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get upcoming appointments",
        description="Get all upcoming appointments",
        tags=["Appointments"],
    )
    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Get upcoming appointments."""
        today = timezone.now().date()
        appointments = self.get_queryset().filter(scheduled_date__gte=today)
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Cancel appointment",
        description="Cancel an appointment",
        tags=["Appointments"],
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel an appointment."""
        appointment = self.get_object()
        
        if not appointment.can_be_cancelled:
            return Response(
                {"error": "Appointment cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = "CANCELLED"
        appointment.save()
        
        # Update slot if it was booked
        if appointment.slot:
            appointment.slot.current_appointments -= 1
            if appointment.slot.current_appointments < appointment.slot.max_appointments:
                appointment.slot.status = "AVAILABLE"
            appointment.slot.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @extend_schema(
        summary="Complete appointment",
        description="Mark an appointment as completed",
        tags=["Appointments"],
    )
    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Complete an appointment."""
        appointment = self.get_object()
        
        if appointment.status not in ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"]:
            return Response(
                {"error": "Appointment cannot be completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = "COMPLETED"
        appointment.actual_end_time = timezone.now()
        if not appointment.actual_start_time:
            appointment.actual_start_time = timezone.now()
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List schedule templates",
        description="Get a list of doctor schedule templates",
        tags=["Schedule Templates"],
    ),
    create=extend_schema(
        summary="Create schedule template",
        description="Create a new schedule template",
        tags=["Schedule Templates"],
    ),
    retrieve=extend_schema(
        summary="Get schedule template",
        description="Get details of a specific schedule template",
        tags=["Schedule Templates"],
    ),
    update=extend_schema(
        summary="Update schedule template",
        description="Update an existing schedule template",
        tags=["Schedule Templates"],
    ),
    partial_update=extend_schema(
        summary="Partially update schedule template",
        description="Partially update an existing schedule template",
        tags=["Schedule Templates"],
    ),
    destroy=extend_schema(
        summary="Delete schedule template",
        description="Delete a schedule template",
        tags=["Schedule Templates"],
    ),
)
class DoctorScheduleTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor schedule templates."""

    queryset = DoctorScheduleTemplate.objects.all()
    serializer_class = DoctorScheduleTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["hospital", "doctor", "day_of_week", "is_available", "is_active"]
    ordering_fields = ["day_of_week", "start_time"]
    ordering = ["day_of_week", "start_time"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return DoctorScheduleTemplateCreateSerializer
        elif self.action == "bulk_create":
            return BulkScheduleTemplateCreateSerializer
        elif self.action == "generate_slots":
            return GenerateSlotsSerializer
        return DoctorScheduleTemplateSerializer

    def get_queryset(self):
        """Filter queryset based on user role and hospital."""
        queryset = super().get_queryset()
        
        # Filter by hospital if user belongs to one
        if hasattr(self.request.user, "hospital") and self.request.user.hospital:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by doctor if user is a doctor
        if self.request.user.role == "DOCTOR":
            queryset = queryset.filter(doctor=self.request.user)
        
        return queryset

    @extend_schema(
        summary="Create bulk schedule templates",
        description="Create multiple schedule templates at once",
        tags=["Schedule Templates"],
        request=BulkScheduleTemplateCreateSerializer
    )
    @action(detail=False, methods=["post"], serializer_class=BulkScheduleTemplateCreateSerializer)
    def bulk_create(self, request):
        """Create multiple schedule templates at once."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        templates = serializer.save()
        response_serializer = DoctorScheduleTemplateSerializer(templates, many=True)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Generate slots from templates",
        description="Generate individual slots from templates for a date range",
        tags=["Schedule Templates"],
        request=GenerateSlotsSerializer
    )
    @action(detail=False, methods=["post"], serializer_class=GenerateSlotsSerializer)
    def generate_slots(self, request):
        """Generate slots from templates for a date range."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        slots = serializer.save()
        response_serializer = DoctorScheduleSlotSerializer(slots, many=True)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    list=extend_schema(
        summary="List schedule slots",
        description="Get a list of doctor schedule slots",
        tags=["Schedule Slots"],
    ),
    create=extend_schema(
        summary="Create schedule slot",
        description="Create a new schedule slot",
        tags=["Schedule Slots"],
    ),
    retrieve=extend_schema(
        summary="Get schedule slot",
        description="Get details of a specific schedule slot",
        tags=["Schedule Slots"],
    ),
    update=extend_schema(
        summary="Update schedule slot",
        description="Update an existing schedule slot",
        tags=["Schedule Slots"],
    ),
    partial_update=extend_schema(
        summary="Partially update schedule slot",
        description="Partially update an existing schedule slot",
        tags=["Schedule Slots"],
    ),
    destroy=extend_schema(
        summary="Delete schedule slot",
        description="Delete a schedule slot",
        tags=["Schedule Slots"],
    ),
)
class DoctorScheduleSlotViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor schedule slots."""

    queryset = DoctorScheduleSlot.objects.all()
    serializer_class = DoctorScheduleSlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "hospital",
        "doctor",
        "template",
        "date",
        "status",
    ]
    ordering_fields = ["date", "start_time"]
    ordering = ["date", "start_time"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return DoctorScheduleSlotCreateSerializer
        elif self.action == "simple_check":
            return SimpleAvailabilityCheckSerializer
        elif self.action == "check_availability":
            return DoctorAvailabilitySerializer
        elif self.action == "book":
            return AppointmentBookingSerializer
        return DoctorScheduleSlotSerializer

    def get_queryset(self):
        """Filter queryset based on user role and hospital."""
        queryset = super().get_queryset()
        
        # Filter by hospital if user belongs to one
        if hasattr(self.request.user, "hospital") and self.request.user.hospital:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by doctor if user is a doctor
        if self.request.user.role == "DOCTOR":
            queryset = queryset.filter(doctor=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)

    @extend_schema(
        summary="Get available slots",
        description="Get all available slots for booking",
        tags=["Schedule Slots"],
    )
    @action(detail=False, methods=["get"])
    def available(self, request):
        """Get available slots."""
        slots = self.get_queryset().filter(
            status="AVAILABLE",
            current_appointments__lt=models.F("max_appointments"),
            date__gte=timezone.now().date()
        )
        
        serializer = self.get_serializer(slots, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Book appointment",
        description="Book an appointment in a slot",
        tags=["Schedule Slots"],
        request=AppointmentBookingRequestSerializer,
    )
    @action(detail=True, methods=["post"], serializer_class=AppointmentBookingSerializer)
    def book(self, request, pk=None):
        """Book an appointment in this slot."""
        slot = self.get_object()
        
        # Add the slot to the request data automatically
        booking_data = request.data.copy()
        booking_data['slot'] = slot.id
        
        serializer = self.get_serializer(data=booking_data)
        serializer.is_valid(raise_exception=True)
        
        appointment = serializer.save()
        appointment_serializer = AppointmentSerializer(appointment)
        
        return Response(appointment_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Check doctor availability",
        description="Check doctor availability for a specific date",
        tags=["Schedule Slots"],
    )
    @action(detail=False, methods=["post"], serializer_class=DoctorAvailabilitySerializer)
    def check_availability(self, request):
        """Check doctor availability for a specific date."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        available_slots = serializer.get_available_slots(serializer.validated_data)
        
        return Response({
            "doctor": serializer.validated_data["doctor"].id,
            "date": serializer.validated_data["date"],
            "available_slots": available_slots
        })

    @extend_schema(
        summary="Simple availability check",
        description="Simple check if doctor is available for a specific time slot",
        tags=["Schedule Slots"],
        request=SimpleAvailabilityCheckSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "available": {"type": "boolean"},
                    "message": {"type": "string"},
                    "conflicting_slots": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/DoctorScheduleSlot"}
                    }
                }
            }
        }
    )
    @action(detail=False, methods=["post"], serializer_class=SimpleAvailabilityCheckSerializer)
    def simple_check(self, request):
        """Simple availability check with basic parameters."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        doctor_id = data['doctor_id']
        date = data['date']
        start_time = data['start_time']
        end_time = data['end_time']
        hospital_id = data.get('hospital_id')
        
        # Get doctor
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        # If hospital_id not provided, use doctor's hospital
        if not hospital_id:
            hospital_id = doctor.hospital.id
        
        # First, check if doctor has a schedule template for this day
        day_of_week = date.weekday()  # Monday = 0, Sunday = 6
        schedule_template = DoctorScheduleTemplate.objects.filter(
            doctor=doctor,
            hospital_id=hospital_id,
            day_of_week=day_of_week,
            is_active=True
        ).first()
        
        if not schedule_template:
            # Doctor doesn't work on this day
            is_available = False
            conflicting_slots = []
            overlapping_appointments = []
        else:
            # Check if requested time falls within doctor's working hours
            if start_time < schedule_template.start_time or end_time > schedule_template.end_time:
                # Requested time is outside working hours
                is_available = False
                conflicting_slots = []
                overlapping_appointments = []
            else:
                # Check for conflicting slots (only BOOKED slots are conflicts)
                conflicting_slots = DoctorScheduleSlot.objects.filter(
                    doctor=doctor,
                    hospital_id=hospital_id,
                    date=date,
                    start_time__lt=end_time,
                    end_time__gt=start_time,
                    status='BOOKED'  # Only BOOKED slots are conflicts
                )
                
                # Check for existing appointments
                from datetime import timedelta
                conflicting_appointments = Appointment.objects.filter(
                    doctor=doctor,
                    hospital_id=hospital_id,
                    scheduled_date=date,
                    status__in=['SCHEDULED', 'CONFIRMED']
                )
                
                # Filter appointments that overlap with the requested time slot
                overlapping_appointments = []
                for appointment in conflicting_appointments:
                    app_start = appointment.scheduled_time
                    app_end = (datetime.combine(date, app_start) + timedelta(minutes=appointment.duration_minutes)).time()
                    
                    # Check if appointment overlaps with requested time slot
                    if app_start < end_time and app_end > start_time:
                        overlapping_appointments.append(appointment)
                
                is_available = conflicting_slots.count() == 0 and len(overlapping_appointments) == 0
        
        # Generate appropriate message
        if not schedule_template:
            message = "Doctor does not work on this day"
        elif start_time < schedule_template.start_time or end_time > schedule_template.end_time:
            message = f"Requested time is outside doctor's working hours ({schedule_template.start_time} - {schedule_template.end_time})"
        elif conflicting_slots.count() > 0:
            message = "Doctor has conflicting booked slots"
        elif len(overlapping_appointments) > 0:
            message = "Doctor has conflicting appointments"
        else:
            message = "Doctor is available"
        
        response_data = {
            "available": is_available,
            "message": message,
            "conflicting_slots": DoctorScheduleSlotSerializer(conflicting_slots, many=True).data if hasattr(conflicting_slots, 'exists') and conflicting_slots.exists() else []
        }
        
        return Response(response_data)


@extend_schema_view(
    list=extend_schema(
        summary="List schedule exceptions",
        description="Get a list of schedule exceptions",
        tags=["Schedule Exceptions"],
    ),
    create=extend_schema(
        summary="Create schedule exception",
        description="Create a new schedule exception",
        tags=["Schedule Exceptions"],
    ),
    retrieve=extend_schema(
        summary="Get schedule exception",
        description="Get details of a specific schedule exception",
        tags=["Schedule Exceptions"],
    ),
    update=extend_schema(
        summary="Update schedule exception",
        description="Update an existing schedule exception",
        tags=["Schedule Exceptions"],
    ),
    partial_update=extend_schema(
        summary="Partially update schedule exception",
        description="Partially update an existing schedule exception",
        tags=["Schedule Exceptions"],
    ),
    destroy=extend_schema(
        summary="Delete schedule exception",
        description="Delete a schedule exception",
        tags=["Schedule Exceptions"],
    ),
)
class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing schedule exceptions."""

    queryset = ScheduleException.objects.all()
    serializer_class = ScheduleExceptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "hospital",
        "doctor",
        "exception_type",
        "start_date",
        "end_date",
    ]
    search_fields = ["title", "description"]
    ordering_fields = ["start_date", "end_date"]
    ordering = ["start_date"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return ScheduleExceptionCreateSerializer
        return ScheduleExceptionSerializer

    def get_queryset(self):
        """Filter queryset based on user role and hospital."""
        queryset = super().get_queryset()
        
        # Filter by hospital if user belongs to one
        if hasattr(self.request.user, "hospital") and self.request.user.hospital:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by doctor if user is a doctor
        if self.request.user.role == "DOCTOR":
            queryset = queryset.filter(doctor=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)