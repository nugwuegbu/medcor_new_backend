from django.contrib import admin
from .models import Doctor, Appointment

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'license_number', 'experience_years', 'is_available']
    list_filter = ['specialization', 'is_available', 'experience_years']
    search_fields = ['user__first_name', 'user__last_name', 'specialization', 'license_number']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('user',)
        }),
        ('Professional Details', {
            'fields': ('specialization', 'license_number', 'experience_years')
        }),
        ('Availability', {
            'fields': ('is_available',)
        }),
    )

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'doctor', 'treatment', 'appointment_date', 'status']
    list_filter = ['status', 'appointment_date', 'doctor', 'treatment']
    search_fields = ['patient_name', 'patient_email', 'doctor__user__last_name']
    date_hierarchy = 'appointment_date'
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient_name', 'patient_email', 'patient_phone')
        }),
        ('Appointment Details', {
            'fields': ('doctor', 'treatment', 'appointment_date', 'status')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_confirmed', 'mark_completed', 'mark_cancelled']
    
    def mark_confirmed(self, request, queryset):
        queryset.update(status='confirmed')
        self.message_user(request, f"{queryset.count()} appointments marked as confirmed.")
    mark_confirmed.short_description = "Mark selected appointments as confirmed"
    
    def mark_completed(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f"{queryset.count()} appointments marked as completed.")
    mark_completed.short_description = "Mark selected appointments as completed"
    
    def mark_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f"{queryset.count()} appointments marked as cancelled.")
    mark_cancelled.short_description = "Mark selected appointments as cancelled"