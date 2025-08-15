from django.contrib import admin
from .models import Appointment, DoctorAvailabilitySlot


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin interface for Appointment model."""
    list_display = [
        'id', 'patient', 'doctor', 'scheduled_date', 
        'scheduled_time', 'status', 'appointment_type', 'hospital'
    ]
    list_filter = [
        'status', 'appointment_type', 'scheduled_date', 
        'is_telemedicine', 'hospital'
    ]
    search_fields = [
        'patient__email', 'patient__first_name', 'patient__last_name',
        'doctor__email', 'doctor__first_name', 'doctor__last_name',
        'reason', 'symptoms'
    ]
    date_hierarchy = 'scheduled_date'
    ordering = ['-scheduled_date', '-scheduled_time']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('hospital', 'patient', 'doctor', 'appointment_type', 'status')
        }),
        ('Scheduling', {
            'fields': (
                'scheduled_date', 'scheduled_time', 'duration_minutes',
                'end_time', 'slot'
            )
        }),
        ('Details', {
            'fields': ('reason', 'symptoms', 'notes')
        }),
        ('Telemedicine', {
            'fields': ('is_telemedicine', 'meeting_link', 'meeting_id', 'meeting_password'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': (
                'check_in_time', 'start_time', 'end_time_actual',
                'reminder_sent', 'reminder_sent_at'
            ),
            'classes': ('collapse',)
        }),
        ('Follow-up & Cancellation', {
            'fields': (
                'is_follow_up', 'parent_appointment',
                'cancellation_reason', 'cancelled_by', 'cancelled_at',
                'rescheduled_from'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at', 'end_time']
    
    def get_queryset(self, request):
        """Filter appointments based on user's hospital."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'hospital'):
            return qs.filter(hospital=request.user.hospital)
        return qs.none()


@admin.register(DoctorAvailabilitySlot)
class DoctorAvailabilitySlotAdmin(admin.ModelAdmin):
    """Admin interface for DoctorAvailabilitySlot model."""
    list_display = [
        'id', 'doctor', 'date', 'start_time', 'end_time',
        'status', 'current_appointments', 'max_appointments',
        'hospital'
    ]
    list_filter = [
        'status', 'date', 'is_recurring', 'recurrence_pattern',
        'hospital', 'doctor'
    ]
    search_fields = [
        'doctor__email', 'doctor__first_name', 'doctor__last_name',
        'notes'
    ]
    date_hierarchy = 'date'
    ordering = ['date', 'start_time']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('hospital', 'doctor', 'status')
        }),
        ('Slot Timing', {
            'fields': (
                'date', 'start_time', 'end_time',
                'slot_duration_minutes'
            )
        }),
        ('Capacity', {
            'fields': (
                'max_appointments', 'current_appointments',
                'appointment'
            )
        }),
        ('Recurrence', {
            'fields': (
                'is_recurring', 'recurrence_pattern',
                'recurrence_end_date', 'day_of_week'
            ),
            'classes': ('collapse',)
        }),
        ('Booking Rules', {
            'fields': (
                'advance_booking_days', 'minimum_notice_hours',
                'allowed_appointment_types'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'metadata', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at', 'current_appointments']
    
    def get_queryset(self, request):
        """Filter slots based on user's hospital."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'hospital'):
            return qs.filter(hospital=request.user.hospital)
        return qs.none()
    
    def save_model(self, request, obj, form, change):
        """Auto-set created_by and hospital if not provided."""
        if not change:  # New object
            if not obj.created_by_id:
                obj.created_by = request.user
            if not obj.hospital_id and hasattr(obj.doctor, 'hospital'):
                obj.hospital = obj.doctor.hospital
        super().save_model(request, obj, form, change)
