"""
Enhanced Appointment serializers for healthcare scheduling system.
Supports weekly patterns and specific date exceptions.
"""

from datetime import timedelta
from typing import Dict, List

from django.utils import timezone
from django.db import models
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from core.models import User
from tenants.models import Hospital
from appointments.models import (
    Appointment,
    DoctorScheduleTemplate,
    DoctorScheduleSlot,
    ScheduleException,
)


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Appointment model."""

    # Related field data
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    doctor_specialization = serializers.CharField(
        source="doctor.specialization", read_only=True
    )
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    # Computed fields
    is_past = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)

    # Slot information
    slot_id = serializers.UUIDField(source="slot.id", read_only=True)
    slot_status = serializers.CharField(source="slot.status", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "hospital",
            "hospital_name",
            "patient",
            "patient_name",
            "patient_email",
            "doctor",
            "doctor_name",
            "doctor_email",
            "doctor_specialization",
            "appointment_type",
            "priority",
            "status",
            "scheduled_date",
            "scheduled_time",
            "duration_minutes",
            "slot",
            "slot_id",
            "slot_status",
            "reason",
            "notes",
            "symptoms",
            "diagnosis",
            "actual_start_time",
            "actual_end_time",
            "is_past",
            "is_today",
            "is_upcoming",
            "can_be_cancelled",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate appointment data."""
        # Validate doctor belongs to hospital
        if "doctor" in data and "hospital" in data:
            if data["doctor"].hospital != data["hospital"]:
                raise serializers.ValidationError(
                    "Doctor must belong to the specified hospital."
                )

        # Validate patient belongs to hospital
        if "patient" in data and "hospital" in data:
            if data["patient"].hospital != data["hospital"]:
                raise serializers.ValidationError(
                    "Patient must belong to the specified hospital."
                )

        # Validate date is not too far in the past
        if "scheduled_date" in data:
            if data["scheduled_date"] < timezone.now().date() - timedelta(days=1):
                raise serializers.ValidationError(
                    "Cannot schedule appointments more than 1 day in the past."
                )

        return data


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments."""

    class Meta:
        model = Appointment
        fields = [
            "hospital",
            "patient",
            "doctor",
            "appointment_type",
            "priority",
            "scheduled_date",
            "scheduled_time",
            "duration_minutes",
            "slot",
            "reason",
            "notes",
            "symptoms",
        ]

    def validate(self, data):
        """Validate appointment creation."""
        # If slot is provided, validate it's available
        if "slot" in data:
            slot = data["slot"]
            if not slot.can_be_booked:
                raise serializers.ValidationError("Selected slot is not available for booking.")
            
            # Validate appointment type is allowed
            if "appointment_type" in data:
                if slot.allowed_appointment_types and data["appointment_type"] not in slot.allowed_appointment_types:
                    raise serializers.ValidationError(
                        f"Appointment type {data['appointment_type']} not allowed in this slot."
                    )

        return data


class DoctorScheduleTemplateSerializer(serializers.ModelSerializer):
    """Serializer for DoctorScheduleTemplate model."""

    # Related field data
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = DoctorScheduleTemplate
        fields = [
            "id",
            "hospital",
            "hospital_name",
            "doctor",
            "doctor_name",
            "doctor_email",
            "day_of_week",
            "day_name",
            "start_time",
            "end_time",
            "slot_duration_minutes",
            "max_appointments_per_slot",
            "is_available",
            "advance_booking_days",
            "minimum_notice_hours",
            "allowed_appointment_types",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate template data."""
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")

        if data["slot_duration_minutes"] <= 0:
            raise serializers.ValidationError("Slot duration must be positive.")

        if data["max_appointments_per_slot"] <= 0:
            raise serializers.ValidationError("Max appointments per slot must be positive.")

        return data


class DoctorScheduleTemplateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating schedule templates."""

    class Meta:
        model = DoctorScheduleTemplate
        fields = [
            "hospital",
            "doctor",
            "day_of_week",
            "start_time",
            "end_time",
            "slot_duration_minutes",
            "max_appointments_per_slot",
            "is_available",
            "advance_booking_days",
            "minimum_notice_hours",
            "allowed_appointment_types",
        ]


class DoctorScheduleSlotSerializer(serializers.ModelSerializer):
    """Serializer for DoctorScheduleSlot model."""

    # Related field data
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)
    template_id = serializers.UUIDField(source="template.id", read_only=True)

    # Computed fields
    is_available = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    can_be_booked = serializers.BooleanField(read_only=True)

    class Meta:
        model = DoctorScheduleSlot
        fields = [
            "id",
            "hospital",
            "hospital_name",
            "doctor",
            "doctor_name",
            "doctor_email",
            "template",
            "template_id",
            "date",
            "start_time",
            "end_time",
            "duration_minutes",
            "max_appointments",
            "current_appointments",
            "status",
            "advance_booking_days",
            "minimum_notice_hours",
            "allowed_appointment_types",
            "notes",
            "metadata",
            "is_available",
            "is_past",
            "can_be_booked",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "current_appointments"]

    def validate(self, data):
        """Validate slot data."""
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")

        if data["date"] < timezone.now().date() - timedelta(days=1):
            raise serializers.ValidationError("Cannot create slots more than 1 day in the past.")

        return data


class DoctorScheduleSlotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating schedule slots."""

    class Meta:
        model = DoctorScheduleSlot
        fields = [
            "hospital",
            "doctor",
            "template",
            "date",
            "start_time",
            "end_time",
            "duration_minutes",
            "max_appointments",
            "status",
            "advance_booking_days",
            "minimum_notice_hours",
            "allowed_appointment_types",
            "notes",
            "metadata",
        ]


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    """Serializer for ScheduleException model."""

    # Related field data
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    class Meta:
        model = ScheduleException
        fields = [
            "id",
            "hospital",
            "hospital_name",
            "doctor",
            "doctor_name",
            "doctor_email",
            "exception_type",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "title",
            "description",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate exception data."""
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("End date must be after start date.")

        if data.get("start_time") and data.get("end_time"):
            if data["start_time"] >= data["end_time"]:
                raise serializers.ValidationError("End time must be after start time.")

        return data


class ScheduleExceptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating schedule exceptions."""

    class Meta:
        model = ScheduleException
        fields = [
            "hospital",
            "doctor",
            "exception_type",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "title",
            "description",
        ]


class BulkScheduleTemplateItemSerializer(serializers.Serializer):
    """Serializer for individual template items in bulk creation."""
    
    day_of_week = serializers.IntegerField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    slot_duration_minutes = serializers.IntegerField(default=30)
    max_appointments_per_slot = serializers.IntegerField(default=1)
    is_available = serializers.BooleanField(default=True)
    advance_booking_days = serializers.IntegerField(default=30)
    minimum_notice_hours = serializers.IntegerField(default=24)
    allowed_appointment_types = serializers.ListField(
        child=serializers.CharField(),
        default=list,
        allow_empty=True
    )


class BulkScheduleTemplateCreateSerializer(serializers.Serializer):
    """Serializer for creating multiple schedule templates at once."""

    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role="DOCTOR"))
    templates = serializers.ListField(
        child=BulkScheduleTemplateItemSerializer(),
        min_length=1,
        max_length=7,
        help_text="List of schedule templates (one per day of week)"
    )

    def validate_templates(self, value):
        """Validate that each day of week is unique."""
        days = [template["day_of_week"] for template in value]
        if len(days) != len(set(days)):
            raise serializers.ValidationError("Each day of week can only appear once.")
        return value

    def create(self, validated_data):
        """Create multiple schedule templates."""
        doctor = validated_data["doctor"]
        templates_data = validated_data["templates"]
        
        created_templates = []
        for template_data in templates_data:
            template_data["doctor"] = doctor
            template_data["hospital"] = doctor.hospital
            template = DoctorScheduleTemplate.objects.create(**template_data)
            created_templates.append(template)
        
        return created_templates


class GenerateSlotsSerializer(serializers.Serializer):
    """Serializer for generating slots from templates."""

    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role="DOCTOR"))
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    overwrite_existing = serializers.BooleanField(default=False)

    def validate(self, data):
        """Validate date range."""
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("End date must be after start date.")
        
        if data["end_date"] > timezone.now().date() + timedelta(days=365):
            raise serializers.ValidationError("Cannot generate slots more than 1 year in advance.")
        
        return data

    def create(self, validated_data):
        """Generate slots for the specified date range."""
        doctor = validated_data["doctor"]
        start_date = validated_data["start_date"]
        end_date = validated_data["end_date"]
        overwrite_existing = validated_data["overwrite_existing"]
        
        # Get the current user from context
        request = self.context.get('request')
        created_by = request.user if request and hasattr(request, 'user') else None
        
        generated_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            # Get templates for this day of week
            day_of_week = current_date.weekday()
            templates = DoctorScheduleTemplate.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_active=True,
                is_available=True
            )
            
            for template in templates:
                # Check if slots already exist for this date
                existing_slots = DoctorScheduleSlot.objects.filter(
                    doctor=doctor,
                    date=current_date,
                    template=template
                )
                
                if existing_slots.exists() and not overwrite_existing:
                    continue
                
                if existing_slots.exists() and overwrite_existing:
                    existing_slots.delete()
                
                # Generate new slots manually with created_by
                slots = self._generate_slots_for_date(template, current_date, created_by)
                generated_slots.extend(slots)
            
            current_date += timedelta(days=1)
        
        return generated_slots
    
    def _generate_slots_for_date(self, template, target_date, created_by):
        """Generate individual slots for a specific date based on template."""
        from datetime import datetime, timedelta
        
        slots = []
        current_time = template.start_time
        
        while current_time < template.end_time:
            # Calculate end time for this slot
            slot_end_time = (datetime.combine(target_date, current_time) + 
                           timedelta(minutes=template.slot_duration_minutes)).time()
            
            slot = DoctorScheduleSlot.objects.create(
                hospital=template.hospital,
                doctor=template.doctor,
                template=template,
                date=target_date,
                start_time=current_time,
                end_time=slot_end_time,
                duration_minutes=template.slot_duration_minutes,
                max_appointments=template.max_appointments_per_slot,
                allowed_appointment_types=template.allowed_appointment_types,
                advance_booking_days=template.advance_booking_days,
                minimum_notice_hours=template.minimum_notice_hours,
                created_by=created_by,
            )
            slots.append(slot)
            
            current_time = slot_end_time
        
        return slots


class AppointmentBookingRequestSerializer(serializers.Serializer):
    """Serializer for booking appointment request body (without slot field)."""
    
    patient_id = serializers.UUIDField(help_text="Patient's UUID")
    appointment_type = serializers.ChoiceField(
        choices=Appointment.APPOINTMENT_TYPE_CHOICES,
        default="CONSULTATION"
    )
    reason = serializers.CharField(max_length=500)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    symptoms = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_patient_id(self, value):
        """Validate that patient exists and is active."""
        try:
            patient = User.objects.get(id=value, role="PATIENT", is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Patient not found or inactive.")


class AppointmentBookingSerializer(serializers.Serializer):
    """Serializer for booking appointments through slots (internal use)."""

    slot = serializers.PrimaryKeyRelatedField(queryset=DoctorScheduleSlot.objects.all())
    patient_id = serializers.UUIDField(help_text="Patient's UUID")
    appointment_type = serializers.ChoiceField(
        choices=Appointment.APPOINTMENT_TYPE_CHOICES,
        default="CONSULTATION"
    )
    reason = serializers.CharField(max_length=500)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    symptoms = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate_slot(self, value):
        """Validate that slot can be booked."""
        if not value.can_be_booked:
            # Provide specific reason why slot cannot be booked
            from django.utils import timezone
            from datetime import datetime
            
            if not value.is_available:
                raise serializers.ValidationError("Slot is not available (status: {}, current: {}/{})".format(
                    value.status, value.current_appointments, value.max_appointments))
            
            days_ahead = (value.date - timezone.now().date()).days
            if days_ahead > value.advance_booking_days:
                raise serializers.ValidationError("Slot is too far in advance ({} days ahead, max allowed: {} days)".format(
                    days_ahead, value.advance_booking_days))
            
            if value.is_past:
                raise serializers.ValidationError("Slot is in the past")
            
            # Check minimum notice hours
            slot_datetime = timezone.make_aware(datetime.combine(value.date, value.start_time))
            hours_until_slot = (slot_datetime - timezone.now()).total_seconds() / 3600
            if hours_until_slot < value.minimum_notice_hours:
                raise serializers.ValidationError("Insufficient notice ({} hours until slot, minimum required: {} hours)".format(
                    round(hours_until_slot, 1), value.minimum_notice_hours))
            
            raise serializers.ValidationError("Slot is not available for booking.")
        return value
    
    def validate_patient_id(self, value):
        """Validate that patient exists and is active."""
        try:
            patient = User.objects.get(id=value, role="PATIENT", is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Patient not found or inactive.")

    def validate_appointment_type(self, value):
        """Validate appointment type is allowed in slot."""
        # Get slot from initial_data
        if 'slot' in self.initial_data:
            slot_id = self.initial_data['slot']
            from appointments.models import DoctorScheduleSlot
            try:
                slot = DoctorScheduleSlot.objects.get(id=slot_id)
                if slot and hasattr(slot, "allowed_appointment_types"):
                    if slot.allowed_appointment_types and value not in slot.allowed_appointment_types:
                        raise serializers.ValidationError(
                            f"Appointment type {value} not allowed in this slot."
                        )
            except DoctorScheduleSlot.DoesNotExist:
                pass
        return value

    def create(self, validated_data):
        """Book the appointment."""
        slot = validated_data["slot"]
        patient_id = validated_data["patient_id"]
        patient = User.objects.get(id=patient_id, role="PATIENT")
        
        appointment = slot.book_appointment(
            patient=patient,
            appointment_type=validated_data["appointment_type"],
            reason=validated_data["reason"]
        )
        
        # Update additional fields
        if validated_data.get("notes"):
            appointment.notes = validated_data["notes"]
        if validated_data.get("symptoms"):
            appointment.symptoms = validated_data["symptoms"]
        appointment.save()
        
        return appointment


class DoctorAvailabilitySerializer(serializers.Serializer):
    """Serializer for checking doctor availability."""

    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role="DOCTOR"))
    date = serializers.DateField()
    appointment_type = serializers.ChoiceField(
        choices=Appointment.APPOINTMENT_TYPE_CHOICES,
        required=False
    )

    @extend_schema_field(serializers.ListField(child=DoctorScheduleSlotSerializer()))
    def get_available_slots(self, obj):
        """Get available slots for the doctor on the specified date."""
        slots = DoctorScheduleSlot.objects.filter(
            doctor=obj["doctor"],
            date=obj["date"],
            status="AVAILABLE"
        ).filter(
            current_appointments__lt=models.F("max_appointments")
        )
        
        if obj.get("appointment_type"):
            slots = slots.filter(
                models.Q(allowed_appointment_types__isnull=True) |
                models.Q(allowed_appointment_types__contains=[obj["appointment_type"]])
            )
        
        return DoctorScheduleSlotSerializer(slots, many=True).data


class SimpleAvailabilityCheckSerializer(serializers.Serializer):
    """Simple serializer for checking doctor availability with basic parameters."""
    
    doctor_id = serializers.UUIDField(help_text="Doctor's UUID")
    date = serializers.DateField(help_text="Date to check availability (YYYY-MM-DD)")
    start_time = serializers.TimeField(help_text="Start time (HH:MM:SS)")
    end_time = serializers.TimeField(help_text="End time (HH:MM:SS)")
    hospital_id = serializers.UUIDField(help_text="Hospital UUID", required=False)
    
    def validate_doctor_id(self, value):
        """Validate that doctor exists and is active."""
        try:
            doctor = User.objects.get(id=value, role="DOCTOR", is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Doctor not found or inactive.")
    
    def validate_hospital_id(self, value):
        """Validate that hospital exists."""
        if value:
            try:
                hospital = Hospital.objects.get(id=value, is_active=True)
                return value
            except Hospital.DoesNotExist:
                raise serializers.ValidationError("Hospital not found or inactive.")
        return value
    
    def validate(self, attrs):
        """Validate the time range."""
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs