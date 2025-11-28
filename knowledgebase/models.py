import uuid
from django.db import models
from django.contrib.auth import get_user_model
from tenants.models import Hospital

User = get_user_model()


class Ai_Identity(models.Model):
    """AI Identity model for managing AI agents per hospital"""
    id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        primary_key=True,
        serialize=False,
    )
    hospital = models.OneToOneField(
        Hospital,
        on_delete=models.CASCADE,
        related_name='ai_identity'
    )
    agent_name = models.CharField(max_length=100)
    agent_title = models.CharField(max_length=200)
    system_prompt = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI Identity"
        verbose_name_plural = "AI Identities"
        ordering = ['hospital', 'agent_name']

    def __str__(self):
        return f"{self.agent_name} - {self.hospital.name}"


class Behavior(models.Model):
    """Behavior model for managing AI behavior configurations per hospital"""
    COMMUNICATION_TONE_CHOICES = [
        ('Empathic', 'Empathic'),
        ('Authoritative', 'Authoritative'),
        ('Casual', 'Casual'),
        ('Friendly', 'Friendly'),
        ('Professional', 'Professional'),
    ]
    
    COMMUNICATION_STYLE_CHOICES = [
        ('Conversational', 'Conversational'),
        ('Technical & Clinical', 'Technical & Clinical'),
        ('Detailed & Thorough', 'Detailed & Thorough'),
        ('Concise & Direct', 'Concise & Direct'),
    ]
    
    CONFIDENCE_LEVEL_CHOICES = [
        ('Conservative', 'Conservative'),
        ('Balanced', 'Balanced'),
        ('Confident', 'Confident'),
    ]
    
    RESPONSE_LENGTH_CHOICES = [
        ('Short', 'Short'),
        ('Medium', 'Medium'),
        ('Long', 'Long'),
        ('Adaptive', 'Adaptive'),
    ]

    id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        primary_key=True,
        serialize=False,
    )
    hospital = models.OneToOneField(
        Hospital,
        on_delete=models.CASCADE,
        related_name='behavior'
    )
    communication_tone = models.CharField(
        max_length=20,
        choices=COMMUNICATION_TONE_CHOICES,
        default='Professional'
    )
    communication_style = models.CharField(
        max_length=20,
        choices=COMMUNICATION_STYLE_CHOICES,
        default='Conversational'
    )
    confidence_level = models.CharField(
        max_length=20,
        choices=CONFIDENCE_LEVEL_CHOICES,
        default='Balanced'
    )
    response_length = models.CharField(
        max_length=20,
        choices=RESPONSE_LENGTH_CHOICES,
        default='Medium'
    )
    enable_follow_up_questions = models.BooleanField(
        default=True,
        help_text="Enable AI to ask follow-up questions for better understanding"
    )
    enable_appointment_booking = models.BooleanField(
        default=True,
        help_text="Enable AI to assist with appointment booking"
    )
    enable_personalization = models.BooleanField(
        default=True,
        help_text="Enable AI to personalize responses based on user history"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Behavior"
        verbose_name_plural = "Behaviors"
        ordering = ['hospital', 'communication_tone']

    def __str__(self):
        return f"{self.hospital.name} - {self.communication_tone} {self.communication_style}"


class Response(models.Model):
    """Response model for managing AI response templates per hospital"""
    id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        primary_key=True,
        serialize=False,
    )
    hospital = models.OneToOneField(
        Hospital,
        on_delete=models.CASCADE,
        related_name='response'
    )
    greeting_message = models.TextField(
        help_text="Welcome message for new users"
    )
    appointment_booking = models.TextField(
        help_text="Response template for appointment booking inquiries"
    )
    general_inquiries = models.TextField(
        help_text="Response template for general medical inquiries"
    )
    fallback_response = models.TextField(
        help_text="Default response when no specific template matches"
    )
    emergency_response = models.TextField(
        help_text="Response template for emergency situations"
    )
    business_hours = models.TextField(
        help_text="Information about hospital business hours"
    )
    medical_specialties = models.TextField(
        help_text="Information about available medical specialties"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Response"
        verbose_name_plural = "Responses"
        ordering = ['hospital', 'created_at']

    def __str__(self):
        return f"{self.hospital.name} - Response Templates"


class Source(models.Model):
    """Source model for managing source files per hospital"""
    id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        primary_key=True,
        serialize=False,
    )
    hospital = models.OneToOneField(
        Hospital,
        on_delete=models.CASCADE,
        related_name='source'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_files_count(self):
        """Get the count of associated source files"""
        return self.source_files.count()
    
    def get_files(self):
        """Get all associated source files"""
        return self.source_files.filter(is_active=True)

    class Meta:
        verbose_name = "Source"
        verbose_name_plural = "Sources"
        ordering = ['hospital', 'created_at']

    def __str__(self):
        return f"{self.hospital.name} - Source Files"


class SourceFile(models.Model):
    """Individual source file model for multiple file uploads"""
    id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        primary_key=True,
        serialize=False,
    )
    source = models.ForeignKey(
        Source,
        on_delete=models.CASCADE,
        related_name='source_files'
    )
    file = models.FileField(
        upload_to='knowledgebase/sources/%Y/%m/%d/',
        help_text="Source file for knowledge base"
    )
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    file_type = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Source File"
        verbose_name_plural = "Source Files"
        ordering = ['source', 'created_at']

    def __str__(self):
        return f"{self.source.hospital.name} - {self.file_name or self.file.name}"

    def save(self, *args, **kwargs):
        if self.file:
            self.file_name = self.file.name
            self.file_size = self.file.size
            # Extract file type from extension
            if '.' in self.file.name:
                self.file_type = self.file.name.split('.')[-1].lower()
        super().save(*args, **kwargs)