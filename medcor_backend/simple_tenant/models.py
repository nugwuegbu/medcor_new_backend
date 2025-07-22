from django.db import models
from core.models import TimeStampedModel


class Tenant(TimeStampedModel):
    """
    Simple tenant model for hospital/clinic management.
    Each tenant represents a separate medical organization.
    """
    name = models.CharField(max_length=100, help_text="Hospital or clinic name")
    schema_name = models.CharField(max_length=63, unique=True, help_text="Database schema identifier")
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Medical Tenant"
        verbose_name_plural = "Medical Tenants"
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Domain(TimeStampedModel):
    """
    Domain routing for tenants.
    Each domain points to a specific medical tenant.
    """
    domain = models.CharField(max_length=253, unique=True, help_text="Domain name (e.g., clinic.example.com)")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='domains')
    is_primary = models.BooleanField(default=False, help_text="Primary domain for this tenant")
    
    class Meta:
        verbose_name = "Tenant Domain"
        verbose_name_plural = "Tenant Domains"
        ordering = ['domain']

    def __str__(self):
        return f"{self.domain} → {self.tenant.name}"

    def save(self, *args, **kwargs):
        # Ensure only one primary domain per tenant
        if self.is_primary:
            Domain.objects.filter(tenant=self.tenant, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)