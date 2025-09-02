from django.contrib import admin
from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    """Admin for Hospital model."""
    
    list_display = ['name', 'hospital_type', 'city', 'state', 'is_active', 'is_verified', 'created_at']
    list_filter = ['hospital_type', 'is_active', 'is_verified', 'emergency_services', 'city', 'state']
    search_fields = ['name', 'city', 'state', 'phone_number', 'email']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'hospital_type', 'description')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email', 'website')
        }),
        ('Address', {
            'fields': ('address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Hospital Details', {
            'fields': ('bed_count', 'emergency_services', 'trauma_center_level')
        }),
        ('Services & Accreditation', {
            'fields': ('services', 'accreditations', 'license_number', 'operating_hours')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related()
