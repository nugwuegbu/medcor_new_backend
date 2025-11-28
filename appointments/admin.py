from django.contrib import admin

from .models import (
    Appointment,
    DoctorScheduleTemplate,
    DoctorScheduleSlot,
    ScheduleException,
)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin for Appointment model."""

    list_display = [
        "id",
        "patient",
        "doctor",
        "appointment_type",
        "status",
        "scheduled_date",
        "scheduled_time",
        "hospital",
    ]
    list_filter = [
        "status",
        "appointment_type",
        "priority",
        "scheduled_date",
        "hospital",
    ]
    search_fields = [
        "patient__first_name",
        "patient__last_name",
        "patient__email",
        "doctor__first_name",
        "doctor__last_name",
        "doctor__email",
        "reason",
    ]
    ordering = ["-scheduled_date", "-scheduled_time"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (
            "Appointment Details",
            {
                "fields": (
                    "id",
                    "appointment_type",
                    "priority",
                    "status",
                    "reason",
                    "symptoms",
                    "notes",
                    "diagnosis",
                )
            },
        ),
        (
            "Scheduling",
            {
                "fields": (
                    "scheduled_date",
                    "scheduled_time",
                    "duration_minutes",
                    "slot",
                )
            },
        ),
        ("Participants", {"fields": ("patient", "doctor", "hospital")}),
        (
            "Actual Times",
            {
                "fields": ("actual_start_time", "actual_end_time"),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at", "created_by"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("patient", "doctor", "slot", "hospital")


@admin.register(DoctorScheduleTemplate)
class DoctorScheduleTemplateAdmin(admin.ModelAdmin):
    """Admin for DoctorScheduleTemplate model."""

    list_display = [
        "doctor",
        "day_of_week",
        "start_time",
        "end_time",
        "is_available",
        "hospital",
        "slot_duration_minutes",
    ]
    list_filter = ["day_of_week", "is_available", "is_active", "hospital"]
    search_fields = ["doctor__first_name", "doctor__last_name", "doctor__email"]
    ordering = ["doctor", "day_of_week", "start_time"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Template Details",
            {
                "fields": (
                    "doctor",
                    "day_of_week",
                    "start_time",
                    "end_time",
                    "hospital",
                )
            },
        ),
        (
            "Slot Settings",
            {
                "fields": (
                    "slot_duration_minutes",
                    "max_appointments_per_slot",
                    "is_available",
                )
            },
        ),
        (
            "Booking Control",
            {
                "fields": (
                    "advance_booking_days",
                    "minimum_notice_hours",
                    "allowed_appointment_types",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Status",
            {"fields": ("is_active",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("doctor", "hospital")


@admin.register(DoctorScheduleSlot)
class DoctorScheduleSlotAdmin(admin.ModelAdmin):
    """Admin for DoctorScheduleSlot model."""

    list_display = [
        "doctor",
        "date",
        "start_time",
        "end_time",
        "status",
        "hospital",
        "current_appointments",
        "max_appointments",
    ]
    list_filter = ["status", "date", "hospital", "template"]
    search_fields = ["doctor__first_name", "doctor__last_name", "doctor__email"]
    ordering = ["-date", "-start_time"]
    readonly_fields = ["created_at", "updated_at", "current_appointments", "created_by"]

    fieldsets = (
        (
            "Slot Details",
            {"fields": ("doctor", "template", "date", "start_time", "end_time", "status", "hospital")},
        ),
        (
            "Appointment Settings",
            {
                "fields": (
                    "max_appointments",
                    "duration_minutes",
                    "current_appointments",
                )
            },
        ),
        (
            "Booking Control",
            {
                "fields": (
                    "advance_booking_days",
                    "minimum_notice_hours",
                    "allowed_appointment_types",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Additional Info",
            {"fields": ("notes", "metadata"), "classes": ("collapse",)},
        ),
        ("Metadata", {"fields": ("created_by",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("doctor", "hospital", "template", "created_by")

    def save_model(self, request, obj, form, change):
        """Automatically set created_by when creating new slots."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    """Admin for ScheduleException model."""

    list_display = [
        "doctor",
        "exception_type",
        "title",
        "start_date",
        "end_date",
        "hospital",
    ]
    list_filter = ["exception_type", "start_date", "end_date", "hospital"]
    search_fields = [
        "doctor__first_name",
        "doctor__last_name",
        "doctor__email",
        "title",
        "description",
    ]
    ordering = ["-start_date"]
    readonly_fields = ["created_at", "updated_at", "created_by"]

    fieldsets = (
        (
            "Exception Details",
            {
                "fields": (
                    "doctor",
                    "exception_type",
                    "title",
                    "description",
                    "hospital",
                )
            },
        ),
        (
            "Schedule",
            {
                "fields": (
                    "start_date",
                    "end_date",
                    "start_time",
                    "end_time",
                )
            },
        ),
        ("Metadata", {"fields": ("created_by",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("doctor", "hospital", "created_by")

    def save_model(self, request, obj, form, change):
        """Automatically set created_by when creating new exceptions."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)