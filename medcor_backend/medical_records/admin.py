from django.contrib import admin
from .models import MedicalRecord

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['record_id', 'patient', 'date', 'type', 'doctor', 'status', 'created_at']
    list_filter = ['status', 'type', 'date', 'created_at']
    search_fields = ['patient__username', 'patient__email', 'patient__first_name', 
                     'patient__last_name', 'doctor__username', 'diagnosis']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
    readonly_fields = ['record_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('record_id', 'patient', 'date', 'type')
        }),
        ('Medical Details', {
            'fields': ('diagnosis', 'doctor', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'doctor')
