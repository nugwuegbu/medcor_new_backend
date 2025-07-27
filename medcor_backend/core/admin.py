from django.contrib import admin
from .models import ChatMessage, FaceRecognitionLog, FaceAnalysisReport, HairAnalysisReport

# User model is now handled by tenants app admin


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Chat message admin."""

    list_display = [
        'user', 'session_id', 'language', 'speaker_type', 'created_at'
    ]
    list_filter = ['language', 'speaker_type', 'created_at']
    search_fields = ['user__name', 'session_id', 'message']
    ordering = ['-created_at']

    fieldsets = (
        ('Session', {
            'fields': ('session_id', 'user')
        }),
        ('Message', {
            'fields': ('message', 'response', 'avatar_response')
        }),
        ('Settings', {
            'fields': ('language', 'speaker_type', 'doctor')
        }),
        ('Recognition', {
            'fields': ('face_recognition_data', )
        }),
        ('Timestamps', {
            'fields': ('created_at', )
        }),
    )

    readonly_fields = ['created_at']


@admin.register(FaceRecognitionLog)
class FaceRecognitionLogAdmin(admin.ModelAdmin):
    """Face recognition log admin."""

    list_display = ['user', 'recognition_status', 'confidence', 'created_at']
    list_filter = ['recognition_status', 'created_at']
    search_fields = ['user__name', 'session_id', 'face_id']
    ordering = ['-created_at']

    fieldsets = (
        ('Session', {
            'fields': ('session_id', 'user')
        }),
        ('Recognition', {
            'fields': ('face_id', 'recognition_status', 'confidence',
                       'detected_language')
        }),
        ('Privacy', {
            'fields': ('image_hash', )
        }),
        ('Timestamps', {
            'fields': ('created_at', )
        }),
    )

    readonly_fields = ['created_at']


@admin.register(FaceAnalysisReport)
class FaceAnalysisReportAdmin(admin.ModelAdmin):
    """Face analysis report admin."""

    list_display = ['patient_name', 'patient_email', 'created_at']
    list_filter = ['created_at']
    search_fields = ['patient_name', 'patient_email']
    ordering = ['-created_at']

    fieldsets = (
        ('Patient Information', {
            'fields':
            ('patient_name', 'patient_email', 'patient_phone', 'patient_job')
        }),
        ('Analysis', {
            'fields': ('analysis_result', 'pdf_path')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    readonly_fields = ['created_at', 'updated_at']


@admin.register(HairAnalysisReport)
class HairAnalysisReportAdmin(admin.ModelAdmin):
    """Hair analysis report admin."""

    list_display = [
        'user', 'hair_type', 'hair_condition', 'confidence', 'created_at'
    ]
    list_filter = ['hair_type', 'hair_condition', 'created_at']
    search_fields = ['user__name', 'session_id']
    ordering = ['-created_at']

    fieldsets = (
        ('Session', {
            'fields': ('session_id', 'user')
        }),
        ('Analysis Results', {
            'fields':
            ('hair_type', 'hair_condition', 'scalp_health', 'confidence')
        }),
        ('Recommendations', {
            'fields': ('recommendations', )
        }),
        ('Technical', {
            'fields': ('analysis_result', 'image_hash')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    readonly_fields = ['created_at', 'updated_at']
