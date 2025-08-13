from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AnalysisTracking(models.Model):
    """Model to track patient usage of analysis services"""
    ANALYSIS_TYPE_CHOICES = [
        ('face', 'Face Analysis'),
        ('hair', 'Hair Analysis'),
        ('lips', 'Lips Analysis'),
        ('skin', 'Skin Analysis'),
        ('hair_extension', 'Hair Extension'),
    ]
    
    WIDGET_LOCATION_CHOICES = [
        ('chat_widget', 'Chat Widget'),
        ('dashboard', 'Dashboard'),
        ('mobile_app', 'Mobile App'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analysis_tracking', null=True, blank=True)
    tenant_id = models.IntegerField(null=True, blank=True, db_index=True)  # Store tenant ID as integer
    session_id = models.CharField(max_length=255)
    analysis_type = models.CharField(max_length=50, choices=ANALYSIS_TYPE_CHOICES)
    widget_location = models.CharField(max_length=50, choices=WIDGET_LOCATION_CHOICES, default='chat_widget')
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'analysis_type']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"{self.patient} - {self.analysis_type} - {self.created_at}"
