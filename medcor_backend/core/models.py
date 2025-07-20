from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
import json


# User model moved to tenants app for multi-tenant support
# class User(AbstractUser):
#     ROLE_CHOICES = [
#         ('patient', 'Patient'),
#         ('doctor', 'Doctor'),
#         ('admin', 'Admin'),
#         ('clinic', 'Clinic'),
#     ]
#     
#     email = models.EmailField(unique=True)
#     phone_number = models.CharField(max_length=20, blank=True, null=True)
#     name = models.CharField(max_length=100)
#     profile_picture = models.TextField(blank=True, null=True)
#     preferred_language = models.CharField(max_length=10, default='en')
#     
#     # Face recognition fields
#     face_id = models.CharField(max_length=255, blank=True, null=True)
#     person_id = models.CharField(max_length=255, blank=True, null=True)
#     last_face_login = models.DateTimeField(blank=True, null=True)
#     face_login_enabled = models.BooleanField(default=False)
#     face_registered = models.BooleanField(default=False)
#     
#     # OAuth fields
#     oauth_provider = models.CharField(max_length=50, blank=True, null=True)
#     oauth_provider_id = models.CharField(max_length=255, blank=True, null=True)
#     
#     # User management fields
#     last_login = models.DateTimeField(blank=True, null=True)
#     is_new_user = models.BooleanField(default=True)
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
#     is_active = models.BooleanField(default=True)
#     email_verified = models.BooleanField(default=False)
#     
#     # Password reset fields
#     reset_password_token = models.CharField(max_length=255, blank=True, null=True)
#     reset_password_expires = models.DateTimeField(blank=True, null=True)
#     
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['username', 'name']
#     
#     def __str__(self):
#         return f"{self.name} ({self.email})"


class Doctor(models.Model):
    name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100)
    experience = models.IntegerField()
    education = models.TextField()
    photo = models.TextField()
    bio = models.TextField()
    description = models.TextField(blank=True, null=True, help_text="Short hover description for HeyGen")
    avatar_id = models.CharField(max_length=255, blank=True, null=True, help_text="HeyGen avatar ID")
    available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Dr. {self.name} - {self.specialty}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    patient_name = models.CharField(max_length=100)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    appointment_time = models.CharField(max_length=20)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient_name} - {self.doctor.name} on {self.appointment_date}"


class ChatMessage(models.Model):
    SPEAKER_CHOICES = [
        ('nurse', 'Nurse'),
        ('doctor', 'Doctor'),
    ]
    
    session_id = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=True, null=True)
    message = models.TextField()
    response = models.TextField()
    avatar_response = models.JSONField(blank=True, null=True)
    language = models.CharField(max_length=10, default='en')
    speaker_type = models.CharField(max_length=20, choices=SPEAKER_CHOICES, default='nurse')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, blank=True, null=True)
    face_recognition_data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.user.name if self.user else 'Anonymous'} at {self.created_at}"


class FaceRecognitionLog(models.Model):
    RECOGNITION_STATUS_CHOICES = [
        ('recognized', 'Recognized'),
        ('new_face', 'New Face'),
        ('failed', 'Failed'),
    ]
    
    session_id = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=True, null=True)
    face_id = models.CharField(max_length=255)
    confidence = models.IntegerField(help_text="Confidence score 0-100")
    detected_language = models.CharField(max_length=10, blank=True, null=True)
    image_hash = models.CharField(max_length=255, help_text="Hash of image for privacy")
    recognition_status = models.CharField(max_length=20, choices=RECOGNITION_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Face recognition log for {self.user.name if self.user else 'Unknown'}"


class FaceAnalysisReport(models.Model):
    patient_name = models.CharField(max_length=100)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20)
    patient_job = models.CharField(max_length=100)
    analysis_result = models.JSONField()
    pdf_path = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Face analysis for {self.patient_name}"


class HairAnalysisReport(models.Model):
    session_id = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=True, null=True)
    hair_type = models.CharField(max_length=100)
    hair_condition = models.CharField(max_length=100)
    scalp_health = models.CharField(max_length=100)
    recommendations = models.JSONField()
    confidence = models.IntegerField(help_text="Confidence score 0-100")
    analysis_result = models.JSONField(help_text="Full YCE response")
    image_hash = models.CharField(max_length=255, help_text="Hash of image for privacy")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Hair analysis for {self.user.name if self.user else 'Anonymous'}"