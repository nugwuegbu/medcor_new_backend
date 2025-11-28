"""
ChatWidget Customization models for hospital-specific chat widget configurations.
"""

import uuid
from django.db import models
from django.utils import timezone
from tenants.models import Hospital


class ChatWidgetCustomization(models.Model):
    """
    Main model for chat widget customization.
    One-to-one relationship with Hospital.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.OneToOneField(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='chatwidget_customization'
    )
    
    is_customized = models.BooleanField(default=False,null=True,blank=True)
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "chatwidget_customizations"
        ordering = ["-created_at"]
        verbose_name = "Chat Widget Customization"
        verbose_name_plural = "Chat Widget Customizations"
    
    def __str__(self):
        return f"ChatWidget Customization for {self.hospital.name}"


class Theme(models.Model):
    """
    Theme configuration for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatwidget_customization = models.OneToOneField(
        ChatWidgetCustomization,
        on_delete=models.CASCADE,
        related_name='theme'
    )
    
    # Theme fields - all nullable as requested
    company_logo = models.CharField(max_length=500, null=True, blank=True,default="https://api.medcor.ai/static/videos_images/1_medcor_Color_logo_with_background.jpg")  # File path to logo
    primary_color = models.CharField(max_length=7, null=True, blank=True,default="#7c3aed")  # Hex color
    secondary_color = models.CharField(max_length=7, null=True, blank=True,default="#a855f7")  # Hex color
    accent_color = models.CharField(max_length=7, null=True, blank=True,default="#3b82f6")  # Hex color
    background_color = models.CharField(max_length=7, null=True, blank=True,default="#ffffff")  # Hex color
    text_color = models.CharField(max_length=7, null=True, blank=True,default="#1f2937")  # Hex color
    user_message_background = models.CharField(max_length=7, null=True, blank=True,default="#dbeafe")  # Hex color
    assistant_message_background = models.CharField(max_length=7, null=True, blank=True,default="#ffffff")  # Hex color
    message_overlay_color = models.CharField(max_length=7, null=True, blank=True,default="#7c3aed")  # Hex color
    input_background = models.CharField(max_length=7, null=True, blank=True,default="#f3f4f6")  # Hex color
    glow_border_color = models.CharField(max_length=7, null=True, blank=True,default="#7c3aed")  # Hex color
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "chatwidget_themes"
        verbose_name = "Theme"
        verbose_name_plural = "Themes"
    
    def __str__(self):
        return f"Theme for {self.chatwidget_customization.hospital.name}"


class Features(models.Model):
    """
    Features configuration for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatwidget_customization = models.OneToOneField(
        ChatWidgetCustomization,
        on_delete=models.CASCADE,
        related_name='features'
    )
    
    # Features fields - all nullable as requested
    
    face_analysis = models.BooleanField(null=True, blank=True,default=False)
    hair_analysis = models.BooleanField(null=True, blank=True,default=False)
    skin_analysis = models.BooleanField(null=True, blank=True,default=False)
    lips_analysis = models.BooleanField(null=True, blank=True,default=False)
    hair_extension_analysis = models.BooleanField(null=True, blank=True,default=False)
    dental_analysis = models.BooleanField(null=True, blank=True,default=False)
    doctors_profiles = models.BooleanField(null=True, blank=True,default=False)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "chatwidget_features"
        verbose_name = "Features"
        verbose_name_plural = "Features"
    
    def __str__(self):
        return f"Features for {self.chatwidget_customization.hospital.name}"


class Avatar(models.Model):
    """
    Avatar configuration for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatwidget_customization = models.OneToOneField(
        ChatWidgetCustomization,
        on_delete=models.CASCADE,
        related_name='avatar'
    )
    avarta_interaction_type = models.CharField(max_length=50, null=True, blank=True,default="video_voice")
    # Avatar fields - all nullable as requested
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "chatwidget_avatars"
        verbose_name = "Avatar"
        verbose_name_plural = "Avatars"
    
    def __str__(self):
        return f"Avatar for {self.chatwidget_customization.hospital.name}"


class Voice(models.Model):
    """
    Voice configuration for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatwidget_customization = models.OneToOneField(
        ChatWidgetCustomization,
        on_delete=models.CASCADE,
        related_name='voice'
    )
    
    # Voice fields - all nullable as requested
    voice_id = models.CharField(max_length=50, null=True, blank=True, default="1bZ0JxGqk8mRr9GLteEV")
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "chatwidget_voices"
        verbose_name = "Voice"
        verbose_name_plural = "Voices"
    
    def __str__(self):
        return f"Voice for {self.chatwidget_customization.hospital.name}"



class VoiceSettings(models.Model):
    """
    Voice settings for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice = models.OneToOneField(
        Voice,
        on_delete=models.CASCADE,
        related_name='voice_settings'
    )
    stability = models.FloatField(null=True, blank=True,default=0.8)
    similarity_boost = models.FloatField(null=True, blank=True,default=0.7)
    style = models.FloatField(null=True, blank=True,default=0.0)
    speed = models.FloatField(null=True, blank=True,default=1.0)
    speaker_boost = models.BooleanField(null=True, blank=True,default=False)
    
    class Meta:
        db_table = "chatwidget_voice_settings"
        verbose_name = "Voice Settings"
        verbose_name_plural = "Voice Settings"




class AvartaVideos(models.Model):
    """
    Avarta videos for chat widget.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.OneToOneField(
        Avatar,
        on_delete=models.CASCADE,
        related_name='avarta_videos'
    )
    welcome_video = models.CharField(max_length=250, null=True, blank=True,default="https://api.medcor.ai/static/videos_images/welcome_2_org.mp4")
    speaking_video = models.CharField(max_length=250, null=True, blank=True,default="https://api.medcor.ai/static/videos_images/speaking_avatar_2_org.mp4")
    waiting_video = models.CharField(max_length=250, null=True, blank=True,default="https://api.medcor.ai/static/videos_images/doctor_waitin_2.mp4")
    
    class Meta:
        db_table = "chatwidget_avarta_videos"
        verbose_name = "Avatar Videos"
        verbose_name_plural = "Avatar Videos"


class AvartaCollect(models.Model):
    """
    Avatar collection for chat widget video assets.
    Stores uploaded media plus duration/file-size metadata per hospital.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="avarta_collects",
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        default="Professional Doctor Avatar",
    )

    talking_video_url = models.FileField(
        upload_to="chatwidget/avatars/talking/",
        null=True,
        blank=True,
    )
    waiting_video_url = models.FileField(
        upload_to="chatwidget/avatars/waiting/",
        null=True,
        blank=True,
    )
    opening_video_url = models.FileField(
        upload_to="chatwidget/avatars/opening/",
        null=True,
        blank=True,
    )

    duration_talking = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=15,
    )
    duration_waiting = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=8,
    )
    duration_opening = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=10,
    )

    file_size_talking = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=2_500_000,
    )
    file_size_waiting = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=1_800_000,
    )
    file_size_opening = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=2_200_000,
    )

    usage_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chatwidget_avarta_collects"
        ordering = ["-created_at"]
        verbose_name = "Avatar Collection"
        verbose_name_plural = "Avarta Collections"
        indexes = [
            models.Index(fields=["hospital", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.hospital.name})"