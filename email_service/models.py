"""
Email service models for tracking email requests and status.
"""

from django.db import models
from django.utils import timezone
import uuid


class EmailRequest(models.Model):
    """Model to track email requests and their status."""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Contact information
    full_name = models.CharField(max_length=200, blank=True)  # optional now
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    job_profession = models.CharField(max_length=200, blank=True)
    
    # Email content
    subject = models.CharField(max_length=200, default='Contact Form Submission')
    message = models.TextField(blank=True)
    
    # File attachment
    file_attached = models.FileField(
        upload_to='email_attachments/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text='Optional file attachment'
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Task tracking
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'email_requests'
        ordering = ['-created_at']
        verbose_name = 'Email Request'
        verbose_name_plural = 'Email Requests'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Email from {self.full_name or 'N/A'} ({self.email}) - {self.status}"
    
    @property
    def has_attachment(self):
        """Check if email has a file attachment."""
        return bool(self.file_attached)
    
    @property
    def is_completed(self):
        """Check if email request is completed (sent or failed)."""
        return self.status in ['SENT', 'FAILED']
    
    @property
    def can_retry(self):
        """Check if email can be retried."""
        return self.status == 'FAILED' and self.retry_count < self.max_retries 