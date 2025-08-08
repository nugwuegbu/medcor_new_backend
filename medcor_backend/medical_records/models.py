from django.db import models
from django.conf import settings
from django.utils import timezone
import os

def medical_record_upload_path(instance, filename):
    """Generate upload path for medical record files"""
    # Format: medical_records/patient_<id>/<year>/<month>/<filename>
    date = timezone.now()
    # The instance here is a MedicalRecordFile, so we need to access patient through medical_record
    return f'medical_records/patient_{instance.medical_record.patient.id}/{date.year}/{date.month:02d}/{filename}'

class MedicalRecord(models.Model):
    """
    Medical record for a patient
    One-to-many relationship: One User (patient) can have many medical records
    """
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='medical_records',
        help_text='Patient who owns this medical record'
    )
    date = models.DateField(
        default=timezone.now,
        help_text='Date of the medical record'
    )
    diagnosis = models.TextField(
        help_text='Medical diagnosis description'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Medical Record'
        verbose_name_plural = 'Medical Records'

    def __str__(self):
        return f"MR{self.id:05d} - {self.patient.get_full_name() or self.patient.username} - {self.date}"

    @property
    def record_id(self):
        """Generate formatted record ID"""
        return f"MR{self.id:05d}"

class MedicalRecordFile(models.Model):
    """File attachment for medical records"""
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name='files',
        help_text='Medical record this file belongs to'
    )
    file = models.FileField(
        upload_to=medical_record_upload_path,
        help_text='Upload medical record file (PDF, Image, etc.)'
    )
    file_name = models.CharField(
        max_length=255,
        help_text='Original file name'
    )
    file_size = models.PositiveIntegerField(
        help_text='File size in bytes'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Medical Record File'
        verbose_name_plural = 'Medical Record Files'
    
    def __str__(self):
        return f"{self.file_name} - {self.medical_record.record_id}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_name = os.path.basename(self.file.name)
            self.file_size = self.file.size
        super().save(*args, **kwargs)
