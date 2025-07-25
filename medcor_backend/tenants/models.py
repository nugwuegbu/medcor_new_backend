from django.db import models
from django.contrib.auth.models import AbstractUser
from django_tenants.models import TenantMixin, DomainMixin
from tenant_users.tenants.models import TenantBase, UserProfile
from core.models import TimeStampedModel


class Client(TenantBase, TimeStampedModel):
    """
    Tenant model for multi-tenancy support.
    Each tenant represents a hospital/clinic using the system.
    """
    name = models.CharField(max_length=100)

    
    # Default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

    def __str__(self) -> str:
        return str(self.name)


class Domain(DomainMixin, TimeStampedModel):
    """
    Domain model for tenant routing.
    Each domain points to a specific tenant.
    """
    pass


class User(UserProfile):
    """
    Custom user model that extends django-tenant-users UserProfile.
    This model will be created in each tenant's schema for isolated user management.
    Uses email as the username field for authentication.
    """
    # Add many-to-many relationship with tenants
    #tenants = models.ManyToManyField(Client, blank=True, related_name='users')
    
    # Add standard user fields that UserProfile doesn't have
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    username = models.CharField(max_length=150, blank=True, null=True)
    
    # Use email as the username field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
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
    
    # Django admin fields (required for admin access)
    is_staff = models.BooleanField(default=False, help_text='Designates whether the user can log into the admin site.')
    is_superuser = models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.')
    
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
    
    def __str__(self):
        return f"{self.get_display_name()} ({str(self.email)})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return ""
    
    def get_display_name(self):
        """Return a user-friendly display name."""
        if self.get_full_name():
            return self.get_full_name()
        elif self.username:
            return self.username
        else:
            return str(self.email).split('@')[0] if self.email else 'User'
    
    def has_face_recognition(self):
        """Check if user has face recognition enabled."""
        return self.face_registered and self.face_id and self.person_id
    
    def has_perm(self, perm, obj=None):
        """
        Return True if the user has the specified permission.
        """
        if self.is_superuser:
            return True
        return False
    
    def has_module_perms(self, app_label):
        """
        Return True if the user has any permissions in the given app label.
        """
        if self.is_superuser:
            return True
        return False