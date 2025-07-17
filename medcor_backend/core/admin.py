from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Doctor, Appointment, ChatMessage, FaceRecognitionLog, FaceAnalysisReport, HairAnalysisReport


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin."""
    
    list_display = ['email', 'name', 'role', 'is_active', 'face_registered', 'created_at']
    list_filter = ['role', 'is_active', 'face_registered', 'created_at']
    search_fields = ['email', 'name', 'username']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('name', 'phone_number', 'role', 'profile_picture', 'preferred_language')
        }),
        ('Face Recognition', {
            'fields': ('face_id', 'person_id', 'face_registered', 'face_login_enabled', 'last_face_login')
        }),
        ('OAuth', {
            'fields': ('oauth_provider', 'oauth_provider_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """Doctor admin."""
    
    list_display = ['name', 'specialty', 'experience', 'available']
    list_filter = ['specialty', 'available']
    search_fields = ['name', 'specialty']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'specialty', 'experience', 'available')
        }),
        ('Details', {
            'fields': ('education', 'bio', 'description', 'photo')
        }),
        ('Avatar', {
            'fields': ('avatar_id',)
        }),
    )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Appointment admin."""
    
    list_display = ['patient_name', 'doctor', 'appointment_date', 'status', 'created_at']
    list_filter = ['status', 'appointment_date', 'created_at']
    search_fields = ['patient_name', 'patient_email', 'doctor__name']
    ordering = ['-appointment_date']
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient_name', 'patient_email', 'patient_phone')
        }),
        ('Appointment Details', {
            'fields': ('doctor', 'appointment_date', 'appointment_time', 'reason')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ['created_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Chat message admin."""
    
    list_display = ['user', 'session_id', 'language', 'speaker_type', 'created_at']
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
            'fields': ('face_recognition_data',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
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
            'fields': ('face_id', 'recognition_status', 'confidence', 'detected_language')
        }),
        ('Privacy', {
            'fields': ('image_hash',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
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
            'fields': ('patient_name', 'patient_email', 'patient_phone', 'patient_job')
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
    
    list_display = ['user', 'hair_type', 'hair_condition', 'confidence', 'created_at']
    list_filter = ['hair_type', 'hair_condition', 'created_at']
    search_fields = ['user__name', 'session_id']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Session', {
            'fields': ('session_id', 'user')
        }),
        ('Analysis Results', {
            'fields': ('hair_type', 'hair_condition', 'scalp_health', 'confidence')
        }),
        ('Recommendations', {
            'fields': ('recommendations',)
        }),
        ('Technical', {
            'fields': ('analysis_result', 'image_hash')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']