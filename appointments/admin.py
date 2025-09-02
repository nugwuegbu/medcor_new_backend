from django.contrib import admin
from .models import Appointment, DoctorAvailabilitySlot


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin for Appointment model."""
    
    list_display = ['id', 'patient', 'doctor', 'appointment_type', 'status', 'scheduled_date', 'scheduled_time', 'hospital']
    list_filter = ['status', 'appointment_type', 'scheduled_date', 'hospital', 'is_telemedicine']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__email', 
                    'doctor__first_name', 'doctor__last_name', 'doctor__email', 'reason']
    ordering = ['-scheduled_date', '-scheduled_time']
    readonly_fields = ['id', 'created_at', 'updated_at', 'end_time']
    
    fieldsets = (
        ('Appointment Details', {
            'fields': ('id', 'appointment_type', 'status', 'reason', 'symptoms', 'notes')
        }),
        ('Scheduling', {
            'fields': ('scheduled_date', 'scheduled_time', 'duration_minutes', 'slot', 'end_time')
        }),
        ('Participants', {
            'fields': ('patient', 'doctor', 'hospital')
        }),
        ('Actual Times', {
            'fields': ('check_in_time', 'start_time', 'end_time_actual'),
            'classes': ('collapse',)
        }),
        ('Telemedicine', {
            'fields': ('is_telemedicine', 'meeting_link', 'meeting_id', 'meeting_password'),
            'classes': ('collapse',)
        }),
        ('Follow-up & Rescheduling', {
            'fields': ('is_follow_up', 'parent_appointment', 'cancellation_reason', 'cancelled_by', 'cancelled_at', 'rescheduled_from'),
            'classes': ('collapse',)
        }),
        ('Reminders & Metadata', {
            'fields': ('reminder_sent', 'reminder_sent_at', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'doctor', 'slot', 'hospital')


@admin.register(DoctorAvailabilitySlot)
class DoctorAvailabilitySlotAdmin(admin.ModelAdmin):
    """Admin for DoctorAvailabilitySlot model."""
    
    list_display = ['doctor', 'start_time', 'end_time', 'status', 'hospital', 'slot_duration_minutes', 'max_appointments', 'created_by', 'created_at']
    list_filter = ['status', 'start_time', 'hospital', 'is_recurring']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'doctor__email']
    ordering = ['-start_time']
    readonly_fields = ['created_at', 'updated_at', 'current_appointments', 'created_by']
    
    fieldsets = (
        ('Slot Details', {
            'fields': ('doctor', 'start_time', 'end_time', 'status', 'hospital')
        }),
        ('Appointment Settings', {
            'fields': ('max_appointments', 'slot_duration_minutes', 'current_appointments')
        }),
        ('Recurrence', {
            'fields': ('is_recurring', 'recurrence_pattern', 'recurrence_end_date', 'day_of_week'),
            'classes': ('collapse',)
        }),
        ('Booking Control', {
            'fields': ('advance_booking_days', 'minimum_notice_hours', 'allowed_appointment_types'),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('notes', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('doctor', 'hospital', 'created_by')
    
    def save_model(self, request, obj, form, change):
        """Automatically set created_by when creating new slots."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
