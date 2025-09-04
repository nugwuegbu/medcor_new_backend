"""
Views for YouCam AI Analysis API
"""

import logging

from django.db.models import Avg, Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import AnalysisHistory, AnalysisStatus, AnalysisType, YouCamAnalysis
from .serializers import (
    AnalysisFeedbackSerializer,
    AnalysisHistorySerializer,
    BatchAnalysisSerializer,
    YouCamAnalysisCreateSerializer,
    YouCamAnalysisDetailSerializer,
    YouCamAnalysisListSerializer,
    YouCamAnalysisRetrySerializer,
    YouCamAnalysisStatsSerializer,
)
from .tasks import (
    generate_analysis_report,
    process_youcam_analysis,
    retry_failed_youcam_analyses,
)

logger = logging.getLogger(__name__)


@extend_schema(tags=["YouCam AI Analysis"])
@extend_schema_view(
    list=extend_schema(
        summary="List AI Analyses",
        description="Retrieve a list of all AI analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="analysis_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by analysis type (skin_analysis, face_analyzer, hair_extension, lips_analysis)",
            ),
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    create=extend_schema(
        summary="Create AI Analysis",
        description="Submit a new image for AI analysis. Supports skin analysis, face analysis, hair extension analysis, and lips analysis.",
        examples=[
            OpenApiExample(
                "Skin Analysis",
                value={"analysis_type": "skin_analysis", "image": "skin_photo.jpg"},
                description="Submit image for skin analysis",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Analysis Details",
        description="Retrieve detailed information about a specific AI analysis including results, issues detected, and recommendations.",
    ),
)
class YouCamAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing YouCam AI analyses.

    Provides endpoints for submitting images for AI analysis, tracking status,
    and retrieving detailed analysis results with recommendations.
    """

    queryset = YouCamAnalysis.objects.all()
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["analysis_type", "status", "user"]
    search_fields = ["analysis_type"]
    ordering_fields = ["created_at", "updated_at", "completed_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """Instantiates and returns the list of permissions that this view requires."""
        if self.action in ["create", "list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == "create":
            return YouCamAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        elif self.action == "retry":
            return YouCamAnalysisRetrySerializer
        elif self.action == "batch_create":
            return BatchAnalysisSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new AI analysis request and queue it for processing."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None
        )

        # Queue the analysis task
        try:
            task = process_youcam_analysis.delay(str(analysis.id))
            analysis.celery_task_id = task.id
            analysis.save()

            logger.info(f"YouCam analysis task queued successfully: {task.id}")
        except Exception as e:
            logger.error(f"Failed to queue YouCam analysis task: {str(e)}")
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = f"Failed to queue task: {str(e)}"
            analysis.save()

        return Response(
            {
                "message": "AI analysis request created successfully and queued for processing.",
                "analysis_id": analysis.id,
                "analysis_type": analysis.get_analysis_type_display(),
                "status": analysis.status,
                "task_id": analysis.celery_task_id,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Retry Failed Analysis",
        description="Retry a failed AI analysis that hasn't exceeded max retries.",
        request=YouCamAnalysisRetrySerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def retry(self, request):
        """Retry a failed analysis."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        analysis_id = serializer.validated_data["analysis_id"]
        try:
            analysis = YouCamAnalysis.objects.get(id=analysis_id)

            # Reset status and retry
            analysis.status = AnalysisStatus.PENDING
            analysis.error_message = None
            analysis.save()

            # Queue the retry task
            task = process_youcam_analysis.delay(str(analysis.id))
            analysis.celery_task_id = task.id
            analysis.save()

            return Response(
                {
                    "message": "Analysis retry queued successfully",
                    "analysis_id": str(analysis.id),
                    "task_id": task.id,
                }
            )
        except YouCamAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Get Analysis Statistics",
        description="Retrieve statistics about AI analyses including counts by status and type.",
        responses={200: YouCamAnalysisStatsSerializer},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def statistics(self, request):
        """Get analysis statistics."""
        # Basic counts
        total_analyses = YouCamAnalysis.objects.count()
        pending_analyses = YouCamAnalysis.objects.filter(
            status=AnalysisStatus.PENDING
        ).count()
        processing_analyses = YouCamAnalysis.objects.filter(
            status=AnalysisStatus.PROCESSING
        ).count()
        completed_analyses = YouCamAnalysis.objects.filter(
            status=AnalysisStatus.COMPLETED
        ).count()
        failed_analyses = YouCamAnalysis.objects.filter(
            status=AnalysisStatus.FAILED
        ).count()

        # Analyses by type
        analyses_by_type = dict(
            YouCamAnalysis.objects.values("analysis_type")
            .annotate(count=Count("id"))
            .values_list("analysis_type", "count")
        )

        # Success rate
        success_rate = (
            (completed_analyses / total_analyses * 100) if total_analyses > 0 else 0
        )

        # Average processing time
        completed_with_times = YouCamAnalysis.objects.filter(
            status=AnalysisStatus.COMPLETED, completed_at__isnull=False
        )
        avg_processing_time = 0
        if completed_with_times.exists():
            processing_times = []
            for analysis in completed_with_times:
                if analysis.completed_at and analysis.created_at:
                    processing_time = (
                        analysis.completed_at - analysis.created_at
                    ).total_seconds()
                    processing_times.append(processing_time)
            if processing_times:
                avg_processing_time = sum(processing_times) / len(processing_times)

        stats = {
            "total_analyses": total_analyses,
            "pending_analyses": pending_analyses,
            "processing_analyses": processing_analyses,
            "completed_analyses": completed_analyses,
            "failed_analyses": failed_analyses,
            "analyses_by_type": analyses_by_type,
            "success_rate": round(success_rate, 2),
            "average_processing_time": round(avg_processing_time, 2),
        }

        serializer = YouCamAnalysisStatsSerializer(stats)
        return Response(serializer.data)


@extend_schema(tags=["YouCam AI Analysis"])
class AnalysisHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing analysis history and feedback.
    """

    queryset = AnalysisHistory.objects.all()
    serializer_class = AnalysisHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["analysis__analysis_type", "analysis__status"]
    ordering_fields = ["viewed_at"]
    ordering = ["-viewed_at"]

    def get_queryset(self):
        """Filter history to current user only."""
        return AnalysisHistory.objects.filter(user=self.request.user)

    @extend_schema(
        summary="Submit Analysis Feedback",
        description="Submit feedback rating and comment for an analysis.",
        request=AnalysisFeedbackSerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def submit_feedback(self, request, pk=None):
        """Submit feedback for an analysis."""
        history = self.get_object()
        serializer = AnalysisFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        history.feedback_rating = serializer.validated_data.get("feedback_rating")
        history.feedback_comment = serializer.validated_data.get("feedback_comment")
        history.save()

        return Response(
            {
                "message": "Feedback submitted successfully",
                "feedback_rating": history.feedback_rating,
                "feedback_comment": history.feedback_comment,
            }
        )
