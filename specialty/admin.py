from django.contrib import admin
from .models import Specialty, DoctorSpecialty, SpecialtyStatistics


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'certification_required', 
                   'years_of_training', 'is_active', 'created_at']
    list_filter = ['is_active', 'certification_required', 'years_of_training']
    search_fields = ['name', 'code', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description')
        }),
        ('Requirements', {
            'fields': ('certification_required', 'years_of_training')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )


@admin.register(DoctorSpecialty)
class DoctorSpecialtyAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'specialty', 'is_primary', 
                   'certification_date', 'years_of_experience', 'created_at']
    list_filter = ['is_primary', 'specialty', 'certification_date']
    search_fields = ['doctor__first_name', 'doctor__last_name', 
                    'doctor__email', 'specialty__name', 'certification_number']
    ordering = ['-is_primary', 'doctor__last_name']
    readonly_fields = ['created_at', 'updated_at']
    # autocomplete_fields = ['doctor', 'specialty']  # Commented out until User admin is configured
    
    fieldsets = (
        ('Assignment', {
            'fields': ('doctor', 'specialty', 'is_primary')
        }),
        ('Certification Details', {
            'fields': ('certification_date', 'certification_number', 
                      'institution', 'years_of_experience')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('doctor', 'specialty')


@admin.register(SpecialtyStatistics)
class SpecialtyStatisticsAdmin(admin.ModelAdmin):
    list_display = ['specialty', 'total_doctors', 'total_appointments',
                   'average_rating', 'average_wait_days', 'last_updated']
    list_filter = ['average_rating', 'average_wait_days']
    search_fields = ['specialty__name']
    ordering = ['-total_doctors']
    readonly_fields = ['last_updated']
    
    fieldsets = (
        ('Specialty', {
            'fields': ('specialty',)
        }),
        ('Metrics', {
            'fields': ('total_doctors', 'total_appointments', 'average_rating')
        }),
        ('Demand Analysis', {
            'fields': ('appointment_requests_last_month', 'average_wait_days')
        }),
        ('Update Info', {
            'fields': ('last_updated',)
        }),
    )
    
    actions = ['update_statistics']
    
    def update_statistics(self, request, queryset):
        for stat in queryset:
            stat.update_statistics()
        self.message_user(request, f"Updated statistics for {queryset.count()} specialties")
    
    update_statistics.short_description = "Update selected statistics"