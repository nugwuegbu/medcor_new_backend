"""
Core models for user authentication and role management.
Implements custom User model with multi-tenant support.
"""

import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for multi-tenant healthcare platform."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError("Users must have an email address")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "SUPERADMIN")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with multi-tenant support and role-based access control.
    Each user belongs to a hospital (tenant) and has a specific role.
    """

    ROLE_CHOICES = [
        ("SUPERADMIN", "Super Admin"),  # Platform administrator
        ("ADMIN", "Hospital Admin"),  # Hospital administrator
        ("DOCTOR", "Doctor"),  # Medical doctor
        ("NURSE", "Nurse"),  # Nurse staff
        ("PATIENT", "Patient"),  # Patient user
        ("STAFF", "Staff"),  # Other hospital staff
    ]

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)

    # Personal information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    # Address information
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    # Role and permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="PATIENT")

    # Hospital relationship (required for all users except SUPERADMIN)
    hospital = models.ForeignKey(
        "tenants.Hospital",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
        help_text="Hospital this user belongs to (not required for SUPERADMIN)",
    )

    # Professional information (for doctors/nurses)
    license_number = models.CharField(max_length=100, blank=True)
    specialization = models.ForeignKey(
        "specialty.Specialty",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctors",
        help_text="Medical specialization (defaults to General Medicine for doctors)"
    )
    department = models.CharField(max_length=200, blank=True)
    years_of_experience = models.IntegerField(null=True, blank=True)

    # Profile
    profile_picture = models.ImageField(upload_to="profiles/", null=True, blank=True)
    bio = models.TextField(blank=True)
    
    # Social media URLs
    linkedin_url = models.URLField(blank=True, help_text="LinkedIn profile URL")
    facebook_url = models.URLField(blank=True, help_text="Facebook profile URL")
    twitter_url = models.URLField(blank=True, help_text="Twitter/X profile URL")

    # Account status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Additional settings
    preferred_language = models.CharField(max_length=10, default="en")
    timezone = models.CharField(max_length=50, default="UTC")

    # Emergency contact (for patients)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)

    # Medical information (for patients)
    blood_type = models.CharField(max_length=10, blank=True)
    allergies = models.TextField(blank=True)
    medical_conditions = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["hospital"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self):
        """Return the full name of the user."""
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        """Return the short name of the user."""
        return self.first_name

    @property
    def is_doctor(self):
        """Check if user is a doctor."""
        return self.role == "DOCTOR"

    @property
    def is_patient(self):
        """Check if user is a patient."""
        return self.role == "PATIENT"

    @property
    def is_admin(self):
        """Check if user is an admin."""
        return self.role in ["ADMIN", "SUPERADMIN"]

    @property
    def is_hospital_staff(self):
        """Check if user is hospital staff."""
        return self.role in ["DOCTOR", "NURSE", "STAFF", "ADMIN"]

    def save(self, *args, **kwargs):
        """Override save to set default specialization for doctors."""
        # Set default specialization for doctors if not specified
        if self.role == "DOCTOR" and not self.specialization_id and self.hospital:
            from specialty.models import Specialty
            default_specialty = Specialty.get_default_specialty(self.hospital)
            self.specialization = default_specialty
        
        super().save(*args, **kwargs)


class Certification(models.Model):
    """
    Certification model for storing user certifications and licenses.
    One user can have many certifications.
    """
    
    CERTIFICATION_TYPE_CHOICES = [
        ("PROFESSIONAL_CERTIFICATION", "Professional Certification"),
        ("MEDICAL_LICENSE", "Medical License"),
        ("TRAINING_CERTIFICATE", "Training Certificate"),
        ("SPECIALTY_BOARD", "Specialty Board"),
        ("CV_RESUME", "CV/Resume"),
        ("OTHERS", "Others"),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="certifications",
        help_text="User who owns this certification"
    )
    
    # Certification details
    certification_name = models.CharField(
        max_length=255,
        help_text="Name of the certification"
    )
    certification_type = models.CharField(
        max_length=50,
        choices=CERTIFICATION_TYPE_CHOICES,
        help_text="Type of certification"
    )
    certification_license_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="License or certification ID number"
    )
    
    # Dates
    issue_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when certification was issued"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when certification expires (if applicable)"
    )
    
    # File upload
    file_document = models.FileField(
        upload_to="certifications/",
        null=True,
        blank=True,
        help_text="Uploaded certification document"
    )
    
    # Additional information
    issuing_authority = models.CharField(
        max_length=255,
        blank=True,
        help_text="Organization that issued the certification"
    )
    description = models.TextField(
        blank=True,
        help_text="Additional details about the certification"
    )
    
    # Status and verification
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this certification has been verified"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this certification is currently active"
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "certifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["certification_type"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["is_verified"]),
        ]
        verbose_name = "Certification"
        verbose_name_plural = "Certifications"
    
    def __str__(self):
        return f"{self.certification_name} - {self.user.get_full_name()}"
    
    @property
    def is_expired(self):
        """Check if certification is expired."""
        if not self.expiry_date:
            return False
        return timezone.now().date() > self.expiry_date
    
    @property
    def days_until_expiry(self):
        """Get number of days until expiry."""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - timezone.now().date()
        return delta.days
    
    def clean(self):
        """Validate certification data."""
        from django.core.exceptions import ValidationError
        
        # Check if expiry date is after issue date
        if self.issue_date and self.expiry_date:
            if self.expiry_date <= self.issue_date:
                raise ValidationError("Expiry date must be after issue date.")
