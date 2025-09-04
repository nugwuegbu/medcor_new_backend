"""
Simplified Hospital models without complex multi-tenancy.
Provides basic hospital information for the system.
"""

import uuid

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Hospital(models.Model):
    """Simplified Hospital model for basic hospital information."""

    HOSPITAL_TYPE_CHOICES = [
        ("GENERAL", "General Hospital"),
        ("SPECIALTY", "Specialty Hospital"),
        ("CLINIC", "Clinic"),
        ("MEDICAL_CENTER", "Medical Center"),
        ("URGENT_CARE", "Urgent Care"),
        ("REHABILITATION", "Rehabilitation Center"),
        ("PSYCHIATRIC", "Psychiatric Hospital"),
        ("CHILDREN", "Children's Hospital"),
        ("WOMEN", "Women's Hospital"),
        ("CANCER", "Cancer Center"),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)

    # Basic information
    hospital_type = models.CharField(
        max_length=20, choices=HOSPITAL_TYPE_CHOICES, default="GENERAL"
    )
    description = models.TextField(blank=True)

    # Contact information
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="United States")
    postal_code = models.CharField(max_length=20)

    # Location
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    # Hospital details
    bed_count = models.IntegerField(null=True, blank=True)
    emergency_services = models.BooleanField(default=True)
    trauma_center_level = models.CharField(max_length=10, blank=True)

    # Operating hours
    operating_hours = models.JSONField(default=dict, blank=True)
    # Example: {"monday": "8:00-18:00", "tuesday": "8:00-18:00", ...}

    # Services offered
    services = models.JSONField(default=list, blank=True)
    # Example: ["Cardiology", "Pediatrics", "Emergency Medicine", ...]

    # Accreditation and licenses
    accreditations = models.JSONField(default=list, blank=True)
    license_number = models.CharField(max_length=100, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hospitals"
        ordering = ["name"]
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["hospital_type"]),
            models.Index(fields=["city", "state"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name

    def get_full_address(self):
        """Return the complete address as a string."""
        address_parts = [self.address_line1]
        if self.address_line2:
            address_parts.append(self.address_line2)
        address_parts.extend([self.city, self.state, self.postal_code, self.country])
        return ", ".join(filter(None, address_parts))

    def get_location_coordinates(self):
        """Return location as tuple (latitude, longitude) if available."""
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None

    @property
    def is_emergency_capable(self):
        """Check if hospital provides emergency services."""
        return self.emergency_services

    @property
    def is_trauma_center(self):
        """Check if hospital is a trauma center."""
        return bool(self.trauma_center_level)

    def save(self, *args, **kwargs):
        """Auto-generate a unique slug from name if missing or duplicate."""
        if not self.slug and self.name:
            base_slug = slugify(self.name) or "hospital"
            unique_slug = base_slug
            suffix = 1
            while (
                Hospital.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists()
            ):
                suffix += 1
                unique_slug = f"{base_slug}-{suffix}"
            self.slug = unique_slug
        else:
            # Ensure existing slug remains unique if name or slug changed
            if self.slug:
                base_slug = slugify(self.slug)
                unique_slug = base_slug
                suffix = 1
                while (
                    Hospital.objects.filter(slug=unique_slug)
                    .exclude(pk=self.pk)
                    .exists()
                ):
                    suffix += 1
                    unique_slug = f"{base_slug}-{suffix}"
                self.slug = unique_slug
        super().save(*args, **kwargs)
