"""
Chat, Voice, and Avatar-related models for the core app.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import json

User = get_user_model()


class ChatSession(models.Model):
    """Chat session management."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_sessions')
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chat_sessions',
        help_text='Hospital this chat session belongs to'
    )
    
    # Session metadata
    language = models.CharField(max_length=10, default='en')
    conversation_state = models.JSONField(default=dict, blank=True)
    location_weather = models.CharField(max_length=255, blank=True)
    
    # Avatar session data
    avatar_session_id = models.CharField(max_length=255, blank=True)
    avatar_status = models.CharField(max_length=50, default='inactive')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Chat Session {self.session_id}"


class ChatMessage(models.Model):
    """Individual chat messages."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    
    # Message content
    message = models.TextField()
    response = models.TextField()
    
    # Voice and avatar data
    voice_command = models.JSONField(null=True, blank=True)
    avatar_response = models.JSONField(null=True, blank=True)
    
    # Metadata
    language = models.CharField(max_length=10, default='en')
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
        ]
    
    def __str__(self):
        return f"Message in session {self.session.session_id} at {self.timestamp}"


class FaceRecognition(models.Model):
    """Face recognition data for users."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_recognition')
    
    # Face data (encrypted in production)
    face_encoding = models.TextField()  # Base64 encoded face data
    face_id = models.CharField(max_length=255, unique=True)
    
    # Additional metadata
    confidence_threshold = models.FloatField(default=0.7)
    last_recognized = models.DateTimeField(null=True, blank=True)
    recognition_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['face_id']),
        ]
    
    def __str__(self):
        return f"Face recognition for {self.user.email}"


class AvatarRecording(models.Model):
    """Avatar recording sessions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='recordings')
    
    # Recording data
    recording_id = models.CharField(max_length=255, unique=True)
    file_url = models.URLField(blank=True)
    duration = models.FloatField(null=True, blank=True)  # in seconds
    
    # Status
    status = models.CharField(max_length=50, default='pending')
    
    created_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recording {self.recording_id}"


class AnalysisReport(models.Model):
    """Analysis reports (face, hair, skin)."""
    REPORT_TYPES = [
        ('face', 'Face Analysis'),
        ('hair', 'Hair Analysis'),
        ('skin', 'Skin Analysis'),
        ('lips', 'Lips Analysis'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analysis_reports')
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='analysis_reports',
        help_text='Hospital this analysis report belongs to'
    )
    
    # Report details
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    analysis_data = models.JSONField()
    recommendations = models.TextField(blank=True)
    
    # PDF report
    pdf_url = models.URLField(blank=True)
    
    # Patient information (for report generation)
    patient_name = models.CharField(max_length=200)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20, blank=True)
    patient_job = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'report_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.report_type} report for {self.patient_name}"


class ConsentRecord(models.Model):
    """User consent tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consent_records', null=True, blank=True)
    session_id = models.CharField(max_length=255)
    
    # Consent details
    accepted_terms = models.BooleanField(default=False)
    accepted_privacy = models.BooleanField(default=False)
    accepted_disclaimer = models.BooleanField(default=False)
    
    # Metadata
    version = models.CharField(max_length=20)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Timestamps
    granted_at = models.DateTimeField(default=timezone.now)
    revoked_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-granted_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Consent for {self.user.email if self.user else 'Anonymous'} at {self.granted_at}"
    
    def revoke(self):
        """Revoke consent."""
        self.is_active = False
        self.revoked_at = timezone.now()
        self.save()