"""
Dentscape AI Views
"""

import logging
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import DentscapeSimulation, DentscapeAnalysis, DentscapeHistory
from .serializers import (
    DentscapeSimulationSerializer,
    DentscapeAnalysisSerializer,
    DentscapeSimulationResponseSerializer,
    DentscapeAnalysisResponseSerializer,
    DentscapeHistorySerializer,
    SimulationRequestSerializer,
    AnalysisRequestSerializer
)
from .dentscape_client import DentscapeClient, DentscapeAPIError

logger = logging.getLogger(__name__)


class DentscapeSimulationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Dentscape Simulation operations
    """
    
    queryset = DentscapeSimulation.objects.all()
    serializer_class = DentscapeSimulationSerializer
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = []  # Remove authentication requirement
    permission_classes = []     # Remove permission requirement
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SimulationRequestSerializer
        elif self.action in ['list', 'retrieve']:
            return DentscapeSimulationResponseSerializer
        return DentscapeSimulationSerializer
    
    def create(self, request):
        """
        Override create method to handle simulation requests properly
        """
        serializer = SimulationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = serializer.validated_data['user_id']
        image = serializer.validated_data['image']
        
        # Create simulation record
        simulation = DentscapeSimulation.objects.create(
            tracking_user_id=user_id,
            simulation_type='orthodontics',
            image=image,
            user=request.user if request.user.is_authenticated else None
        )
        
        try:
            # Initialize Dentscape client
            client = DentscapeClient()
            
            # Perform simulation
            result = client.simulate_orthodontics(image, user_id)
            
            # Update simulation record with results
            simulation.raw_response = result
            simulation.simulation_results = result.get('results', {})
            simulation.before_image_url = result.get('before_image_url')
            simulation.after_image_url = result.get('after_image_url')
            simulation.status = 'completed'
            simulation.completed_at = timezone.now()
            simulation.save()
            
            # Return success response
            response_serializer = DentscapeSimulationResponseSerializer(simulation)
            return Response({
                "success": True,
                "message": "Orthodontics simulation completed successfully",
                "data": response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except DentscapeAPIError as e:
            simulation.status = 'failed'
            simulation.error_message = str(e)
            simulation.save()
            
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_502_BAD_GATEWAY)
            
        except Exception as e:
            simulation.status = 'failed'
            simulation.error_message = str(e)
            simulation.save()
            
            logger.error(f"Error in orthodontics simulation: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Create Orthodontics Simulation",
        description="Create a new orthodontics simulation request with user tracking",
        request=SimulationRequestSerializer,
        responses={
            201: DentscapeSimulationResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        },
        examples=[
            OpenApiExample(
                "Orthodontics Simulation Request",
                summary="Example orthodontics simulation request",
                description="Submit a dental image for orthodontics simulation",
                value={
                    "user_id": "user_12345",
                    "image": "dental_image.jpg"
                }
            )
        ]
    )
    @action(detail=False, methods=['post'], url_path='orthodontics')
    def create_orthodontics_simulation(self, request):
        """
        Create orthodontics simulation
        """
        try:
            serializer = SimulationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create simulation record
            simulation = DentscapeSimulation.objects.create(
                tracking_user_id=user_id,
                simulation_type='orthodontics',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process simulation
            client = DentscapeClient()
            result = client.simulate_orthodontics(image, user_id)
            
            if result.get('success'):
                simulation.simulation_results = result.get('results', {})
                simulation.before_image_url = result.get('results', {}).get('before_after_comparison', {}).get('before_image_url')
                simulation.after_image_url = result.get('results', {}).get('before_after_comparison', {}).get('after_image_url')
                simulation.status = 'completed'
                simulation.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        simulation=simulation,
                        user=request.user
                    )
                
                response_serializer = DentscapeSimulationResponseSerializer(simulation)
                return Response({
                    "success": True,
                    "message": "Orthodontics simulation completed successfully",
                    "simulation_id": str(simulation.id),
                    "simulation_type": "Orthodontics Simulation",
                    "status": "completed",
                    "completed_at": simulation.completed_at,
                    "results": result.get('results', {}),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.85)
                }, status=status.HTTP_201_CREATED)
            else:
                simulation.error_message = result.get('error', 'Simulation failed')
                simulation.status = 'failed'
                simulation.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Simulation failed'),
                    "validation": result.get('validation', {}),
                    "simulation_id": str(simulation.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Orthodontics simulation error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Create Veneer with Whitening Simulation",
        description="Create a new veneer with whitening simulation request with user tracking",
        request=SimulationRequestSerializer,
        responses={
            201: DentscapeSimulationResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='veneer-with-whitening')
    def create_veneer_with_whitening_simulation(self, request):
        """
        Create veneer with whitening simulation
        """
        try:
            serializer = SimulationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create simulation record
            simulation = DentscapeSimulation.objects.create(
                tracking_user_id=user_id,
                simulation_type='veneer_with_whitening',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process simulation
            client = DentscapeClient()
            result = client.simulate_veneer_with_whitening(image, user_id)
            
            if result.get('success'):
                simulation.simulation_results = result.get('results', {})
                simulation.before_image_url = result.get('results', {}).get('before_after_comparison', {}).get('before_image_url')
                simulation.after_image_url = result.get('results', {}).get('before_after_comparison', {}).get('after_image_url')
                simulation.status = 'completed'
                simulation.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        simulation=simulation,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Veneer with whitening simulation completed successfully",
                    "simulation_id": str(simulation.id),
                    "simulation_type": "Veneer with Whitening Simulation",
                    "status": "completed",
                    "completed_at": simulation.completed_at,
                    "results": result.get('results', {}),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.90)
                }, status=status.HTTP_201_CREATED)
            else:
                simulation.error_message = result.get('error', 'Simulation failed')
                simulation.status = 'failed'
                simulation.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Simulation failed'),
                    "validation": result.get('validation', {}),
                    "simulation_id": str(simulation.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Veneer with whitening simulation error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Create Tooth Whitening Simulation",
        description="Create a new tooth whitening simulation request with user tracking",
        request=SimulationRequestSerializer,
        responses={
            201: DentscapeSimulationResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='tooth-whitening')
    def create_tooth_whitening_simulation(self, request):
        """
        Create tooth whitening simulation
        """
        try:
            serializer = SimulationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create simulation record
            simulation = DentscapeSimulation.objects.create(
                tracking_user_id=user_id,
                simulation_type='tooth_whitening',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process simulation
            client = DentscapeClient()
            result = client.simulate_tooth_whitening(image, user_id)
            
            if result.get('success'):
                simulation.simulation_results = result.get('results', {})
                simulation.before_image_url = result.get('results', {}).get('before_after_comparison', {}).get('before_image_url')
                simulation.after_image_url = result.get('results', {}).get('before_after_comparison', {}).get('after_image_url')
                simulation.status = 'completed'
                simulation.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        simulation=simulation,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Tooth whitening simulation completed successfully",
                    "simulation_id": str(simulation.id),
                    "simulation_type": "Tooth Whitening Simulation",
                    "status": "completed",
                    "completed_at": simulation.completed_at,
                    "results": result.get('results', {}),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.88)
                }, status=status.HTTP_201_CREATED)
            else:
                simulation.error_message = result.get('error', 'Simulation failed')
                simulation.status = 'failed'
                simulation.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Simulation failed'),
                    "validation": result.get('validation', {}),
                    "simulation_id": str(simulation.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Tooth whitening simulation error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DentscapeAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Dentscape Analysis operations
    """
    
    queryset = DentscapeAnalysis.objects.all()
    serializer_class = DentscapeAnalysisSerializer
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = []  # Remove authentication requirement
    permission_classes = []     # Remove permission requirement
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnalysisRequestSerializer
        elif self.action in ['list', 'retrieve']:
            return DentscapeAnalysisResponseSerializer
        return DentscapeAnalysisSerializer
    
    def create(self, request):
        """
        Override create method to handle analysis requests properly
        """
        serializer = AnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = serializer.validated_data['user_id']
        image = serializer.validated_data['image']
        
        # Create analysis record
        analysis = DentscapeAnalysis.objects.create(
            tracking_user_id=user_id,
            analysis_type='smile_curve_upper',
            image=image,
            user=request.user if request.user.is_authenticated else None
        )
        
        try:
            # Initialize Dentscape client
            client = DentscapeClient()
            
            # Perform analysis
            result = client.analyze_smile_curve_upper(image, user_id)
            
            # Update analysis record with results
            analysis.raw_response = result
            analysis.analysis_results = result.get('results', {})
            analysis.annotations_image_url = result.get('annotations_image_url')
            analysis.status = 'completed'
            analysis.completed_at = timezone.now()
            analysis.save()
            
            # Return success response
            response_serializer = DentscapeAnalysisResponseSerializer(analysis)
            return Response({
                "success": True,
                "message": "Smile curve upper analysis completed successfully",
                "data": response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except DentscapeAPIError as e:
            analysis.status = 'failed'
            analysis.error_message = str(e)
            analysis.save()
            
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_502_BAD_GATEWAY)
            
        except Exception as e:
            analysis.status = 'failed'
            analysis.error_message = str(e)
            analysis.save()
            
            logger.error(f"Error in smile curve upper analysis: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Generate Smile Curve of Upper Teeth",
        description="Analyze and generate smile curve of upper teeth with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='smile-curve-upper')
    def create_smile_curve_upper_analysis(self, request):
        """
        Create smile curve upper analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='smile_curve_upper',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_smile_curve_upper(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Smile curve upper analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "Generate Smile Curve of Upper Teeth",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.87)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Smile curve upper analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="E-line Analysis",
        description="Perform E-line analysis for profile images with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='e-line')
    def create_e_line_analysis(self, request):
        """
        Create E-line analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='e_line_analysis',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_e_line(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "E-line analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "E-line Analysis",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.89)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"E-line analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Tooth Segmentation",
        description="Perform tooth segmentation analysis with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='tooth-segmentation')
    def create_tooth_segmentation_analysis(self, request):
        """
        Create tooth segmentation analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='tooth_segmentation',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_tooth_segmentation(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Tooth segmentation analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "Tooth Segmentation",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.91)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Tooth segmentation analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Calculate Width to Height Ratio of Incisors",
        description="Calculate width to height ratio of incisor teeth with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='width-height-ratio-incisors')
    def create_width_height_ratio_incisors_analysis(self, request):
        """
        Create width to height ratio incisors analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='width_height_ratio_incisors',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_width_height_ratio_incisors(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Width to height ratio incisors analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "Calculate Width to Height Ratio of Incisors",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.86)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Width to height ratio incisors analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Generate Incisal Plane",
        description="Generate incisal plane analysis with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='incisal-plane')
    def create_incisal_plane_analysis(self, request):
        """
        Create incisal plane analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='incisal_plane',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_incisal_plane(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Incisal plane analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "Generate Incisal Plane",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.84)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Incisal plane analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Calculate Interdental Width Proportion",
        description="Calculate interdental width proportion analysis with user tracking",
        request=AnalysisRequestSerializer,
        responses={
            201: DentscapeAnalysisResponseSerializer,
            400: {"description": "Bad Request - Invalid input or validation errors"},
            500: {"description": "Internal Server Error"}
        }
    )
    @action(detail=False, methods=['post'], url_path='interdental-width-proportion')
    def create_interdental_width_proportion_analysis(self, request):
        """
        Create interdental width proportion analysis
        """
        try:
            serializer = AnalysisRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = serializer.validated_data['user_id']
            image = serializer.validated_data['image']
            
            # Create analysis record
            analysis = DentscapeAnalysis.objects.create(
                tracking_user_id=user_id,
                analysis_type='interdental_width_proportion',
                image=image,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process analysis
            client = DentscapeClient()
            result = client.analyze_interdental_width_proportion(image, user_id)
            
            if result.get('success'):
                analysis.analysis_results = result.get('results', {})
                analysis.annotations_image_url = result.get('annotations_image_url')
                analysis.status = 'completed'
                analysis.save()
                
                # Create history record only if user is authenticated
                if request.user.is_authenticated:
                    DentscapeHistory.objects.create(
                        tracking_user_id=user_id,
                        analysis=analysis,
                        user=request.user
                    )
                
                return Response({
                    "success": True,
                    "message": "Interdental width proportion analysis completed successfully",
                    "analysis_id": str(analysis.id),
                    "analysis_type": "Calculate Interdental Width Proportion",
                    "status": "completed",
                    "completed_at": analysis.completed_at,
                    "results": result.get('results', {}),
                    "annotations_image_url": result.get('annotations_image_url'),
                    "api_version": result.get('api_version', 'Dentscape API v1.0'),
                    "confidence": result.get('confidence', 0.87)
                }, status=status.HTTP_201_CREATED)
            else:
                analysis.error_message = result.get('error', 'Analysis failed')
                analysis.status = 'failed'
                analysis.save()
                
                return Response({
                    "success": False,
                    "error": result.get('error', 'Analysis failed'),
                    "validation": result.get('validation', {}),
                    "analysis_id": str(analysis.id)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DentscapeAPIError as e:
            logger.error(f"Dentscape API error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Dentscape API error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Interdental width proportion analysis error: {str(e)}")
            return Response({
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DentscapeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Dentscape History operations
    """
    
    queryset = DentscapeHistory.objects.all()
    serializer_class = DentscapeHistorySerializer
    authentication_classes = []  # Remove authentication requirement
    permission_classes = []     # Remove permission requirement
    
    def get_queryset(self):
        """Filter history by tracking_user_id if provided"""
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(tracking_user_id=user_id)
        return queryset
