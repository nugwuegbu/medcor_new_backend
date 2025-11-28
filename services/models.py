"""
Services models for hospital services management
"""
import uuid
from django.db import models
from django.utils import timezone


class Service(models.Model):
    """
    Model to store hospital services
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='hospital_services',
        help_text="Hospital offering this service"
    )
    service_name = models.CharField(
        max_length=200,
        help_text="Name of the service"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Price of the service in the hospital's currency"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', 'service_name']),
        ]
    
    def __str__(self):
        return f"{self.service_name} - {self.hospital.name}"
    
    def __repr__(self):
        return f"<Service: {self.service_name} ({self.hospital.name})>"