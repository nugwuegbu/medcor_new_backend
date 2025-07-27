from django.contrib import admin
from .models import Slot, SlotExclusion, Appointment


@admin.register(Slot)
class SlotAdmin(admin.ModelAdmin):
    list_display = [
        'doctor', 'get_day_of_week_display', 'start_time', 'end_time', 'created_at'
    ]
    list_filter = ['day_of_week', 'start_time', 'doctor__role']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'doctor__email']
    ordering = ['day_of_week', 'start_time']
    
    fieldsets = (
        ('Slot Information', {
            'fields': ('doctor', 'day_of_week')
        }),
        ('Time Schedule', {
            'fields': ('start_time', 'end_time')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SlotExclusion)
class SlotExclusionAdmin(admin.ModelAdmin):
    list_display = [
        'doctor', 'exclusion_start_date', 'exclusion_end_date', 'created_at'
    ]
    list_filter = ['exclusion_start_date', 'exclusion_end_date', 'doctor__role']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'doctor__email']
    ordering = ['-exclusion_start_date']
    
    fieldsets = (
        ('Exclusion Information', {
            'fields': ('doctor',)
        }),
        ('Exclusion Period', {
            'fields': ('exclusion_start_date', 'exclusion_end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'patient', 'doctor', 'appointment_slot_date', 'appointment_slot_start_time',
        'treatment', 'appointment_status', 'created_at'
    ]
    list_filter = [
        'appointment_status', 'appointment_slot_date', 'treatment',
        'doctor__role', 'patient__role'
    ]
    search_fields = [
        'patient__first_name', 'patient__last_name', 'patient__email',
        'doctor__first_name', 'doctor__last_name', 'doctor__email',
        'treatment__name'
    ]
    ordering = ['-appointment_slot_date', '-appointment_slot_start_time']
    
    fieldsets = (
        ('Appointment Participants', {
            'fields': ('patient', 'doctor')
        }),
        ('Appointment Details', {
            'fields': ('slot', 'treatment', 'appointment_status')
        }),
        ('Schedule Information', {
            'fields': (
                'appointment_slot_date', 
                'appointment_slot_start_time', 
                'appointment_slot_end_time'
            )
        }),
        ('Medical Documentation', {
            'fields': ('medical_record',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    # Custom admin actions
    actions = ['mark_as_approved', 'mark_as_completed', 'mark_as_cancelled']
    
    @admin.action(description="Mark selected appointments as approved")
    def mark_as_approved(self, request, queryset):
        count = queryset.update(appointment_status=Appointment.AppointmentStatus.APPROVED)
        self.message_user(request, f'{count} appointments marked as approved.')
    
    @admin.action(description="Mark selected appointments as completed")
    def mark_as_completed(self, request, queryset):
        count = queryset.update(appointment_status=Appointment.AppointmentStatus.COMPLETED)
        self.message_user(request, f'{count} appointments marked as completed.')
    
    @admin.action(description="Mark selected appointments as cancelled")
    def mark_as_cancelled(self, request, queryset):
        count = queryset.update(appointment_status=Appointment.AppointmentStatus.CANCELLED)
        self.message_user(request, f'{count} appointments marked as cancelled.')
