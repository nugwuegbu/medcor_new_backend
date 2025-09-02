"""
Treatment models for patient care management.
Tracks treatments, prescriptions, and care plans.
"""

from django.db import models
from django.utils import timezone
import uuid


class Treatment(models.Model):
    """
    Treatment model for managing patient treatments and prescriptions.
    Each treatment belongs to a specific hospital (tenant) and patient.
    """
    
    TREATMENT_STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    TREATMENT_TYPE_CHOICES = [
        ('MEDICATION', 'Medication'),
        ('THERAPY', 'Therapy'),
        ('SURGERY', 'Surgery'),
        ('PROCEDURE', 'Procedure'),
        ('REHABILITATION', 'Rehabilitation'),
        ('COUNSELING', 'Counseling'),
        ('DIET_PLAN', 'Diet Plan'),
        ('EXERCISE', 'Exercise Program'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Hospital relationship
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='treatments',
        help_text='Hospital this treatment belongs to'
    )
    
    # Patient
    patient = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='treatments',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Prescribing doctor
    prescribed_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='prescribed_treatments',
        limit_choices_to={'role': 'DOCTOR'}
    )
    
    # Treatment details
    treatment_type = models.CharField(max_length=20, choices=TREATMENT_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    # Treatment plan
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TREATMENT_STATUS_CHOICES, default='PLANNED')
    
    # Instructions
    instructions = models.TextField()
    frequency = models.CharField(max_length=100, blank=True)  # e.g., "3 times daily"
    dosage = models.CharField(max_length=100, blank=True)  # e.g., "500mg"
    duration = models.CharField(max_length=100, blank=True)  # e.g., "7 days"
    
    # Side effects and warnings
    side_effects = models.TextField(blank=True)
    warnings = models.TextField(blank=True)
    
    # Related appointment
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='treatments'
    )
    
    # Related medical record
    medical_record = models.ForeignKey(
        'medical_records.MedicalRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='treatments'
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'treatments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', 'patient']),
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['hospital', 'start_date']),
        ]
    
    def __str__(self):
        return f"Treatment: {self.name} for {self.patient}"


class Prescription(models.Model):
    """
    Prescription model for medication management.
    Detailed prescription information linked to treatments.
    """
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Hospital relationship
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='prescriptions',
        help_text='Hospital this prescription belongs to'
    )
    
    # Related treatment
    treatment = models.ForeignKey(
        'Treatment',
        on_delete=models.CASCADE,
        related_name='prescriptions'
    )
    
    # Medication details
    medication_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True)
    brand_name = models.CharField(max_length=255, blank=True)
    
    # Dosage information
    dosage = models.CharField(max_length=100)
    dosage_unit = models.CharField(max_length=50)  # mg, ml, tablets, etc.
    frequency = models.CharField(max_length=100)  # e.g., "3 times daily"
    route = models.CharField(max_length=50)  # oral, injection, topical, etc.
    
    # Duration
    duration_days = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Quantity
    quantity_prescribed = models.IntegerField()
    quantity_unit = models.CharField(max_length=50)  # tablets, bottles, etc.
    
    # Refills
    refills_allowed = models.IntegerField(default=0)
    refills_used = models.IntegerField(default=0)
    
    # Instructions
    instructions = models.TextField()
    take_with_food = models.BooleanField(default=False)
    
    # Pharmacy information
    pharmacy_name = models.CharField(max_length=255, blank=True)
    pharmacy_phone = models.CharField(max_length=20, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_dispensed = models.BooleanField(default=False)
    dispensed_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prescriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', 'treatment']),
            models.Index(fields=['hospital', 'is_active']),
        ]
    
    def __str__(self):
        return f"Prescription: {self.medication_name} ({self.dosage})"