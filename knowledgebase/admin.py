from django.contrib import admin
from .models import Ai_Identity, Behavior, Response, Source, SourceFile


@admin.register(Ai_Identity)
class Ai_IdentityAdmin(admin.ModelAdmin):
    list_display = [
        'agent_name', 'agent_title', 'hospital', 'is_active', 
        'created_at', 'updated_at'
    ]
    list_filter = ['is_active', 'hospital', 'created_at']
    search_fields = ['agent_name', 'agent_title', 'system_prompt', 'hospital__name']
    ordering = ['hospital', 'agent_name']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('hospital', 'agent_name', 'agent_title')
        }),
        ('AI Configuration', {
            'fields': ('system_prompt', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hospital')
    
    def save_model(self, request, obj, form, change):
        """Save the model and set the hospital if not already set"""
        if not change and not obj.hospital_id:
            # If creating new and no hospital set, use user's hospital if available
            if hasattr(request.user, 'hospital'):
                obj.hospital = request.user.hospital
        super().save_model(request, obj, form, change)


@admin.register(Behavior)
class BehaviorAdmin(admin.ModelAdmin):
    list_display = [
        'hospital', 'communication_tone', 'communication_style', 
        'confidence_level', 'response_length', 'is_active', 
        'created_at', 'updated_at'
    ]
    list_filter = [
        'is_active', 'hospital', 'communication_tone', 'communication_style',
        'confidence_level', 'response_length', 'created_at'
    ]
    search_fields = [
        'hospital__name', 'communication_tone', 'communication_style',
        'confidence_level', 'response_length'
    ]
    ordering = ['hospital', 'communication_tone']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Hospital Information', {
            'fields': ('hospital',)
        }),
        ('Communication Settings', {
            'fields': ('communication_tone', 'communication_style')
        }),
        ('Behavior Settings', {
            'fields': ('confidence_level', 'response_length', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hospital')
    
    def save_model(self, request, obj, form, change):
        """Save the model and set the hospital if not already set"""
        if not change and not obj.hospital_id:
            # If creating new and no hospital set, use user's hospital if available
            if hasattr(request.user, 'hospital'):
                obj.hospital = request.user.hospital
        super().save_model(request, obj, form, change)

@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = [
        'hospital', 'is_active', 'created_at', 'updated_at'
    ]
    list_filter = [
        'is_active', 'hospital', 'created_at'
    ]
    search_fields = [
        'hospital__name', 'greeting_message', 'appointment_booking',
        'general_inquiries', 'fallback_response', 'emergency_response', 'business_hours',
        'medical_specialties'
    ]
    ordering = ['hospital', 'created_at']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Hospital Information', {
            'fields': ('hospital',)
        }),
        ('Response Templates', {
            'fields': (
                'greeting_message', 'appointment_booking', 'general_inquiries'
            )
        }),
        ('Special Responses', {
            'fields': (
                'fallback_response', 'emergency_response', 'business_hours', 'medical_specialties'
            )
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hospital')
    
    def save_model(self, request, obj, form, change):
        """Save the model and set the hospital if not already set"""
        if not change and not obj.hospital_id:
            # If creating new and no hospital set, use user's hospital if available
            if hasattr(request.user, 'hospital'):
                obj.hospital = request.user.hospital
        super().save_model(request, obj, form, change)


class SourceFileInline(admin.TabularInline):
    model = SourceFile
    extra = 1
    fields = ['file', 'file_name', 'file_size', 'file_type', 'is_active']
    readonly_fields = ['file_name', 'file_size', 'file_type']


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = [
        'hospital', 'get_file_count', 'is_active', 'created_at', 'updated_at'
    ]
    list_filter = [
        'is_active', 'hospital', 'created_at'
    ]
    search_fields = [
        'hospital__name'
    ]
    ordering = ['hospital', 'created_at']
    list_editable = ['is_active']
    inlines = [SourceFileInline]
    
    fieldsets = (
        ('Hospital Information', {
            'fields': ('hospital', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('hospital').prefetch_related('source_files')
    
    def get_file_count(self, obj):
        return obj.source_files.count()
    get_file_count.short_description = 'File Count'
    
    def save_model(self, request, obj, form, change):
        """Save the model and set the hospital if not already set"""
        if not change and not obj.hospital_id:
            # If creating new and no hospital set, use user's hospital if available
            if hasattr(request.user, 'hospital'):
                obj.hospital = request.user.hospital
        super().save_model(request, obj, form, change)


@admin.register(SourceFile)
class SourceFileAdmin(admin.ModelAdmin):
    list_display = [
        'source', 'file_name', 'file_size', 'file_type', 'is_active', 'created_at'
    ]
    list_filter = [
        'is_active', 'file_type', 'source__hospital', 'created_at'
    ]
    search_fields = [
        'file_name', 'source__hospital__name'
    ]
    ordering = ['source', 'created_at']
    list_editable = ['is_active']
    
    fieldsets = (
        ('File Information', {
            'fields': ('source', 'file', 'file_name', 'file_size', 'file_type', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['file_name', 'file_size', 'file_type', 'created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('source__hospital')
