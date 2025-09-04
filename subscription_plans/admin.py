from django.contrib import admin

from .models import Subscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Admin for SubscriptionPlan model."""

    list_display = [
        "name",
        "plan_type",
        "price",
        "currency",
        "billing_cycle",
        "max_users",
        "is_active",
        "is_featured",
    ]
    list_filter = [
        "plan_type",
        "billing_cycle",
        "is_active",
        "is_featured",
        "has_telemedicine",
        "has_analytics",
    ]
    search_fields = ["name", "description", "slug"]
    ordering = ["display_order", "price"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Basic Information", {"fields": ("name", "slug", "plan_type", "description")}),
        ("Pricing", {"fields": ("price", "currency", "billing_cycle", "trial_days")}),
        (
            "Limits",
            {
                "fields": (
                    "max_users",
                    "max_doctors",
                    "max_patients",
                    "max_appointments_per_month",
                    "storage_gb",
                )
            },
        ),
        (
            "Features",
            {
                "fields": (
                    "has_telemedicine",
                    "has_analytics",
                    "has_api_access",
                    "has_custom_branding",
                    "has_priority_support",
                    "has_data_export",
                    "has_multi_location",
                    "has_advanced_reporting",
                )
            },
        ),
        ("Additional Features", {"fields": ("features",)}),
        ("Display Settings", {"fields": ("is_active", "is_featured", "display_order")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Admin for Subscription model."""

    list_display = [
        "hospital",
        "plan",
        "status",
        "start_date",
        "end_date",
        "is_active",
        "created_at",
    ]
    list_filter = ["status", "start_date", "end_date", "plan__plan_type"]
    search_fields = ["hospital__name", "plan__name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Subscription Details", {"fields": ("hospital", "plan", "status")}),
        ("Timing", {"fields": ("start_date", "end_date", "trial_end_date")}),
        (
            "Billing",
            {"fields": ("amount_paid", "currency", "payment_method", "invoice_number")},
        ),
        (
            "Status",
            {
                "fields": (
                    "is_active",
                    "auto_renew",
                    "cancellation_reason",
                    "cancelled_at",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("plan", "hospital")
