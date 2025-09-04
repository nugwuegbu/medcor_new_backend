"""
YouCam AI Analysis Models
"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class AnalysisType(models.TextChoices):
    """Analysis types supported by YouCam"""

    SKIN_ANALYSIS = "skin_analysis", "AI Skin Analysis"
    FACE_ANALYZER = "face_analyzer", "AI Face Analyzer"
    HAIR_EXTENSION = "hair_extension", "AI Hair Extension"
    LIPS_ANALYSIS = "lips_analysis", "AI Lips Analysis"


class AnalysisStatus(models.TextChoices):
    """Analysis processing status"""

    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class YouCamAnalysis(models.Model):
    """
    Model to store YouCam AI analysis requests and results
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    # Analysis details
    analysis_type = models.CharField(
        max_length=20,
        choices=AnalysisType.choices,
        help_text="Type of AI analysis to perform",
    )
    image = models.ImageField(
        upload_to="youcam/analysis_images/", help_text="Image to be analyzed"
    )

    # Processing status
    status = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.PENDING,
        help_text="Current processing status",
    )
    celery_task_id = models.CharField(
        max_length=255, blank=True, null=True, help_text="Celery task ID for tracking"
    )

    # Results
    raw_response = models.JSONField(
        null=True, blank=True, help_text="Raw response from YouCam API"
    )
    analysis_results = models.JSONField(
        null=True, blank=True, help_text="Processed analysis results"
    )
    issues_detected = models.JSONField(
        null=True, blank=True, help_text="Issues detected in the analysis"
    )
    recommendations = models.JSONField(
        null=True, blank=True, help_text="Recommendations based on analysis"
    )

    # Error handling
    error_message = models.TextField(
        blank=True, null=True, help_text="Error message if analysis failed"
    )
    retry_count = models.PositiveIntegerField(
        default=0, help_text="Number of retry attempts"
    )
    max_retries = models.PositiveIntegerField(
        default=3, help_text="Maximum number of retry attempts"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "YouCam Analysis"
        verbose_name_plural = "YouCam Analyses"

    def __str__(self):
        return f"{self.get_analysis_type_display()} - {self.status} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def is_completed(self):
        return self.status == AnalysisStatus.COMPLETED

    @property
    def is_failed(self):
        return self.status == AnalysisStatus.FAILED

    @property
    def can_retry(self):
        return (
            self.retry_count < self.max_retries and self.status == AnalysisStatus.FAILED
        )


class AnalysisHistory(models.Model):
    """
    Model to track analysis history for users
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    analysis = models.ForeignKey(YouCamAnalysis, on_delete=models.CASCADE)

    # User interaction
    viewed_at = models.DateTimeField(auto_now_add=True)
    feedback_rating = models.PositiveIntegerField(
        null=True,
        blank=True,
        choices=[(i, i) for i in range(1, 6)],
        help_text="User rating from 1-5",
    )
    feedback_comment = models.TextField(
        blank=True, null=True, help_text="User feedback comment"
    )

    class Meta:
        ordering = ["-viewed_at"]
        verbose_name = "Analysis History"
        verbose_name_plural = "Analysis Histories"

    def __str__(self):
        return f"{self.user.email} - {self.analysis.get_analysis_type_display()} ({self.viewed_at.strftime('%Y-%m-%d %H:%M')})"
