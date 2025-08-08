from django.contrib import admin
from .models import MedicalRecord, MedicalRecordFile

class MedicalRecordFileInline(admin.TabularInline):
    """Inline admin for medical record files"""
    model = MedicalRecordFile
    extra = 0
    readonly_fields = ['file_name', 'file_size', 'uploaded_at']
    fields = ['file', 'file_name', 'file_size', 'uploaded_at']

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['record_id', 'patient', 'date', 'has_files', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['patient__username', 'patient__email', 'patient__first_name', 
                     'patient__last_name', 'diagnosis']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
    readonly_fields = ['record_id', 'created_at', 'updated_at']
    inlines = [MedicalRecordFileInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('record_id', 'patient', 'date')
        }),
        ('Medical Details', {
            'fields': ('diagnosis',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient').prefetch_related('files')
    
    def has_files(self, obj):
        count = obj.files.count()
        return f"{count} file{'s' if count != 1 else ''}" if count > 0 else '-'
    has_files.short_description = 'Files'

@admin.register(MedicalRecordFile)
class MedicalRecordFileAdmin(admin.ModelAdmin):
    """Admin configuration for MedicalRecordFile model"""
    list_display = ['file_name', 'medical_record', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['file_name', 'medical_record__patient__username', 
                     'medical_record__patient__first_name', 'medical_record__patient__last_name']
    ordering = ['-uploaded_at']
    readonly_fields = ['file_name', 'file_size', 'uploaded_at']