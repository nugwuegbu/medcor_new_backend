"""
Admin configuration for ChatWidget models.
"""

from django.contrib import admin
from .models import (
    ChatWidgetCustomization,
    Theme,
    Features,
    Avatar,
    AvartaVideos,
    Voice,
    VoiceSettings,
    AvartaCollect,
)


@admin.register(ChatWidgetCustomization)
class ChatWidgetCustomizationAdmin(admin.ModelAdmin):
    """Admin for ChatWidgetCustomization model."""
    
    list_display = [
        "hospital",
        "created_at",
        "updated_at",
    ]
    list_filter = [
        "created_at",
        "updated_at",
    ]
    search_fields = ["hospital__name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    """Admin for Theme model."""
    
    list_display = [
        "chatwidget_customization",
        "primary_color",
        "secondary_color",
        "created_at",
    ]
    list_filter = [
        "created_at",
        "updated_at",
    ]
    search_fields = ["chatwidget_customization__hospital__name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Features)
class FeaturesAdmin(admin.ModelAdmin):
    """Admin for Features model."""
    
    list_display = [
        "chatwidget_customization",
        "face_analysis",
        "hair_analysis",
        "skin_analysis",
        "created_at",
    ]
    list_filter = [
        "face_analysis",
        "hair_analysis",
        "skin_analysis",
        "lips_analysis",
        "hair_extension_analysis",
        "created_at",
    ]
    search_fields = ["chatwidget_customization__hospital__name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Avatar)
class AvatarAdmin(admin.ModelAdmin):
    """Admin for Avatar model."""
    
    list_display = [
        "chatwidget_customization",
        "avarta_interaction_type",
        "created_at",
    ]
    list_filter = [
        "avarta_interaction_type",
        "created_at",
    ]
    search_fields = ["chatwidget_customization__hospital__name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Voice)
class VoiceAdmin(admin.ModelAdmin):
    """Admin for Voice model."""
    
    list_display = [
        "chatwidget_customization",
        "voice_id",
        "created_at",
    ]
    list_filter = [
        "voice_id",
        "created_at",
    ]
    search_fields = ["chatwidget_customization__hospital__name", "voice_id"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(AvartaVideos)
class AvartaVideosAdmin(admin.ModelAdmin):
    """Admin for AvartaVideos model."""

    list_display = [
        "avatar",
        "welcome_video",
        "speaking_video",
        "waiting_video",
    ]
    search_fields = ["avatar__chatwidget_customization__hospital__name"]
    readonly_fields = []


@admin.register(VoiceSettings)
class VoiceSettingsAdmin(admin.ModelAdmin):
    """Admin for VoiceSettings model."""

    list_display = [
        "voice",
        "stability",
        "similarity_boost",
        "style",
        "speed",
        "speaker_boost",
    ]
    list_filter = ["speaker_boost"]
    search_fields = ["voice__chatwidget_customization__hospital__name", "voice__voice_id"]
    readonly_fields = []


@admin.register(AvartaCollect)
class AvartaCollectAdmin(admin.ModelAdmin):
    """Admin for AvartaCollect model."""
    
    list_display = [
        "name",
        "hospital",
        "is_active",
        "usage_count",
        "created_at",
    ]
    list_filter = [
        "is_active",
        "created_at",
        "hospital",
    ]
    search_fields = [
        "name",
        "hospital__name",
    ]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Basic Information", {
            "fields": ("hospital", "name", "is_active")
        }),
        ("Video URLs", {
            "fields": (
                "talking_video_url",
                "waiting_video_url",
                "opening_video_url",
            )
        }),
        ("Duration (seconds)", {
            "fields": (
                "duration_talking",
                "duration_waiting",
                "duration_opening",
            )
        }),
        ("File Size (bytes)", {
            "fields": (
                "file_size_talking",
                "file_size_waiting",
                "file_size_opening",
            )
        }),
        ("Metadata", {
            "fields": ("usage_count", "created_at", "updated_at")
        }),
    )