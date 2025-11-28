"""
Views for YouCam AI Analysis API
"""

import logging

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import AnalysisStatus, AnalysisType, YouCamAnalysis
from .serializers import (
    YouCamAnalysisDetailSerializer,
    YouCamAnalysisListSerializer,
    FaceAnalysisCreateSerializer,
    FaceAnalysisResponseSerializer,
    LipsAnalysisCreateSerializer,
    HairAnalysisCreateSerializer,
    HairExtensionAnalysisCreateSerializer,
    SkinAnalysisCreateSerializer,
)
from .youcam_client import YouCamClient, YouCamAPIError

logger = logging.getLogger(__name__)


def process_analysis_synchronously(analysis, request):
    """
    Helper method to process YouCam analysis synchronously and return enhanced results.
    """
    try:
        # Update status to processing
        analysis.status = AnalysisStatus.PROCESSING
        analysis.save()

        logger.info(f"Starting immediate YouCam analysis for {analysis.analysis_type}: {analysis.id}")

        # Initialize YouCam client
        client = YouCamClient()

        # Perform analysis based on type
        if analysis.analysis_type == "skin_analysis":
            result = client.analyze_skin(analysis.image)
        elif analysis.analysis_type == "face_analyzer":
            result = client.analyze_face(analysis.image)
        elif analysis.analysis_type == "hair_analysis":
            result = client.analyze_hair(analysis.image)
        elif analysis.analysis_type == "lips_analysis":
            result = client.analyze_lips(analysis.image)
        elif analysis.analysis_type == "hair_extension_analysis":
            result = client.analyze_hair_extension(analysis.image)
        else:
            raise ValueError(f"Unsupported analysis type: {analysis.analysis_type}")

        # Update analysis with results - handle different response formats
        if analysis.analysis_type == "face_analyzer":
            # New format for face analysis
            analysis.raw_response = result
            analysis.analysis_results = result.get("result", {})
            analysis.issues_detected = []  # Face analysis no longer returns issues in new format
            analysis.recommendations = []  # Face analysis no longer returns recommendations in new format
        elif analysis.analysis_type == "skin_analysis":
            # New format for skin analysis
            analysis.raw_response = result
            analysis.analysis_results = result.get("skin_analysis", {})
            analysis.issues_detected = []  # Skin analysis uses new format
            analysis.recommendations = result.get("recommendations", {}).get("skincare_routine", [])
        elif analysis.analysis_type == "hair_analysis":
            # New format for hair analysis
            analysis.raw_response = result
            analysis.analysis_results = result.get("result", {})
            analysis.issues_detected = []  # Hair analysis uses new format
            analysis.recommendations = result.get("result", {}).get("hair_care_routine", [])
        elif analysis.analysis_type == "lips_analysis":
            # New format for lips analysis
            analysis.raw_response = result
            analysis.analysis_results = result.get("result", {})
            analysis.issues_detected = []  # Lips analysis uses new format
            analysis.recommendations = result.get("result", {}).get("recommendations", {}).get("daily_care", [])
        elif analysis.analysis_type == "hair_extension_analysis":
            # New format for hair extension analysis
            analysis.raw_response = result
            analysis.analysis_results = result.get("result", {})
            analysis.issues_detected = []  # Hair extension analysis uses new format
            analysis.recommendations = result.get("result", {}).get("styling_tips", {}).get("daily_care", [])
        else:
            # Legacy format for other analysis types
            analysis.raw_response = result.get("raw_data", {})
            analysis.analysis_results = result.get("results", {})
            analysis.issues_detected = result.get("issues_detected", [])
            analysis.recommendations = result.get("recommendations", [])
        
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = timezone.now()
        analysis.save()

        logger.info(f"YouCam analysis completed successfully: {analysis.id}")

        # Return new format for face analysis
        if analysis.analysis_type == "face_analyzer":
            # Extract the result from raw_response
            face_result = analysis.raw_response
            # Return exact format as specified with metadata fields
            response_data = {
                "success": face_result.get("success", True),
                "result": face_result.get("result", {})
            }
            # Add optional metadata fields for tracking (these can be used by clients if needed)
            response_data["analysis_id"] = str(analysis.id)
            response_data["analysis_type"] = analysis.get_analysis_type_display()
            response_data["status"] = analysis.status
            response_data["completed_at"] = analysis.completed_at.isoformat()
            
            return response_data, status.HTTP_201_CREATED
        
        # Return new format for skin analysis
        if analysis.analysis_type == "skin_analysis":
            # Return the complete skin analysis response
            response_data = analysis.raw_response.copy()
            # Add optional metadata fields for tracking
            response_data["analysis_id"] = str(analysis.id)
            response_data["analysis_type"] = analysis.get_analysis_type_display()
            response_data["status"] = analysis.status
            response_data["completed_at"] = analysis.completed_at.isoformat()
            
            return response_data, status.HTTP_201_CREATED
        
        # Return new format for hair analysis
        if analysis.analysis_type == "hair_analysis":
            # Return the complete hair analysis response
            response_data = analysis.raw_response.copy()
            # Add optional metadata fields for tracking
            response_data["analysis_id"] = str(analysis.id)
            response_data["analysis_type"] = analysis.get_analysis_type_display()
            response_data["status"] = analysis.status
            response_data["completed_at"] = analysis.completed_at.isoformat()
            
            return response_data, status.HTTP_201_CREATED
        
        # Return new format for lips analysis
        if analysis.analysis_type == "lips_analysis":
            # Return the complete lips analysis response
            response_data = analysis.raw_response.copy()
            # Add optional metadata fields for tracking
            response_data["analysis_id"] = str(analysis.id)
            response_data["analysis_type"] = analysis.get_analysis_type_display()
            response_data["status"] = analysis.status
            response_data["completed_at"] = analysis.completed_at.isoformat()
            
            return response_data, status.HTTP_201_CREATED
        
        # Return new format for hair extension analysis
        if analysis.analysis_type == "hair_extension_analysis":
            # Return the complete hair extension analysis response
            response_data = analysis.raw_response.copy()
            # Add optional metadata fields for tracking
            response_data["analysis_id"] = str(analysis.id)
            response_data["analysis_type"] = analysis.get_analysis_type_display()
            response_data["status"] = analysis.status
            response_data["completed_at"] = analysis.completed_at.isoformat()
            
            return response_data, status.HTTP_201_CREATED
        
        # Legacy format for other analysis types
        # Use the enhanced detail serializer for comprehensive results
        # Handle test requests that might not have proper HTTP_HOST
        try:
            detail_serializer = YouCamAnalysisDetailSerializer(analysis, context={'request': request})
        except Exception as serializer_error:
            logger.warning(f"Serializer error with request context: {serializer_error}")
            # Fallback to serializer without request context
            detail_serializer = YouCamAnalysisDetailSerializer(analysis)

        # Get enhanced data safely
        try:
            comprehensive_report = detail_serializer.data
        except Exception as e:
            logger.warning(f"Error getting comprehensive report: {e}")
            comprehensive_report = {}
            
        try:
            analysis_summary = detail_serializer.get_analysis_summary(analysis)
        except Exception as e:
            logger.warning(f"Error getting analysis summary: {e}")
            analysis_summary = {}
            
        try:
            detailed_recommendations = detail_serializer.get_detailed_recommendations(analysis)
        except Exception as e:
            logger.warning(f"Error getting detailed recommendations: {e}")
            detailed_recommendations = {}
            
        try:
            confidence_score = detail_serializer.get_confidence_score(analysis)
        except Exception as e:
            logger.warning(f"Error getting confidence score: {e}")
            confidence_score = 0

        return {
            "message": "AI analysis completed successfully.",
            "analysis_id": str(analysis.id),
            "analysis_type": analysis.get_analysis_type_display(),
            "status": analysis.status,
            "completed_at": analysis.completed_at.isoformat(),
            "comprehensive_report": comprehensive_report,
            "analysis_summary": analysis_summary,
            "detailed_recommendations": detailed_recommendations,
            "confidence_score": confidence_score
        }, status.HTTP_201_CREATED

    except YouCamAPIError as e:
        logger.error(f"YouCam API error for analysis {analysis.id}: {str(e)}")
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = str(e)
        analysis.save()

        return {
            "error": "YouCam API Error",
            "message": f"Analysis failed due to API error: {str(e)}",
            "analysis_id": str(analysis.id),
            "analysis_type": analysis.get_analysis_type_display(),
            "status": analysis.status,
            "error_details": str(e)
        }, status.HTTP_500_INTERNAL_SERVER_ERROR

    except Exception as e:
        logger.error(f"Unexpected error processing YouCam analysis {analysis.id}: {str(e)}")
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = str(e)
        analysis.save()

        return {
            "error": "Analysis Processing Error",
            "message": f"Analysis failed due to unexpected error: {str(e)}",
            "analysis_id": str(analysis.id),
            "analysis_type": analysis.get_analysis_type_display(),
            "status": analysis.status,
            "error_details": str(e)
        }, status.HTTP_500_INTERNAL_SERVER_ERROR


# Separate ViewSets for each analysis type

@extend_schema(tags=["YouCam Face Analysis"])
@extend_schema_view(
    create=extend_schema(
        summary="Create Face Analysis",
        description="Submit a new image for AI face analysis. Returns detailed facial features including emotion, beauty score, face shape, skin tone, and detailed feature analysis (eyes, nose, lips, eyebrows). The response includes the core analysis result plus optional metadata for tracking. Send image as base64 encoded string in JSON payload.",
        request=FaceAnalysisCreateSerializer,
        responses={
            201: OpenApiResponse(
                response=FaceAnalysisResponseSerializer,
                description="Face analysis completed successfully with detailed results",
                examples=[
                    OpenApiExample(
                        "Successful Face Analysis",
                        value={
                            "success": True,
                            "result": {
                                "api_source": "Fallback_Analysis",
                                "fallback_reason": "fetch failed",
                                "emotion": "Happy",
                                "beauty_score": 98,
                                "face_shape": "Heart",
                                "skin_tone": "Medium",
                                "confidence": 0.942726016839419,
                                "features": {
                                    "eyes": {
                                        "shape": "Monolid",
                                        "size": "Small",
                                        "distance": "Normal",
                                        "dark_circles": "None",
                                        "puffiness": "None"
                                    },
                                    "nose": {
                                        "shape": "Straight",
                                        "size": "Medium"
                                    },
                                    "lips": {
                                        "shape": "Heart-shaped",
                                        "fullness": "Medium"
                                    },
                                    "eyebrows": {
                                        "shape": "Arched",
                                        "thickness": "Thick"
                                    }
                                }
                            },
                            "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
                            "analysis_type": "AI Face Analyzer",
                            "status": "completed",
                            "completed_at": "2025-10-14T12:00:00Z"
                        }
                    )
                ]
            ),
            500: OpenApiResponse(description="Analysis failed due to error")
        },
        examples=[
            OpenApiExample(
                "Face Analysis Request",
                value={"imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."},
                description="Submit base64 encoded image for face analysis",
            ),
        ],
    ),
    list=extend_schema(
        summary="List Face Analyses",
        description="Retrieve a list of all face analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Face Analysis Details",
        description="Retrieve detailed information about a specific face analysis including facial features, emotion, beauty score, and detailed feature breakdown.",
    ),
)
class FaceAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Face Analysis requests.
    """

    queryset = YouCamAnalysis.objects.filter(analysis_type=AnalysisType.FACE_ANALYZER)
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "user"]
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
            return FaceAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new face analysis request and process it immediately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request with face analyzer type
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            analysis_type=AnalysisType.FACE_ANALYZER
        )

        # Process the analysis immediately using helper method
        response_data, status_code = process_analysis_synchronously(analysis, request)
        return Response(response_data, status=status_code)


@extend_schema(tags=["YouCam Lips Analysis"])
@extend_schema_view(
    create=extend_schema(
        summary="Create Lips Analysis",
        description="Submit a new image for AI lips analysis. Analyzes lip shape, color, texture, and provides beauty recommendations. Send image as base64 encoded string in JSON payload.",
        examples=[
            OpenApiExample(
                "Lips Analysis",
                value={"imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."},
                description="Submit base64 encoded image for lips analysis",
            ),
        ],
    ),
    list=extend_schema(
        summary="List Lips Analyses",
        description="Retrieve a list of all lips analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Lips Analysis Details",
        description="Retrieve detailed information about a specific lips analysis including results, issues detected, and recommendations.",
    ),
)
class LipsAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Lips Analysis requests.
    """

    queryset = YouCamAnalysis.objects.filter(analysis_type=AnalysisType.LIPS_ANALYSIS)
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "user"]
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
            return LipsAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new lips analysis request and process it immediately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request with lips analysis type
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            analysis_type=AnalysisType.LIPS_ANALYSIS
        )

        # Process the analysis immediately using helper method
        response_data, status_code = process_analysis_synchronously(analysis, request)
        return Response(response_data, status=status_code)


@extend_schema(tags=["YouCam Hair Analysis"])
@extend_schema_view(
    create=extend_schema(
        summary="Create Hair Analysis",
        description="Submit a new image for AI hair analysis. Analyzes hair quality, texture, color, and provides styling recommendations. Send image as base64 encoded string in JSON payload.",
        examples=[
            OpenApiExample(
                "Hair Analysis",
                value={"imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."},
                description="Submit base64 encoded image for hair analysis",
            ),
        ],
    ),
    list=extend_schema(
        summary="List Hair Analyses",
        description="Retrieve a list of all hair analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Hair Analysis Details",
        description="Retrieve detailed information about a specific hair analysis including results, issues detected, and recommendations.",
    ),
)
class HairAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Hair Analysis requests.
    """

    queryset = YouCamAnalysis.objects.filter(analysis_type=AnalysisType.HAIR_ANALYSIS)
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "user"]
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
            return HairAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new hair analysis request and process it immediately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request with hair analysis type
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            analysis_type=AnalysisType.HAIR_ANALYSIS
        )

        # Process the analysis immediately using helper method
        response_data, status_code = process_analysis_synchronously(analysis, request)
        return Response(response_data, status=status_code)


@extend_schema(tags=["YouCam Hair Extension Analysis"])
@extend_schema_view(
    create=extend_schema(
        summary="Create Hair Extension Analysis",
        description=(
            "Submit a new image for AI hair extension analysis. Analyzes face shape, hair color, and provides "
            "comprehensive hairstyle recommendations. You can optionally include a 'categories' array in the request body "
            "to specify which sections to return. Available categories: 'hairstyle_categories', 'color_recommendations', "
            "'styling_tips', 'installation_methods', 'analysis_info'. Send image as base64 encoded string in JSON payload."
        ),
        request=HairExtensionAnalysisCreateSerializer,
        examples=[
            OpenApiExample(
                "Hair Extension Analysis",
                value={
                    "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
                    "categories": [
                        "hairstyle_categories",
                        "color_recommendations",
                        "styling_tips",
                        "installation_methods",
                        "analysis_info"
                    ]
                },
                description=(
                    "Submit base64 encoded image for hair extension analysis with optional categories to filter response"
                ),
            ),
        ],
    ),
    list=extend_schema(
        summary="List Hair Extension Analyses",
        description="Retrieve a list of all hair extension analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Hair Extension Analysis Details",
        description="Retrieve detailed information about a specific hair extension analysis including hairstyle categories, color recommendations, styling tips, and installation methods.",
    ),
)
class HairExtensionAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Hair Extension Analysis requests.
    """

    queryset = YouCamAnalysis.objects.filter(analysis_type=AnalysisType.HAIR_EXTENSION_ANALYSIS)
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "user"]
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
            return HairExtensionAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new hair extension analysis request and process it immediately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request with hair extension analysis type
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            analysis_type=AnalysisType.HAIR_EXTENSION_ANALYSIS
        )

        # Process the analysis immediately using helper method
        response_data, status_code = process_analysis_synchronously(analysis, request)
        return Response(response_data, status=status_code)


@extend_schema(tags=["YouCam Skin Analysis"])
@extend_schema_view(
    create=extend_schema(
        summary="Create Skin Analysis",
        description="Submit a new image for AI skin analysis. Analyzes skin condition, texture, tone, and provides skincare recommendations. Send image as base64 encoded string in JSON payload.",
        examples=[
            OpenApiExample(
                "Skin Analysis",
                value={"imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."},
                description="Submit base64 encoded image for skin analysis",
            ),
        ],
    ),
    list=extend_schema(
        summary="List Skin Analyses",
        description="Retrieve a list of all skin analyses with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (pending, processing, completed, failed)",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Skin Analysis Details",
        description="Retrieve detailed information about a specific skin analysis including results, issues detected, and recommendations.",
    ),
)
class SkinAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Skin Analysis requests.
    """

    queryset = YouCamAnalysis.objects.filter(analysis_type=AnalysisType.SKIN_ANALYSIS)
    serializer_class = YouCamAnalysisListSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "user"]
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
            return SkinAnalysisCreateSerializer
        elif self.action == "list":
            return YouCamAnalysisListSerializer
        else:
            return YouCamAnalysisDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new skin analysis request and process it immediately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the analysis request with skin analysis type
        analysis = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            analysis_type=AnalysisType.SKIN_ANALYSIS
        )

        # Process the analysis immediately using helper method
        response_data, status_code = process_analysis_synchronously(analysis, request)
        return Response(response_data, status=status_code)


    @extend_schema(
        operation_id="youcam_analysis_comprehensive_report",
        summary="Get Comprehensive Analysis Report",
        description="Retrieve a comprehensive analysis report with detailed health assessment, risk factors, and structured recommendations in JSON format.",
        responses={
            200: YouCamAnalysisDetailSerializer,
            404: OpenApiResponse(description="Analysis not found"),
            400: OpenApiResponse(description="Analysis not completed"),
        },
        tags=["YouCam Analysis Reports"]
    )
    @action(detail=True, methods=["get"], url_path="comprehensive-report")
    def get_comprehensive_report(self, request, pk=None):
        """
        Get comprehensive analysis report with detailed health assessment and recommendations.
        
        Returns a structured JSON report containing:
        - Analysis metadata and processing information
        - Technical results from the AI analysis
        - Health assessment with scores and condition status
        - Visual analysis summary
        - Risk factors categorized by severity
        - Improvement areas and action plans
        - Detailed recommendations with priorities and timeframes
        """
        try:
            analysis = self.get_object()
            
            if not analysis.is_completed:
                return Response(
                    {
                        "error": "Analysis not completed",
                        "message": "Please wait for the analysis to complete before requesting the comprehensive report.",
                        "current_status": analysis.status,
                        "analysis_id": str(analysis.id)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the enhanced detail serializer for comprehensive report
            serializer = YouCamAnalysisDetailSerializer(analysis, context={'request': request})
            
            return Response({
                "success": True,
                "analysis_id": str(analysis.id),
                "analysis_type": analysis.get_analysis_type_display(),
                "comprehensive_report": serializer.data
            })
            
        except YouCamAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found", "analysis_id": pk},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating comprehensive report for analysis {pk}: {str(e)}")
            return Response(
                {"error": "Failed to generate comprehensive report", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @extend_schema(
        operation_id="youcam_analysis_health_summary",
        summary="Get Health Assessment Summary",
        description="Retrieve a concise health assessment summary with key findings and immediate actions.",
        responses={
            200: OpenApiResponse(description="Health assessment summary"),
            404: OpenApiResponse(description="Analysis not found"),
            400: OpenApiResponse(description="Analysis not completed"),
        },
        tags=["YouCam Analysis Reports"]
    )
    @action(detail=True, methods=["get"], url_path="health-summary")
    def get_health_summary(self, request, pk=None):
        """
        Get health assessment summary with key findings and immediate actions.
        
        Returns a concise summary containing:
        - Overall condition assessment
        - Key findings from the analysis
        - Primary concerns and issues detected
        - Immediate actions recommended
        - Follow-up recommendations
        """
        try:
            analysis = self.get_object()
            
            if not analysis.is_completed:
                return Response(
                    {
                        "error": "Analysis not completed",
                        "message": "Please wait for the analysis to complete before requesting the health summary.",
                        "current_status": analysis.status,
                        "analysis_id": str(analysis.id)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the enhanced detail serializer for health summary
            serializer = YouCamAnalysisDetailSerializer(analysis, context={'request': request})
            summary_data = serializer.get_analysis_summary(analysis)
            
            return Response({
                "success": True,
                "analysis_id": str(analysis.id),
                "analysis_type": analysis.get_analysis_type_display(),
                "health_summary": summary_data
            })
            
        except YouCamAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found", "analysis_id": pk},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating health summary for analysis {pk}: {str(e)}")
            return Response(
                {"error": "Failed to generate health summary", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @extend_schema(
        operation_id="youcam_analysis_recommendations",
        summary="Get Detailed Recommendations",
        description="Retrieve detailed recommendations categorized by priority and timeframe.",
        responses={
            200: OpenApiResponse(description="Detailed recommendations"),
            404: OpenApiResponse(description="Analysis not found"),
            400: OpenApiResponse(description="Analysis not completed"),
        },
        tags=["YouCam Analysis Reports"]
    )
    @action(detail=True, methods=["get"], url_path="detailed-recommendations")
    def get_detailed_recommendations(self, request, pk=None):
        """
        Get detailed recommendations with categories, priorities, and timeframes.
        
        Returns structured recommendations containing:
        - Immediate actions (high priority, within 1 week)
        - Short-term goals (medium priority, 1-4 weeks)
        - Long-term goals (low priority, 1-3 months)
        - Lifestyle changes (ongoing)
        - Professional care recommendations
        """
        try:
            analysis = self.get_object()
            
            if not analysis.is_completed:
                return Response(
                    {
                        "error": "Analysis not completed",
                        "message": "Please wait for the analysis to complete before requesting recommendations.",
                        "current_status": analysis.status,
                        "analysis_id": str(analysis.id)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the enhanced detail serializer for recommendations
            serializer = YouCamAnalysisDetailSerializer(analysis, context={'request': request})
            recommendations_data = serializer.get_detailed_recommendations(analysis)
            
            return Response({
                "success": True,
                "analysis_id": str(analysis.id),
                "analysis_type": analysis.get_analysis_type_display(),
                "detailed_recommendations": recommendations_data
            })
            
        except YouCamAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found", "analysis_id": pk},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating recommendations for analysis {pk}: {str(e)}")
            return Response(
                {"error": "Failed to generate recommendations", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @extend_schema(
        operation_id="youcam_analysis_export_report",
        summary="Export Analysis Report",
        description="Export comprehensive analysis report in various formats (JSON, PDF).",
        parameters=[
            OpenApiParameter(
                name="format",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Export format (json, pdf)",
                enum=["json", "pdf"],
                default="json"
            ),
        ],
        responses={
            200: OpenApiResponse(description="Exported report"),
            404: OpenApiResponse(description="Analysis not found"),
            400: OpenApiResponse(description="Analysis not completed or invalid format"),
        },
        tags=["YouCam Analysis Reports"]
    )
    @action(detail=True, methods=["get"], url_path="export-report")
    def export_analysis_report(self, request, pk=None):
        """
        Export comprehensive analysis report in JSON or PDF format.
        
        Supports export formats:
        - JSON: Complete structured data for programmatic use
        - PDF: Formatted report for human reading (future implementation)
        """
        try:
            analysis = self.get_object()
            export_format = request.query_params.get('format', 'json').lower()
            
            if not analysis.is_completed:
                return Response(
                    {
                        "error": "Analysis not completed",
                        "message": "Please wait for the analysis to complete before exporting the report.",
                        "current_status": analysis.status,
                        "analysis_id": str(analysis.id)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if export_format == 'json':
                # Use the enhanced detail serializer for JSON export
                serializer = YouCamAnalysisDetailSerializer(analysis, context={'request': request})
                
                response_data = {
                    "export_metadata": {
                        "exported_at": timezone.now().isoformat(),
                        "analysis_id": str(analysis.id),
                        "analysis_type": analysis.get_analysis_type_display(),
                        "format": "json",
                        "version": "1.0"
                    },
                    "comprehensive_report": serializer.data
                }
                
                return Response(response_data)
                
            elif export_format == 'pdf':
                # PDF export would be implemented here
                return Response(
                    {
                        "error": "PDF export not yet implemented",
                        "message": "PDF export functionality will be available in a future update.",
                        "available_formats": ["json"]
                    },
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )
                
            else:
                return Response(
                    {
                        "error": "Invalid export format",
                        "message": "Supported formats: json, pdf",
                        "provided_format": export_format
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except YouCamAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found", "analysis_id": pk},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error exporting report for analysis {pk}: {str(e)}")
            return Response(
                {"error": "Failed to export report", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
