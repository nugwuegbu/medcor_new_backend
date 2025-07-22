from django.db import models
from ckeditor.fields import RichTextField
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tenants.models import Client


class Treatment(models.Model):
    """Treatment model for medical procedures and services."""
    
    tenant = models.ForeignKey(
        'tenants.Client',
        on_delete=models.CASCADE,
        related_name='treatments'
    )
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='treatments/', blank=True, null=True)
    description = RichTextField(blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # type: ignore
    
    # Type annotation for Django ORM manager
    objects = models.Manager()
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Treatment'
        verbose_name_plural = 'Treatments'
    
    def __str__(self):
        return f"{self.name} - ${self.cost}"