"""
Admin configuration for YouCam AI Analysis
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import AnalysisHistory, YouCamAnalysis


@admin.register(YouCamAnalysis)
class YouCamAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for YouCam Analysis"""

    list_display = [
        "id",
        "analysis_type",
        "status",
        "user",
        "image_preview",
        "retry_count",
        "created_at",
        "completed_at",
    ]
    list_filter = ["analysis_type", "status", "created_at", "completed_at"]
    search_fields = ["id", "user__email", "analysis_type"]
    readonly_fields = [
        "id",
        "celery_task_id",
        "raw_response",
        "analysis_results",
        "issues_detected",
        "recommendations",
        "created_at",
        "updated_at",
        "completed_at",
        "image_preview",
    ]
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("id", "user", "analysis_type", "image", "image_preview")},
        ),
        (
            "Processing Status",
            {"fields": ("status", "celery_task_id", "retry_count", "max_retries")},
        ),
        (
            "Results",
            {
                "fields": ("analysis_results", "issues_detected", "recommendations"),
                "classes": ("collapse",),
            },
        ),
        ("Error Information", {"fields": ("error_message",), "classes": ("collapse",)}),
        ("Raw Data", {"fields": ("raw_response",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at", "completed_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No image"

    image_preview.short_description = "Image Preview"

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related("user")


@admin.register(AnalysisHistory)
class AnalysisHistoryAdmin(admin.ModelAdmin):
    """Admin interface for Analysis History"""

    list_display = [
        "id",
        "user",
        "analysis_type",
        "analysis_status",
        "feedback_rating",
        "viewed_at",
    ]
    list_filter = [
        "analysis__analysis_type",
        "analysis__status",
        "feedback_rating",
        "viewed_at",
    ]
    search_fields = ["user__email", "analysis__id"]
    readonly_fields = ["id", "viewed_at"]

    def analysis_type(self, obj):
        """Get analysis type"""
        return obj.analysis.get_analysis_type_display()

    analysis_type.short_description = "Analysis Type"

    def analysis_status(self, obj):
        """Get analysis status"""
        return obj.analysis.get_status_display()

    analysis_status.short_description = "Analysis Status"

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related("user", "analysis")
