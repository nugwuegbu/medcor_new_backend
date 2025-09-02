"""
Medical Records models for patient health information management.
Secure, multi-tenant medical record storage.
"""

from django.db import models
from django.utils import timezone
import uuid


class MedicalRecord(models.Model):
    """
    Medical record model for storing patient health information.
    Each record belongs to a specific hospital (tenant) and patient.
    """
    
    RECORD_TYPE_CHOICES = [
        ('GENERAL', 'General Record'),
        ('LAB_RESULT', 'Lab Result'),
        ('IMAGING', 'Imaging/X-Ray'),
        ('PRESCRIPTION', 'Prescription'),
        ('VACCINATION', 'Vaccination Record'),
        ('SURGERY', 'Surgery Report'),
        ('DISCHARGE', 'Discharge Summary'),
        ('ALLERGY', 'Allergy Record'),
        ('DIAGNOSIS', 'Diagnosis'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Hospital relationship
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='medical_records',
        help_text='Hospital this record belongs to'
    )
    
    # Patient
    patient = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='medical_records',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Doctor who created the record
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_medical_records',
        limit_choices_to={'role__in': ['DOCTOR', 'NURSE']}
    )
    
    # Record details
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES, default='GENERAL')
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Medical details
    diagnosis = models.TextField(blank=True)
    symptoms = models.TextField(blank=True)
    vital_signs = models.JSONField(default=dict, blank=True)
    # Example: {"blood_pressure": "120/80", "temperature": "98.6", "pulse": "72"}
    
    # Lab results
    lab_results = models.JSONField(default=dict, blank=True)
    
    # Attachments
    attachments = models.JSONField(default=list, blank=True)
    # List of file URLs or references
    
    # Related appointment
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medical_records'
    )
    
    # Privacy and security
    is_confidential = models.BooleanField(default=False)
    access_restricted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'medical_records'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', 'patient']),
            models.Index(fields=['hospital', 'created_at']),
            models.Index(fields=['hospital', 'record_type']),
        ]
    
    def __str__(self):
        return f"Medical Record: {self.title} for {self.patient}"


class MedicalDocument(models.Model):
    """
    Model for storing medical document files.
    Secure storage of PDFs, images, and other medical documents.
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('PDF', 'PDF Document'),
        ('IMAGE', 'Image'),
        ('XRAY', 'X-Ray'),
        ('MRI', 'MRI Scan'),
        ('CT', 'CT Scan'),
        ('LAB_REPORT', 'Lab Report'),
        ('PRESCRIPTION', 'Prescription'),
        ('OTHER', 'Other'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Hospital relationship
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='medical_documents',
        help_text='Hospital this document belongs to'
    )
    
    # Related medical record
    medical_record = models.ForeignKey(
        'MedicalRecord',
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    # Document details
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # File
    file = models.FileField(upload_to='medical_documents/%Y/%m/')
    file_size = models.IntegerField()  # In bytes
    file_type = models.CharField(max_length=100)  # MIME type
    
    # Upload information
    uploaded_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'medical_documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', 'medical_record']),
        ]
    
    def __str__(self):
        return f"Document: {self.title} ({self.document_type})"