from django.db import models
from django.contrib.auth.models import User
from ckeditor.fields import RichTextField

class Treatment(models.Model):
    """Medical treatment model for admin interface"""
    name = models.CharField(max_length=200, help_text="Treatment name")
    description = RichTextField(help_text="Detailed treatment description")
    cost = models.DecimalField(max_digits=10, decimal_places=2, help_text="Treatment cost in USD")
    duration_minutes = models.PositiveIntegerField(help_text="Duration in minutes")
    is_active = models.BooleanField(default=True, help_text="Is this treatment available?")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='treatments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Medical Treatment'
        verbose_name_plural = 'Medical Treatments'
    
    def __str__(self):
        return f"{self.name} - ${self.cost}"