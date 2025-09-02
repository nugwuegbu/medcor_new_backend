from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class Specialty(models.Model):
    """Model for medical specializations"""
    
    # Predefined specialization choices
    SPECIALIZATION_CHOICES = [
        ('general_medicine', 'General Medicine'),
        ('pediatrics', 'Pediatrics'),
        ('gynecology', 'Gynecology'),
        ('cardiology', 'Cardiology'),
        ('dermatology', 'Dermatology'),
        ('orthopedics', 'Orthopedics'),
        ('psychiatry', 'Psychiatry'),
        ('neurology', 'Neurology'),
        ('ophthalmology', 'Ophthalmology'),
        ('ent', 'ENT (Ear, Nose, and Throat)'),
        ('radiology', 'Radiology'),
        ('anesthesiology', 'Anesthesiology'),
        ('surgery', 'General Surgery'),
        ('urology', 'Urology'),
        ('nephrology', 'Nephrology'),
        ('endocrinology', 'Endocrinology'),
        ('gastroenterology', 'Gastroenterology'),
        ('pulmonology', 'Pulmonology'),
        ('oncology', 'Oncology'),
        ('rheumatology', 'Rheumatology'),
        ('emergency_medicine', 'Emergency Medicine'),
        ('family_medicine', 'Family Medicine'),
        ('internal_medicine', 'Internal Medicine'),
        ('obstetrics', 'Obstetrics'),
        ('pathology', 'Pathology'),
        ('plastic_surgery', 'Plastic Surgery'),
        ('sports_medicine', 'Sports Medicine'),
    ]
    
    code = models.CharField(
        max_length=50,
        choices=SPECIALIZATION_CHOICES,
        unique=True,
        db_index=True
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Additional metadata
    certification_required = models.BooleanField(default=True)
    years_of_training = models.IntegerField(default=3)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Specialty'
        verbose_name_plural = 'Specialties'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_default_specialty(cls):
        """Get or create the default 'General Medicine' specialty"""
        specialty, created = cls.objects.get_or_create(
            code='general_medicine',
            defaults={
                'name': 'General Medicine',
                'description': 'General medical practice covering common health issues',
                'certification_required': True,
                'years_of_training': 3
            }
        )
        return specialty


class DoctorSpecialty(models.Model):
    """
    Many-to-many relationship between doctors and specialties
    Allows doctors to have multiple specializations
    """
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_specialties',
        limit_choices_to={'role': 'doctor'}
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.CASCADE,
        related_name='specialists'
    )
    
    # Additional fields for the relationship
    is_primary = models.BooleanField(
        default=False,
        help_text="Is this the doctor's primary specialization?"
    )
    certification_date = models.DateField(null=True, blank=True)
    certification_number = models.CharField(max_length=100, blank=True, null=True)
    institution = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Institution where specialization was obtained"
    )
    years_of_experience = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['doctor', 'specialty']
        ordering = ['-is_primary', 'specialty__name']
        verbose_name = 'Doctor Specialty'
        verbose_name_plural = 'Doctor Specialties'
        indexes = [
            models.Index(fields=['doctor', 'is_primary']),
            models.Index(fields=['specialty']),
        ]
    
    def __str__(self):
        primary = " (Primary)" if self.is_primary else ""
        return f"{self.doctor.get_full_name()} - {self.specialty.name}{primary}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary specialty per doctor
        if self.is_primary:
            DoctorSpecialty.objects.filter(
                doctor=self.doctor,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        
        super().save(*args, **kwargs)


class SpecialtyStatistics(models.Model):
    """Track statistics for specialties"""
    specialty = models.OneToOneField(
        Specialty,
        on_delete=models.CASCADE,
        related_name='statistics'
    )
    total_doctors = models.IntegerField(default=0)
    total_appointments = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
    # Demand metrics
    appointment_requests_last_month = models.IntegerField(default=0)
    average_wait_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Specialty Statistics'
        verbose_name_plural = 'Specialty Statistics'
    
    def update_statistics(self):
        """Update statistics for this specialty"""
        # Update total doctors
        self.total_doctors = self.specialty.specialists.count()
        
        # Calculate other metrics (placeholder for actual implementation)
        # This would typically involve querying appointments, ratings, etc.
        
        self.save()