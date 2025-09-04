"""
Serializers for YouCam AI Analysis API
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (AnalysisHistory, AnalysisStatus, AnalysisType,
                     YouCamAnalysis)

User = get_user_model()


class YouCamAnalysisCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new YouCam analysis requests
    """

    analysis_type = serializers.ChoiceField(
        choices=AnalysisType.choices, help_text="Type of AI analysis to perform"
    )

    class Meta:
        model = YouCamAnalysis
        fields = ["analysis_type", "image"]
        extra_kwargs = {
            "image": {"help_text": "Image file to be analyzed (JPG, PNG, etc.)"}
        }

    def validate_image(self, value):
        """
        Validate uploaded image
        """
        if not value:
            raise serializers.ValidationError("Image is required")

        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size cannot exceed 10MB")

        # Check file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported image type. Allowed types: {', '.join(allowed_types)}"
            )

        return value


class YouCamAnalysisListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing YouCam analyses
    """

    analysis_type_display = serializers.CharField(
        source="get_analysis_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    image_url = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(read_only=True)
    is_failed = serializers.BooleanField(read_only=True)
    can_retry = serializers.BooleanField(read_only=True)

    class Meta:
        model = YouCamAnalysis
        fields = [
            "id",
            "analysis_type",
            "analysis_type_display",
            "status",
            "status_display",
            "image_url",
            "is_completed",
            "is_failed",
            "can_retry",
            "retry_count",
            "max_retries",
            "created_at",
            "updated_at",
            "completed_at",
        ]

    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class YouCamAnalysisDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed YouCam analysis results
    """

    analysis_type_display = serializers.CharField(
        source="get_analysis_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    image_url = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(read_only=True)
    is_failed = serializers.BooleanField(read_only=True)
    can_retry = serializers.BooleanField(read_only=True)

    class Meta:
        model = YouCamAnalysis
        fields = [
            "id",
            "analysis_type",
            "analysis_type_display",
            "status",
            "status_display",
            "image_url",
            "analysis_results",
            "issues_detected",
            "recommendations",
            "error_message",
            "is_completed",
            "is_failed",
            "can_retry",
            "retry_count",
            "max_retries",
            "celery_task_id",
            "created_at",
            "updated_at",
            "completed_at",
        ]

    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class YouCamAnalysisRetrySerializer(serializers.Serializer):
    """
    Serializer for retrying failed analyses
    """

    analysis_id = serializers.UUIDField(help_text="ID of the analysis to retry")

    def validate_analysis_id(self, value):
        """
        Validate that the analysis exists and can be retried
        """
        try:
            analysis = YouCamAnalysis.objects.get(id=value)
            if not analysis.can_retry:
                raise serializers.ValidationError(
                    "This analysis cannot be retried. It may have exceeded max retries or is not in failed status."
                )
            return value
        except YouCamAnalysis.DoesNotExist:
            raise serializers.ValidationError("Analysis not found")


class AnalysisHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for analysis history
    """

    analysis_type_display = serializers.CharField(
        source="analysis.get_analysis_type_display", read_only=True
    )
    analysis_status = serializers.CharField(source="analysis.status", read_only=True)
    analysis_image_url = serializers.SerializerMethodField()

    class Meta:
        model = AnalysisHistory
        fields = [
            "id",
            "analysis",
            "analysis_type_display",
            "analysis_status",
            "analysis_image_url",
            "viewed_at",
            "feedback_rating",
            "feedback_comment",
        ]

    def get_analysis_image_url(self, obj):
        """Get analysis image URL"""
        if obj.analysis.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.analysis.image.url)
            return obj.analysis.image.url
        return None


class AnalysisFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for submitting analysis feedback
    """

    class Meta:
        model = AnalysisHistory
        fields = ["feedback_rating", "feedback_comment"]

    def validate_feedback_rating(self, value):
        """
        Validate feedback rating
        """
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class YouCamAnalysisStatsSerializer(serializers.Serializer):
    """
    Serializer for analysis statistics
    """

    total_analyses = serializers.IntegerField()
    pending_analyses = serializers.IntegerField()
    processing_analyses = serializers.IntegerField()
    completed_analyses = serializers.IntegerField()
    failed_analyses = serializers.IntegerField()
    analyses_by_type = serializers.DictField()
    success_rate = serializers.FloatField()
    average_processing_time = serializers.FloatField()


class BatchAnalysisSerializer(serializers.Serializer):
    """
    Serializer for batch analysis requests
    """

    analyses = serializers.ListField(
        child=YouCamAnalysisCreateSerializer(), help_text="List of analyses to process"
    )

    def validate_analyses(self, value):
        """
        Validate batch analyses
        """
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 analyses allowed per batch")
        return value
