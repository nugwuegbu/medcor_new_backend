"""
Dentscape AI Analysis Models
"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class SimulationType(models.TextChoices):
    """Simulation types supported by Dentscape"""
    
    ORTHODONTICS = "orthodontics", "Orthodontics Simulation"
    VENEER_WITH_WHITENING = "veneer_with_whitening", "Veneer with Whitening Simulation"
    TOOTH_WHITENING = "tooth_whitening", "Tooth Whitening Simulation"


class AnalysisType(models.TextChoices):
    """Analysis types supported by Dentscape"""
    
    SMILE_CURVE_UPPER = "smile_curve_upper", "Generate Smile Curve of Upper Teeth"
    E_LINE_ANALYSIS = "e_line_analysis", "E-line Analysis"
    SMILE_CURVE_WITH_UNDERLINES = "smile_curve_with_underlines", "Generate Smile Curve with Underlines"
    TOOTH_SEGMENTATION = "tooth_segmentation", "Tooth Segmentation"
    WIDTH_HEIGHT_RATIO_INCISORS = "width_height_ratio_incisors", "Calculate Width to Height Ratio of Incisors"
    INCISAL_PLANE = "incisal_plane", "Generate Incisal Plane"
    INTERDENTAL_WIDTH_PROPORTION = "interdental_width_proportion", "Calculate Interdental Width Proportion"


class ProcessingStatus(models.TextChoices):
    """Processing status for Dentscape operations"""
    
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class DentscapeSimulation(models.Model):
    """
    Model to store Dentscape simulation requests and results
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    tracking_user_id = models.CharField(max_length=255, help_text="User ID for tracking purposes")
    
    # Simulation details
    simulation_type = models.CharField(
        max_length=30,
        choices=SimulationType.choices,
        help_text="Type of dental simulation to perform"
    )
    image = models.ImageField(
        upload_to="dentscape/simulation_images/",
        help_text="Dental image for simulation"
    )
    
    # Processing status
    status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        help_text="Current processing status"
    )
    celery_task_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Celery task ID for tracking"
    )
    
    # Results
    raw_response = models.JSONField(
        null=True, blank=True,
        help_text="Raw response from Dentscape API"
    )
    simulation_results = models.JSONField(
        null=True, blank=True,
        help_text="Processed simulation results"
    )
    before_image_url = models.URLField(
        blank=True, null=True,
        help_text="URL to before simulation image"
    )
    after_image_url = models.URLField(
        blank=True, null=True,
        help_text="URL to after simulation image"
    )
    
    # Error handling
    error_message = models.TextField(
        blank=True, null=True,
        help_text="Error message if simulation failed"
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of retry attempts"
    )
    max_retries = models.PositiveIntegerField(
        default=3,
        help_text="Maximum number of retry attempts"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Dentscape Simulation"
        verbose_name_plural = "Dentscape Simulations"
    
    def __str__(self):
        return f"{self.get_simulation_type_display()} - {self.status} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    @property
    def is_completed(self):
        return self.status == ProcessingStatus.COMPLETED
    
    @property
    def is_failed(self):
        return self.status == ProcessingStatus.FAILED
    
    @property
    def can_retry(self):
        return (
            self.retry_count < self.max_retries and 
            self.status == ProcessingStatus.FAILED
        )


class DentscapeAnalysis(models.Model):
    """
    Model to store Dentscape analysis requests and results
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    tracking_user_id = models.CharField(max_length=255, help_text="User ID for tracking purposes")
    
    # Analysis details
    analysis_type = models.CharField(
        max_length=40,
        choices=AnalysisType.choices,
        help_text="Type of dental analysis to perform"
    )
    image = models.ImageField(
        upload_to="dentscape/analysis_images/",
        help_text="Dental image for analysis"
    )
    
    # Processing status
    status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        help_text="Current processing status"
    )
    celery_task_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Celery task ID for tracking"
    )
    
    # Results
    raw_response = models.JSONField(
        null=True, blank=True,
        help_text="Raw response from Dentscape API"
    )
    analysis_results = models.JSONField(
        null=True, blank=True,
        help_text="Processed analysis results"
    )
    measurements = models.JSONField(
        null=True, blank=True,
        help_text="Dental measurements and calculations"
    )
    annotations_image_url = models.URLField(
        blank=True, null=True,
        help_text="URL to annotated analysis image"
    )
    
    # Error handling
    error_message = models.TextField(
        blank=True, null=True,
        help_text="Error message if analysis failed"
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of retry attempts"
    )
    max_retries = models.PositiveIntegerField(
        default=3,
        help_text="Maximum number of retry attempts"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Dentscape Analysis"
        verbose_name_plural = "Dentscape Analyses"
    
    def __str__(self):
        return f"{self.get_analysis_type_display()} - {self.status} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    @property
    def is_completed(self):
        return self.status == ProcessingStatus.COMPLETED
    
    @property
    def is_failed(self):
        return self.status == ProcessingStatus.FAILED
    
    @property
    def can_retry(self):
        return (
            self.retry_count < self.max_retries and 
            self.status == ProcessingStatus.FAILED
        )


class DentscapeHistory(models.Model):
    """
    Model to track Dentscape operations history for users
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tracking_user_id = models.CharField(max_length=255, help_text="User ID for tracking purposes")
    
    # Reference to simulation or analysis
    simulation = models.ForeignKey(
        DentscapeSimulation, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    analysis = models.ForeignKey(
        DentscapeAnalysis, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    
    # User interaction
    viewed_at = models.DateTimeField(auto_now_add=True)
    feedback_rating = models.PositiveIntegerField(
        null=True,
        blank=True,
        choices=[(i, i) for i in range(1, 6)],
        help_text="User rating from 1-5"
    )
    feedback_comment = models.TextField(
        blank=True, null=True,
        help_text="User feedback comment"
    )
    
    class Meta:
        ordering = ["-viewed_at"]
        verbose_name = "Dentscape History"
        verbose_name_plural = "Dentscape Histories"
    
    def __str__(self):
        operation_type = "Simulation" if self.simulation else "Analysis"
        operation_name = (
            self.simulation.get_simulation_type_display() if self.simulation
            else self.analysis.get_analysis_type_display() if self.analysis
            else "Unknown"
        )
        return f"{self.user.email} - {operation_type}: {operation_name} ({self.viewed_at.strftime('%Y-%m-%d %H:%M')})"
