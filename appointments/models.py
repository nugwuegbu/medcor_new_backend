"""
Enhanced Appointment models for healthcare scheduling system.
Uses weekly patterns as primary scheduling method with specific date exceptions.
"""

import uuid
from datetime import timedelta, time as dt_time, datetime
from typing import List, Optional

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Appointment(models.Model):
    """
    Appointment model for managing healthcare appointments.
    Each appointment belongs to a specific hospital (tenant).
    """

    STATUS_CHOICES = [
        ("SCHEDULED", "Scheduled"),
        ("CONFIRMED", "Confirmed"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
        ("NO_SHOW", "No Show"),
        ("RESCHEDULED", "Rescheduled"),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ("CONSULTATION", "Consultation"),
        ("FOLLOW_UP", "Follow-up"),
        ("ROUTINE_CHECKUP", "Routine Checkup"),
        ("EMERGENCY", "Emergency"),
        ("TELEMEDICINE", "Telemedicine"),
        ("VACCINATION", "Vaccination"),
        ("LAB_TEST", "Lab Test"),
        ("SURGERY", "Surgery"),
        ("THERAPY", "Therapy"),
        ("SCREENING", "Screening"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("NORMAL", "Normal"),
        ("HIGH", "High"),
        ("URGENT", "Urgent"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hospital relationship
    hospital = models.ForeignKey(
        "tenants.Hospital",
        on_delete=models.CASCADE,
        related_name="appointments",
        help_text="Hospital this appointment belongs to",
    )

    # Patient and Doctor
    patient = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="appointments_as_patient",
        limit_choices_to={"role": "PATIENT"},
    )
    doctor = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="appointments_as_doctor",
        limit_choices_to={"role": "DOCTOR"},
    )

    # Appointment details
    appointment_type = models.CharField(
        max_length=20, choices=APPOINTMENT_TYPE_CHOICES, default="CONSULTATION"
    )
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="NORMAL"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="SCHEDULED")

    # Scheduling
    scheduled_date = models.DateField(help_text="Date of the appointment")
    scheduled_time = models.TimeField(help_text="Time of the appointment")
    duration_minutes = models.IntegerField(
        default=30, help_text="Duration in minutes"
    )

    # Optional slot reference
    slot = models.ForeignKey(
        "DoctorScheduleSlot",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
        help_text="Reference to the schedule slot if booked from weekly schedule",
    )

    # Appointment details
    reason = models.TextField(help_text="Reason for the appointment")
    notes = models.TextField(blank=True, help_text="Additional notes")
    symptoms = models.TextField(blank=True, help_text="Patient symptoms")
    diagnosis = models.TextField(blank=True, help_text="Doctor's diagnosis")

    # Timing tracking
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_appointments",
    )

    class Meta:
        db_table = "appointments"
        ordering = ["scheduled_date", "scheduled_time"]
        indexes = [
            models.Index(fields=["hospital", "doctor", "scheduled_date"]),
            models.Index(fields=["hospital", "patient", "scheduled_date"]),
            models.Index(fields=["hospital", "status", "scheduled_date"]),
            models.Index(fields=["doctor", "scheduled_date", "scheduled_time"]),
        ]

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.doctor.get_full_name()} - {self.scheduled_date} {self.scheduled_time}"

    def clean(self):
        """Validate appointment data."""
        # Validate doctor belongs to hospital
        if self.doctor_id and self.hospital_id:
            if self.doctor.hospital_id != self.hospital_id:
                raise ValidationError("Doctor must belong to the specified hospital.")

        # Validate patient belongs to hospital
        if self.patient_id and self.hospital_id:
            if self.patient.hospital_id != self.hospital_id:
                raise ValidationError("Patient must belong to the specified hospital.")

        # Validate date is not too far in the past
        if self.scheduled_date < timezone.now().date() - timedelta(days=1):
            raise ValidationError("Cannot schedule appointments more than 1 day in the past.")

    def save(self, *args, **kwargs):
        """Auto-set hospital from doctor if not provided."""
        if self.doctor_id and not self.hospital_id:
            self.hospital = self.doctor.hospital
        if self.patient_id and not self.hospital_id:
            self.hospital = self.patient.hospital

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_past(self):
        """Check if appointment is in the past."""
        appointment_datetime = datetime.combine(
            self.scheduled_date, self.scheduled_time
        )
        # Make timezone-aware for comparison
        appointment_datetime = timezone.make_aware(appointment_datetime)
        return appointment_datetime < timezone.now()

    @property
    def is_today(self):
        """Check if appointment is today."""
        return self.scheduled_date == timezone.now().date()

    @property
    def is_upcoming(self):
        """Check if appointment is upcoming."""
        return self.scheduled_date > timezone.now().date()

    @property
    def can_be_cancelled(self):
        """Check if appointment can be cancelled."""
        return self.status in ["SCHEDULED", "CONFIRMED"] and not self.is_past


class DoctorScheduleTemplate(models.Model):
    """
    Template for doctor's weekly schedule.
    This is the primary way to set up recurring availability.
    """

    DAY_OF_WEEK_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hospital and Doctor
    hospital = models.ForeignKey(
        "tenants.Hospital",
        on_delete=models.CASCADE,
        related_name="schedule_templates",
    )
    doctor = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="schedule_templates",
        limit_choices_to={"role": "DOCTOR"},
    )

    # Schedule details
    day_of_week = models.IntegerField(choices=DAY_OF_WEEK_CHOICES)
    start_time = models.TimeField(help_text="Start time for this day")
    end_time = models.TimeField(help_text="End time for this day")
    slot_duration_minutes = models.IntegerField(
        default=30, help_text="Duration of each slot in minutes"
    )
    max_appointments_per_slot = models.IntegerField(
        default=1, help_text="Maximum appointments per slot"
    )

    # Availability settings
    is_available = models.BooleanField(default=True)
    advance_booking_days = models.IntegerField(
        default=30, help_text="How many days in advance can patients book"
    )
    minimum_notice_hours = models.IntegerField(
        default=24, help_text="Minimum notice required for booking"
    )

    # Appointment type restrictions
    allowed_appointment_types = models.JSONField(
        default=list,
        blank=True,
        help_text="List of appointment types allowed",
    )

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "doctor_schedule_templates"
        unique_together = [["hospital", "doctor", "day_of_week"]]
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        day_name = dict(self.DAY_OF_WEEK_CHOICES)[self.day_of_week]
        return f"Dr. {self.doctor.get_full_name()} - {day_name} {self.start_time}-{self.end_time}"

    def clean(self):
        """Validate template data."""
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

        if self.slot_duration_minutes <= 0:
            raise ValidationError("Slot duration must be positive.")

        if self.max_appointments_per_slot <= 0:
            raise ValidationError("Max appointments per slot must be positive.")

    def save(self, *args, **kwargs):
        """Auto-set hospital from doctor if not provided."""
        if self.doctor_id and not self.hospital_id:
            self.hospital = self.doctor.hospital

        self.full_clean()
        super().save(*args, **kwargs)

    def generate_slots_for_date(self, target_date: datetime.date) -> List["DoctorScheduleSlot"]:
        """Generate individual slots for a specific date based on this template."""
        slots = []
        current_time = self.start_time
        
        while current_time < self.end_time:
            slot_end_time = datetime.combine(
                target_date, current_time
            ) + timedelta(minutes=self.slot_duration_minutes)
            
            slot = DoctorScheduleSlot.objects.create(
                hospital=self.hospital,
                doctor=self.doctor,
                template=self,
                date=target_date,
                start_time=current_time,
                end_time=slot_end_time.time(),
                duration_minutes=self.slot_duration_minutes,
                max_appointments=self.max_appointments_per_slot,
                allowed_appointment_types=self.allowed_appointment_types,
                advance_booking_days=self.advance_booking_days,
                minimum_notice_hours=self.minimum_notice_hours,
            )
            slots.append(slot)
            
            current_time = slot_end_time.time()
        
        return slots


class DoctorScheduleSlot(models.Model):
    """
    Individual schedule slots generated from templates or created manually.
    These are the actual bookable time slots.
    """

    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("BOOKED", "Booked"),
        ("BLOCKED", "Blocked"),
        ("BREAK", "Break"),
        ("UNAVAILABLE", "Unavailable"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hospital and Doctor
    hospital = models.ForeignKey(
        "tenants.Hospital",
        on_delete=models.CASCADE,
        related_name="schedule_slots",
    )
    doctor = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="schedule_slots",
        limit_choices_to={"role": "DOCTOR"},
    )

    # Template reference (if generated from template)
    template = models.ForeignKey(
        "DoctorScheduleTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_slots",
    )

    # Slot details
    date = models.DateField(help_text="Date of the slot")
    start_time = models.TimeField(help_text="Start time of the slot")
    end_time = models.TimeField(help_text="End time of the slot")
    duration_minutes = models.IntegerField(
        default=30, help_text="Duration in minutes"
    )

    # Capacity
    max_appointments = models.IntegerField(
        default=1, help_text="Maximum appointments in this slot"
    )
    current_appointments = models.IntegerField(
        default=0, help_text="Current number of appointments"
    )

    # Status
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="AVAILABLE"
    )

    # Booking restrictions
    advance_booking_days = models.IntegerField(
        default=30, help_text="How many days in advance can be booked"
    )
    minimum_notice_hours = models.IntegerField(
        default=24, help_text="Minimum notice required"
    )

    # Appointment type restrictions
    allowed_appointment_types = models.JSONField(
        default=list,
        blank=True,
        help_text="List of allowed appointment types",
    )

    # Notes and metadata
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_slots",
    )

    class Meta:
        db_table = "doctor_schedule_slots"
        ordering = ["date", "start_time"]
        indexes = [
            models.Index(fields=["hospital", "doctor", "date"]),
            models.Index(fields=["hospital", "doctor", "status"]),
            models.Index(fields=["hospital", "date", "status"]),
            models.Index(fields=["doctor", "date", "start_time"]),
        ]
        unique_together = [["hospital", "doctor", "date", "start_time"]]

    def __str__(self):
        return f"Dr. {self.doctor.get_full_name()} - {self.date} {self.start_time}-{self.end_time} ({self.status})"

    def clean(self):
        """Validate slot data."""
        # Validate time order
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

        # Validate date is not too far in the past
        if self.date < timezone.now().date() - timedelta(days=1):
            raise ValidationError("Cannot create slots more than 1 day in the past.")

        # Validate doctor belongs to hospital
        if self.doctor_id and self.hospital_id:
            if self.doctor.hospital_id != self.hospital_id:
                raise ValidationError("Doctor must belong to the specified hospital.")

        # Check for overlapping slots
        if self.doctor_id and self.date and self.start_time and self.end_time:
            overlapping = DoctorScheduleSlot.objects.filter(
                doctor=self.doctor,
                date=self.date,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
                status__in=["AVAILABLE", "BOOKED"],
            ).exclude(pk=self.pk)

            if overlapping.exists():
                raise ValidationError("Slot overlaps with existing slot(s)")

    def save(self, *args, **kwargs):
        """Auto-set hospital from doctor if not provided."""
        if self.doctor_id and not self.hospital_id:
            self.hospital = self.doctor.hospital

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_available(self):
        """Check if slot is available for booking."""
        return (
            self.status == "AVAILABLE"
            and self.current_appointments < self.max_appointments
            and self.date >= timezone.now().date()
        )

    @property
    def is_past(self):
        """Check if slot is in the past."""
        slot_datetime = datetime.combine(self.date, self.start_time)
        # Make timezone-aware for comparison
        slot_datetime = timezone.make_aware(slot_datetime)
        return slot_datetime < timezone.now()

    @property
    def can_be_booked(self):
        """Check if slot can be booked."""
        if not self.is_available:
            return False
        
        # Check advance booking limit
        days_ahead = (self.date - timezone.now().date()).days
        if days_ahead > self.advance_booking_days:
            return False
        
        # Check minimum notice
        if self.is_past:
            return False
        
        # Check minimum notice hours
        slot_datetime = timezone.make_aware(datetime.combine(self.date, self.start_time))
        hours_until_slot = (slot_datetime - timezone.now()).total_seconds() / 3600
        if hours_until_slot < self.minimum_notice_hours:
            return False
        
        return True

    def book_appointment(self, patient, appointment_type="CONSULTATION", reason=""):
        """Book an appointment in this slot."""
        if not self.can_be_booked:
            raise ValidationError("Slot cannot be booked")
        
        if appointment_type not in self.allowed_appointment_types and self.allowed_appointment_types:
            raise ValidationError(f"Appointment type {appointment_type} not allowed in this slot")
        
        appointment = Appointment.objects.create(
            hospital=self.hospital,
            patient=patient,
            doctor=self.doctor,
            scheduled_date=self.date,
            scheduled_time=self.start_time,
            duration_minutes=self.duration_minutes,
            slot=self,
            appointment_type=appointment_type,
            reason=reason,
        )
        
        self.current_appointments += 1
        if self.current_appointments >= self.max_appointments:
            self.status = "BOOKED"
        self.save()
        
        return appointment


class ScheduleException(models.Model):
    """
    Exceptions to the regular schedule (holidays, vacations, etc.).
    These override the template-based schedule for specific dates.
    """

    EXCEPTION_TYPE_CHOICES = [
        ("HOLIDAY", "Holiday"),
        ("VACATION", "Vacation"),
        ("SICK_LEAVE", "Sick Leave"),
        ("CONFERENCE", "Conference"),
        ("EMERGENCY", "Emergency"),
        ("CUSTOM", "Custom"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Hospital and Doctor
    hospital = models.ForeignKey(
        "tenants.Hospital",
        on_delete=models.CASCADE,
        related_name="schedule_exceptions",
    )
    doctor = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="schedule_exceptions",
        limit_choices_to={"role": "DOCTOR"},
    )

    # Exception details
    exception_type = models.CharField(
        max_length=20, choices=EXCEPTION_TYPE_CHOICES, default="CUSTOM"
    )
    start_date = models.DateField(help_text="Start date of exception")
    end_date = models.DateField(help_text="End date of exception")
    start_time = models.TimeField(
        null=True, blank=True, help_text="Start time (if partial day)"
    )
    end_time = models.TimeField(
        null=True, blank=True, help_text="End time (if partial day)"
    )

    # Description
    title = models.CharField(max_length=200, help_text="Exception title")
    description = models.TextField(blank=True, help_text="Exception description")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_exceptions",
    )

    class Meta:
        db_table = "schedule_exceptions"
        ordering = ["start_date", "start_time"]

    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.title} ({self.start_date} to {self.end_date})"

    def clean(self):
        """Validate exception data."""
        if self.start_date > self.end_date:
            raise ValidationError("End date must be after start date.")

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

    def save(self, *args, **kwargs):
        """Auto-set hospital from doctor if not provided."""
        if self.doctor_id and not self.hospital_id:
            self.hospital = self.doctor.hospital

        self.full_clean()
        super().save(*args, **kwargs)

    def affects_date(self, target_date: datetime.date) -> bool:
        """Check if this exception affects a specific date."""
        return self.start_date <= target_date <= self.end_date

    def affects_datetime(self, target_datetime: datetime) -> bool:
        """Check if this exception affects a specific datetime."""
        if not self.affects_date(target_datetime.date()):
            return False
        
        # If no specific times, affects entire day
        if not self.start_time or not self.end_time:
            return True
        
        target_time = target_datetime.time()
        return self.start_time <= target_time < self.end_time