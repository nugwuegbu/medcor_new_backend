from django.db import models
from django.contrib.auth.models import AbstractUser
from django_tenants.models import TenantMixin, DomainMixin


class Client(TenantMixin):
    """
    Tenant model for multi-tenancy support.
    Each tenant represents a hospital/clinic using the system.
    """
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)
    
    # Default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Domain model for tenant routing.
    Each domain points to a specific tenant.
    """
    pass


class User(AbstractUser):
    """
    Custom user model that extends Django's AbstractUser.
    This model will be created in each tenant's schema for isolated user management.
    """
    # Extend the default user model with additional fields
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Medical-specific fields
    medical_record_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    insurance_provider = models.CharField(max_length=100, blank=True, null=True)
    insurance_policy_number = models.CharField(max_length=100, blank=True, null=True)
    blood_type = models.CharField(max_length=5, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    
    # Role-based access control
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('admin', 'Admin'),
        ('receptionist', 'Receptionist'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    
    # Face recognition fields
    face_registered = models.BooleanField(default=False)
    face_id = models.CharField(max_length=255, blank=True, null=True)
    person_id = models.CharField(max_length=255, blank=True, null=True)
    last_face_login = models.DateTimeField(blank=True, null=True)
    
    # OAuth provider information
    oauth_provider = models.CharField(max_length=50, blank=True, null=True)
    oauth_provider_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Activity tracking
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    is_new_user = models.BooleanField(default=True)
    consent_version = models.CharField(max_length=10, blank=True, null=True)
    consent_date = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user'  # Keep the same table name as default Django user model
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        app_label = 'tenants'
    
    def __str__(self):
        return f"{self.username} ({self.get_full_name() or self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()
    
    def get_display_name(self):
        """Return a user-friendly display name."""
        if self.get_full_name():
            return self.get_full_name()
        elif self.email:
            return self.email
        else:
            return self.username
    
    def has_face_recognition(self):
        """Check if user has face recognition enabled."""
        return self.face_registered and self.face_id and self.person_id