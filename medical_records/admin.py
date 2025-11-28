from django.contrib import admin

from .models import MedicalDocument, MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    """Admin for MedicalRecord model."""

    list_display = [
        "id",
        "patient",
        "record_type",
        "title",
        "created_by",
        "hospital",
        "created_at",
    ]
    list_filter = [
        "record_type",
        "is_confidential",
        "access_restricted",
        "hospital",
        "created_at",
    ]
    search_fields = [
        "patient__first_name",
        "patient__last_name",
        "patient__email",
        "title",
        "description",
        "diagnosis",
    ]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (
            "Record Information",
            {"fields": ("id", "record_type", "title", "description")},
        ),
        ("Patient & Doctor", {"fields": ("patient", "created_by", "hospital")}),
        (
            "Medical Details",
            {"fields": ("diagnosis", "symptoms", "vital_signs", "lab_results")},
        ),
        ("Related Information", {"fields": ("appointment", "attachments")}),
        ("Privacy & Security", {"fields": ("is_confidential", "access_restricted")}),
        (
            "Metadata",
            {
                "fields": ("metadata", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("patient", "created_by", "hospital")


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    """Admin for MedicalDocument model."""

    list_display = [
        "id",
        "medical_record",
        "document_type",
        "title",
        "hospital",
        "created_at",
    ]
    list_filter = ["document_type", "hospital", "created_at"]
    search_fields = ["medical_record__title", "title", "description"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (
            "Document Information",
            {
                "fields": (
                    "id",
                    "medical_record",
                    "document_type",
                    "title",
                    "description",
                )
            },
        ),
        ("File Details", {"fields": ("file", "file_size", "file_type")}),
        ("Context", {"fields": ("hospital", "uploaded_by")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("medical_record", "uploaded_by", "hospital")
