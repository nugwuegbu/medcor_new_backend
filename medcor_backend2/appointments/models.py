"""
Appointment models for healthcare scheduling system.
Multi-tenant appointments with doctor-patient scheduling.
"""

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid
from datetime import timedelta


class Appointment(models.Model):
    """
    Appointment model for managing healthcare appointments.
    Each appointment belongs to a specific hospital (tenant).
    """
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
        ('RESCHEDULED', 'Rescheduled'),
    ]
    
    APPOINTMENT_TYPE_CHOICES = [
        ('CONSULTATION', 'Consultation'),
        ('FOLLOW_UP', 'Follow-up'),
        ('ROUTINE_CHECKUP', 'Routine Checkup'),
        ('EMERGENCY', 'Emergency'),
        ('TELEMEDICINE', 'Telemedicine'),
        ('VACCINATION', 'Vaccination'),
        ('LAB_TEST', 'Lab Test'),
        ('SURGERY', 'Surgery'),
        ('THERAPY', 'Therapy'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant field
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    
    # Patient and Doctor
    patient = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='patient_appointments',
        limit_choices_to={'role': 'PATIENT'}
    )
    doctor = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='doctor_appointments',
        limit_choices_to={'role': 'DOCTOR'}
    )
    
    # Appointment details
    appointment_type = models.CharField(
        max_length=20,
        choices=APPOINTMENT_TYPE_CHOICES,
        default='CONSULTATION'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    # Scheduling
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField(default=30)
    
    # Appointment end time (calculated)
    end_time = models.TimeField(null=True, blank=True)
    
    # Actual times (for tracking)
    check_in_time = models.DateTimeField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time_actual = models.DateTimeField(null=True, blank=True)
    
    # Details
    reason = models.TextField()
    symptoms = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Telemedicine fields
    is_telemedicine = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    meeting_password = models.CharField(max_length=100, blank=True)
    
    # Follow-up
    is_follow_up = models.BooleanField(default=False)
    parent_appointment = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_ups'
    )
    
    # Cancellation/Rescheduling
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_appointments'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    rescheduled_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_to'
    )
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['scheduled_date', 'scheduled_time']
        indexes = [
            models.Index(fields=['hospital', 'scheduled_date']),
            models.Index(fields=['hospital', 'doctor', 'scheduled_date']),
            models.Index(fields=['hospital', 'patient']),
            models.Index(fields=['hospital', 'status']),
        ]
        unique_together = [
            ['hospital', 'doctor', 'scheduled_date', 'scheduled_time']
        ]
    
    def __str__(self):
        return f"Appointment: {self.patient} with {self.doctor} on {self.scheduled_date} at {self.scheduled_time}"
    
    def clean(self):
        """Validate appointment data."""
        if self.scheduled_date and self.scheduled_date < timezone.now().date():
            raise ValidationError("Cannot schedule appointments in the past.")
        
        if self.doctor_id and self.patient_id:
            if self.doctor.hospital_id != self.patient.hospital_id:
                raise ValidationError("Doctor and patient must belong to the same hospital.")
    
    def save(self, *args, **kwargs):
        """Calculate end time before saving."""
        if self.scheduled_time and self.duration_minutes:
            from datetime import datetime, timedelta
            start = datetime.combine(self.scheduled_date, self.scheduled_time)
            end = start + timedelta(minutes=self.duration_minutes)
            self.end_time = end.time()
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_past(self):
        """Check if appointment is in the past."""
        from datetime import datetime
        appointment_datetime = datetime.combine(self.scheduled_date, self.scheduled_time)
        return appointment_datetime < timezone.now()
    
    @property
    def is_today(self):
        """Check if appointment is today."""
        return self.scheduled_date == timezone.now().date()
    
    @property
    def is_upcoming(self):
        """Check if appointment is upcoming."""
        return self.scheduled_date > timezone.now().date()


class AppointmentSlot(models.Model):
    """
    Available appointment slots for doctors.
    Pre-defined time slots that patients can book.
    """
    
    SLOT_STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BOOKED', 'Booked'),
        ('BLOCKED', 'Blocked'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant field
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='appointment_slots'
    )
    
    # Doctor
    doctor = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='appointment_slots',
        limit_choices_to={'role': 'DOCTOR'}
    )
    
    # Slot details
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=SLOT_STATUS_CHOICES, default='AVAILABLE')
    
    # Linked appointment (if booked)
    appointment = models.OneToOneField(
        'Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='slot'
    )
    
    # Slot type
    is_telemedicine = models.BooleanField(default=False)
    max_patients = models.IntegerField(default=1)  # For group sessions
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointment_slots'
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['hospital', 'doctor', 'date']),
            models.Index(fields=['hospital', 'status', 'date']),
        ]
        unique_together = [
            ['hospital', 'doctor', 'date', 'start_time']
        ]
    
    def __str__(self):
        return f"Slot: {self.doctor} on {self.date} at {self.start_time}-{self.end_time}"