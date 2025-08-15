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
    
    # Link to doctor's availability slot (optional but recommended)
    slot = models.ForeignKey(
        'DoctorAvailabilitySlot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        help_text='The doctor availability slot this appointment was booked in'
    )
    
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


class DoctorAvailabilitySlot(models.Model):
    """
    Doctor availability slots model.
    Defines when doctors are available for appointments.
    """
    
    SLOT_STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BOOKED', 'Booked'),
        ('BLOCKED', 'Blocked'),
        ('BREAK', 'Break'),
        ('UNAVAILABLE', 'Unavailable'),
    ]
    
    DAY_OF_WEEK_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    RECURRENCE_CHOICES = [
        ('NONE', 'No Recurrence'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant field
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='doctor_availability_slots'
    )
    
    # Doctor
    doctor = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='availability_slots',
        limit_choices_to={'role': 'DOCTOR'}
    )
    
    # Slot details
    date = models.DateField(help_text="Specific date for this slot")
    start_time = models.TimeField(help_text="Slot start time")
    end_time = models.TimeField(help_text="Slot end time")
    
    # Duration and capacity
    slot_duration_minutes = models.IntegerField(
        default=30,
        help_text="Duration of each appointment slot in minutes"
    )
    max_appointments = models.IntegerField(
        default=1,
        help_text="Maximum number of appointments that can be booked in this slot"
    )
    current_appointments = models.IntegerField(
        default=0,
        help_text="Current number of appointments booked in this slot"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=SLOT_STATUS_CHOICES,
        default='AVAILABLE'
    )
    
    # Recurrence settings
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        default='NONE'
    )
    recurrence_end_date = models.DateField(null=True, blank=True)
    day_of_week = models.IntegerField(
        choices=DAY_OF_WEEK_CHOICES,
        null=True,
        blank=True,
        help_text="For weekly recurring slots"
    )
    
    # Appointment type restrictions
    allowed_appointment_types = models.JSONField(
        default=list,
        blank=True,
        help_text="List of appointment types allowed in this slot"
    )
    
    # Notes and metadata
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Booking control
    advance_booking_days = models.IntegerField(
        default=30,
        help_text="How many days in advance this slot can be booked"
    )
    minimum_notice_hours = models.IntegerField(
        default=24,
        help_text="Minimum hours notice required for booking"
    )
    
    # Related appointment (if slot is booked)
    appointment = models.OneToOneField(
        'Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='booked_slot'
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_slots'
    )
    
    class Meta:
        db_table = 'doctor_availability_slots'
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['hospital', 'doctor', 'date']),
            models.Index(fields=['hospital', 'doctor', 'status']),
            models.Index(fields=['hospital', 'date', 'status']),
            models.Index(fields=['doctor', 'date', 'start_time']),
        ]
        unique_together = [
            ['hospital', 'doctor', 'date', 'start_time', 'end_time']
        ]
    
    def __str__(self):
        return f"Dr. {self.doctor.get_full_name()} - {self.date} {self.start_time}-{self.end_time} ({self.status})"
    
    def clean(self):
        """Validate slot data."""
        # Validate time order
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")
        
        # Validate date is not in the past
        if self.date < timezone.now().date():
            raise ValidationError("Cannot create slots in the past.")
        
        # Validate doctor belongs to hospital
        if self.doctor_id and self.hospital_id:
            if self.doctor.hospital_id != self.hospital_id:
                raise ValidationError("Doctor must belong to the specified hospital.")
        
        # Check for overlapping slots
        if self.doctor_id and self.date and self.start_time and self.end_time:
            overlapping = DoctorAvailabilitySlot.objects.filter(
                doctor=self.doctor,
                date=self.date,
                status__in=['AVAILABLE', 'BOOKED']
            ).exclude(pk=self.pk)
            
            for slot in overlapping:
                if (self.start_time < slot.end_time and self.end_time > slot.start_time):
                    raise ValidationError(f"Slot overlaps with existing slot: {slot}")
    
    def save(self, *args, **kwargs):
        """Auto-set hospital from doctor if not provided."""
        if self.doctor_id and not self.hospital_id:
            self.hospital_id = self.doctor.hospital_id
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_available(self):
        """Check if slot is available for booking."""
        return (
            self.status == 'AVAILABLE' and
            self.current_appointments < self.max_appointments and
            self.date >= timezone.now().date()
        )
    
    @property
    def is_past(self):
        """Check if slot is in the past."""
        from datetime import datetime
        slot_datetime = datetime.combine(self.date, self.start_time)
        return slot_datetime < timezone.now()
    
    @property
    def available_spots(self):
        """Get number of available spots in this slot."""
        return max(0, self.max_appointments - self.current_appointments)
    
    def book_slot(self, appointment):
        """Book this slot for an appointment."""
        if not self.is_available:
            raise ValidationError("This slot is not available for booking.")
        
        self.appointment = appointment
        self.current_appointments += 1
        
        if self.current_appointments >= self.max_appointments:
            self.status = 'BOOKED'
        
        self.save()
    
    def cancel_booking(self):
        """Cancel booking for this slot."""
        if self.appointment:
            self.appointment = None
            self.current_appointments = max(0, self.current_appointments - 1)
            
            if self.current_appointments < self.max_appointments and not self.is_past:
                self.status = 'AVAILABLE'
            
            self.save()
    
    def generate_time_slots(self):
        """Generate individual time slots based on slot duration."""
        from datetime import datetime, timedelta
        
        slots = []
        current_time = datetime.combine(self.date, self.start_time)
        end_datetime = datetime.combine(self.date, self.end_time)
        
        while current_time + timedelta(minutes=self.slot_duration_minutes) <= end_datetime:
            slot_end = current_time + timedelta(minutes=self.slot_duration_minutes)
            slots.append({
                'start_time': current_time.time(),
                'end_time': slot_end.time(),
                'available': self.is_available,
                'date': self.date
            })
            current_time = slot_end
        
        return slots
    
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