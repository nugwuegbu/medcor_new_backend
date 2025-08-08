from django.db import models
from django.conf import settings
from django.utils import timezone

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
    type = models.CharField(
        max_length=50,
        default='Consultation',
        help_text='Type of medical record (e.g., Consultation, Lab Results, Prescription, X-Ray, Follow-up)'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctor_records',
        help_text='Doctor who created this record'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('completed', 'Completed'),
            ('reviewed', 'Reviewed'),
            ('active', 'Active'),
            ('scheduled', 'Scheduled'),
        ],
        default='completed',
        help_text='Status of the medical record'
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
