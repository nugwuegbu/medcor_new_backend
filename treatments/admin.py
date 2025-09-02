from django.contrib import admin
from .models import Treatment, Prescription


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    """Admin for Treatment model."""
    
    list_display = ['id', 'patient', 'treatment_type', 'name', 'prescribed_by', 'status', 'hospital', 'start_date']
    list_filter = ['treatment_type', 'status', 'hospital', 'start_date']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__email', 
                    'name', 'description', 'prescribed_by__first_name', 'prescribed_by__last_name']
    ordering = ['-start_date']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Treatment Information', {
            'fields': ('id', 'treatment_type', 'name', 'description')
        }),
        ('Patient & Doctor', {
            'fields': ('patient', 'prescribed_by', 'hospital')
        }),
        ('Treatment Plan', {
            'fields': ('start_date', 'end_date', 'status', 'instructions')
        }),
        ('Dosage & Frequency', {
            'fields': ('frequency', 'dosage', 'duration')
        }),
        ('Safety Information', {
            'fields': ('side_effects', 'warnings')
        }),
        ('Related Information', {
            'fields': ('appointment', 'medical_record')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'prescribed_by', 'hospital')


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    """Admin for Prescription model."""
    
    list_display = ['id', 'treatment', 'medication_name', 'dosage', 'frequency', 'is_active', 'hospital', 'created_at']
    list_filter = ['is_active', 'is_dispensed', 'hospital', 'created_at']
    search_fields = ['medication_name', 'dosage', 'frequency', 'instructions']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Prescription Information', {
            'fields': ('id', 'treatment', 'medication_name', 'dosage', 'frequency')
        }),
        ('Instructions', {
            'fields': ('instructions', 'take_with_food')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date', 'duration_days')
        }),
        ('Quantity & Refills', {
            'fields': ('quantity_prescribed', 'quantity_unit', 'refills_allowed', 'refills_used')
        }),
        ('Context', {
            'fields': ('hospital', 'pharmacy_name', 'pharmacy_phone')
        }),
        ('Status', {
            'fields': ('is_active', 'is_dispensed', 'dispensed_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('treatment', 'hospital')
