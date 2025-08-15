"""
Hospital (Tenant) models for multi-tenant architecture.
Each hospital is a separate tenant with its own data isolation.
"""

from django.db import models
from django.utils import timezone
import uuid


class Hospital(models.Model):
    """
    Hospital model representing each tenant in the multi-tenant architecture.
    All data is isolated per hospital using tenant_id filtering.
    """
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('TRIAL', 'Trial'),
        ('EXPIRED', 'Expired'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    subdomain = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Hospital details
    registration_number = models.CharField(max_length=100, unique=True)
    tax_id = models.CharField(max_length=100, blank=True)
    hospital_type = models.CharField(max_length=100, blank=True)  # General, Specialty, Clinic, etc.
    
    # Contact information
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    fax_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    
    # Branding
    logo = models.ImageField(upload_to='hospital_logos/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='hospital_covers/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#0066cc')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#f0f8ff')  # Hex color
    
    # Additional details
    bed_capacity = models.IntegerField(null=True, blank=True)
    established_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Subscription and billing
    subscription_plan = models.ForeignKey(
        'subscription_plans.SubscriptionPlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    subscription_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TRIAL')
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    
    # Limits and quotas
    max_users = models.IntegerField(default=100)
    max_doctors = models.IntegerField(default=20)
    max_patients = models.IntegerField(default=1000)
    max_appointments_per_month = models.IntegerField(default=500)
    storage_quota_gb = models.IntegerField(default=10)
    
    # Settings
    is_active = models.BooleanField(default=True)
    allow_online_appointments = models.BooleanField(default=True)
    allow_telemedicine = models.BooleanField(default=True)
    require_email_verification = models.BooleanField(default=True)
    require_phone_verification = models.BooleanField(default=False)
    
    # Operating hours (JSON field for flexibility)
    operating_hours = models.JSONField(default=dict, blank=True)
    # Example: {"monday": {"open": "08:00", "close": "18:00"}, ...}
    
    # Emergency contact
    emergency_phone = models.CharField(max_length=20, blank=True)
    emergency_email = models.EmailField(blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    onboarded_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics (cached for performance)
    total_doctors = models.IntegerField(default=0)
    total_patients = models.IntegerField(default=0)
    total_appointments = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'hospitals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subdomain']),
            models.Index(fields=['is_active']),
            models.Index(fields=['subscription_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.subdomain})"
    
    @property
    def is_trial(self):
        """Check if hospital is in trial period."""
        return self.subscription_status == 'TRIAL'
    
    @property
    def is_expired(self):
        """Check if hospital subscription is expired."""
        return self.subscription_status == 'EXPIRED'
    
    @property
    def can_add_user(self):
        """Check if hospital can add more users."""
        return self.users.filter(is_active=True).count() < self.max_users
    
    @property
    def can_add_doctor(self):
        """Check if hospital can add more doctors."""
        return self.users.filter(role='DOCTOR', is_active=True).count() < self.max_doctors
    
    @property
    def can_add_patient(self):
        """Check if hospital can add more patients."""
        return self.users.filter(role='PATIENT', is_active=True).count() < self.max_patients
    
    def get_domain(self):
        """Get the full domain for this hospital."""
        # This would be configured based on your domain setup
        return f"{self.subdomain}.medcor.ai"
    
    def update_statistics(self):
        """Update cached statistics for the hospital."""
        self.total_doctors = self.users.filter(role='DOCTOR', is_active=True).count()
        self.total_patients = self.users.filter(role='PATIENT', is_active=True).count()
        # Note: appointments would come from appointments app
        self.save(update_fields=['total_doctors', 'total_patients', 'updated_at'])