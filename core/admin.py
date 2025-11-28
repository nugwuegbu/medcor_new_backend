from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Certification


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for User model."""

    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "hospital",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_verified",
        "hospital",
        "created_at",
    )
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_number",
                    "date_of_birth",
                    "gender",
                )
            },
        ),
        (
            "Address",
            {
                "fields": (
                    "address_line1",
                    "address_line2",
                    "city",
                    "state",
                    "country",
                    "postal_code",
                )
            },
        ),
        (
            "Professional",
            {
                "fields": (
                    "role",
                    "hospital",
                    "license_number",
                    "specialization",
                    "department",
                    "years_of_experience",
                )
            },
        ),
        (
            "Profile",
            {"fields": ("profile_picture", "bio", "linkedin_url", "facebook_url", "twitter_url", "preferred_language", "timezone")},
        ),
        (
            "Medical Info",
            {
                "fields": (
                    "blood_type",
                    "allergies",
                    "medical_conditions",
                    "current_medications",
                )
            },
        ),
        (
            "Emergency Contact",
            {
                "fields": (
                    "emergency_contact_name",
                    "emergency_contact_phone",
                    "emergency_contact_relationship",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_verified",
                    "email_verified",
                    "phone_verified",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "role",
                    "hospital",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "last_login")

    # Add autocomplete for hospital field
    autocomplete_fields = ["hospital"]


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    """Admin for Certification model."""

    list_display = (
        "certification_name",
        "user",
        "certification_type",
        "issuing_authority",
        "issue_date",
        "expiry_date",
        "is_verified",
        "is_active",
        "created_at",
    )
    list_filter = (
        "certification_type",
        "is_verified",
        "is_active",
        "issue_date",
        "expiry_date",
        "created_at",
    )
    search_fields = (
        "certification_name",
        "certification_license_id",
        "issuing_authority",
        "user__first_name",
        "user__last_name",
        "user__email",
    )
    ordering = ("-created_at",)
    
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "user",
                    "certification_name",
                    "certification_type",
                    "certification_license_id",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "issue_date",
                    "expiry_date",
                )
            },
        ),
        (
            "Document & Details",
            {
                "fields": (
                    "file_document",
                    "issuing_authority",
                    "description",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_verified",
                    "is_active",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )
    
    readonly_fields = ("created_at", "updated_at")
    
    # Add autocomplete for user field
    autocomplete_fields = ["user"]
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related("user")
