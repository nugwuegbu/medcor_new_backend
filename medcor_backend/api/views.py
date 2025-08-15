import asyncio
import aiohttp
import hashlib
import json
import logging
import os
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, CreateAPIView
from asgiref.sync import sync_to_async
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from core.models import ChatMessage, HairAnalysisReport, FaceAnalysisReport
from api.models import AnalysisTracking
from .serializers import (
    ChatMessageSerializer, CreateChatMessageSerializer,
    HairAnalysisReportSerializer, CreateHairAnalysisReportSerializer,
    FaceAnalysisReportSerializer, CreateFaceAnalysisReportSerializer,
    WeatherRequestSerializer, AdminStatsSerializer,
    AnalysisTrackingSerializer, CreateAnalysisTrackingSerializer,
    AnalysisTrackingStatsSerializer)

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatMessageListView(ListAPIView):
    """List chat messages for session."""

    permission_classes = [AllowAny]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        """Get messages with lazy loading."""
        session_id = self.request.query_params.get('session_id')
        if not session_id:
            return ChatMessage.objects.none()

        return ChatMessage.objects.select_related(
            'user',
            'doctor').filter(session_id=session_id).order_by('created_at')


class CreateChatMessageView(CreateAPIView):
    """Create new chat message."""

    permission_classes = [AllowAny]
    serializer_class = CreateChatMessageSerializer


class HairAnalysisView(APIView):
    """Hair analysis endpoint using YouCam API."""

    permission_classes = [AllowAny]

    async def post(self, request):
        """Process hair analysis with async YouCam API call."""
        try:
            image_data = request.data.get('image')
            if not image_data:
                return Response(
                    {
                        'success': False,
                        'message': 'Image data is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST)

            # Process image asynchronously
            analysis_result = await self.process_hair_analysis(image_data)

            if not analysis_result:
                return Response(
                    {
                        'success': False,
                        'message': 'Hair analysis failed'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Create analysis report
            report_data = {
                'session_id': request.data.get('session_id', ''),
                'user':
                request.user.id if request.user.is_authenticated else None,
                'hair_type': analysis_result.get('hair_type', 'Unknown'),
                'hair_condition': analysis_result.get('hair_condition',
                                                      'Unknown'),
                'scalp_health': analysis_result.get('scalp_health', 'Unknown'),
                'recommendations': analysis_result.get('recommendations', []),
                'confidence': analysis_result.get('confidence', 0),
                'analysis_result': analysis_result,
                'image_hash': hashlib.md5(image_data.encode()).hexdigest()
            }

            # Save to database
            serializer = CreateHairAnalysisReportSerializer(data=report_data)
            if serializer.is_valid():
                await sync_to_async(serializer.save)()

            return Response({
                'success': True,
                'analysis': analysis_result
            },
                            status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Hair analysis error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Hair analysis failed'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def process_hair_analysis(self, image_data):
        """Process hair analysis with YouCam API."""
        try:
            api_key = settings.YOUCAM_API_KEY
            secret_key = settings.YOUCAM_SECRET_KEY

            if not api_key or not secret_key:
                logger.error("YouCam API credentials not configured")
                return None

            # Prepare API request
            url = "https://api.youcam.com/v1/hair-analysis"
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }

            payload = {'image': image_data, 'analysis_type': 'comprehensive'}

            # Make async API call
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers,
                                        json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        logger.error(f"YouCam API error: {response.status}")
                        return None

        except Exception as e:
            logger.error(f"Hair analysis API error: {str(e)}")
            return None


class SkinAnalysisView(APIView):
    """Skin analysis endpoint using YouCam API."""

    permission_classes = [AllowAny]

    async def post(self, request):
        """Process skin analysis with async YouCam API call."""
        try:
            image_data = request.data.get('image')
            if not image_data:
                return Response(
                    {
                        'success': False,
                        'message': 'Image data is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST)

            # Process image asynchronously
            analysis_result = await self.process_skin_analysis(image_data)

            if not analysis_result:
                return Response(
                    {
                        'success': False,
                        'message': 'Skin analysis failed'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'success': True,
                'analysis': analysis_result
            },
                            status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Skin analysis error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Skin analysis failed'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def process_skin_analysis(self, image_data):
        """Process skin analysis with YouCam API."""
        try:
            api_key = settings.YOUCAM_API_KEY
            secret_key = settings.YOUCAM_SECRET_KEY

            if not api_key or not secret_key:
                logger.error("YouCam API credentials not configured")
                return None

            # Prepare API request
            url = "https://api.youcam.com/v1/skin-analysis"
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }

            payload = {'image': image_data, 'analysis_type': 'comprehensive'}

            # Make async API call
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers,
                                        json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        logger.error(f"YouCam API error: {response.status}")
                        return None

        except Exception as e:
            logger.error(f"Skin analysis API error: {str(e)}")
            return None


class LipsAnalysisView(APIView):
    """Lips analysis endpoint using YouCam API."""

    permission_classes = [AllowAny]

    async def post(self, request):
        """Process lips analysis with async YouCam API call."""
        try:
            image_data = request.data.get('image')
            if not image_data:
                return Response(
                    {
                        'success': False,
                        'message': 'Image data is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST)

            # Process image asynchronously
            analysis_result = await self.process_lips_analysis(image_data)

            if not analysis_result:
                return Response(
                    {
                        'success': False,
                        'message': 'Lips analysis failed'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'success': True,
                'analysis': analysis_result
            },
                            status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Lips analysis error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Lips analysis failed'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def process_lips_analysis(self, image_data):
        """Process lips analysis with YouCam API."""
        try:
            api_key = settings.YOUCAM_API_KEY
            secret_key = settings.YOUCAM_SECRET_KEY

            if not api_key or not secret_key:
                logger.error("YouCam API credentials not configured")
                return None

            # Prepare API request
            url = "https://api.youcam.com/v1/lips-analysis"
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }

            payload = {'image': image_data, 'analysis_type': 'comprehensive'}

            # Make async API call
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers,
                                        json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        logger.error(f"YouCam API error: {response.status}")
                        return None

        except Exception as e:
            logger.error(f"Lips analysis API error: {str(e)}")
            return None


@api_view(['POST'])
@permission_classes([AllowAny])
def location_weather_view(request):
    """Get weather information for location."""
    try:
        serializer = WeatherRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            },
                            status=status.HTTP_400_BAD_REQUEST)

        latitude = serializer.validated_data.get('latitude')
        longitude = serializer.validated_data.get('longitude')

        # Get weather data synchronously (can be made async if needed)
        weather_data = get_weather_data(latitude, longitude)

        return Response({
            'success': True,
            'message': weather_data
        },
                        status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        return Response(
            {
                'success': False,
                'message': 'Weather data unavailable'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_weather_data(latitude=None, longitude=None):
    """Get weather data from external API."""
    try:
        # Use OpenWeatherMap API or similar
        if latitude and longitude:
            # Use coordinates for accurate weather
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid=YOUR_API_KEY&units=metric"
        else:
            # Use IP-based location
            url = "https://api.openweathermap.org/data/2.5/weather?q=Dubai&appid=YOUR_API_KEY&units=metric"

        # For now, return mock data until API key is configured
        return "Dubai - 28°C, partly cloudy"

    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        return "Weather data unavailable"


class AdminStatsView(APIView):
    """Admin statistics endpoint."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get admin statistics."""
        try:
            if request.user.role != 'admin':
                return Response(
                    {
                        'success': False,
                        'message': 'Admin access required'
                    },
                    status=status.HTTP_403_FORBIDDEN)

            # Get statistics with lazy loading
            stats = self.get_admin_stats()

            serializer = AdminStatsSerializer(stats)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Admin stats error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Failed to get statistics'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_admin_stats(self):
        """Get admin statistics with optimized queries."""
        total_patients = User.objects.filter(role='patient').count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.count()
        pending_appointments = Appointment.objects.filter(
            status='pending').count()

        # Recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = User.objects.filter(
            created_at__gte=thirty_days_ago).count()

        return {
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'pending_appointments': pending_appointments,
            'recent_registrations': recent_registrations
        }


class AdminUsersView(ListAPIView):
    """Admin users list endpoint."""

    permission_classes = [IsAuthenticated]
    serializer_class = None  # Will be set in get_serializer_class

    def get_queryset(self):
        """Get users with lazy loading."""
        if self.request.user.role != 'admin':
            return User.objects.none()

        return User.objects.select_related().all()

    def list(self, request, *args, **kwargs):
        """Custom list response format."""
        try:
            if request.user.role != 'admin':
                return Response(
                    {
                        'success': False,
                        'message': 'Admin access required'
                    },
                    status=status.HTTP_403_FORBIDDEN)

            users = self.get_queryset()

            # Format user data for frontend
            user_data = []
            for user in users:
                user_data.append({
                    'id':
                    user.id,
                    'username':
                    user.username,
                    'email':
                    user.email,
                    'name':
                    user.name,
                    'role':
                    user.role,
                    'isActive':
                    user.is_active,
                    'createdAt':
                    user.created_at.isoformat() if user.created_at else None,
                    'lastLogin':
                    user.last_login.isoformat() if user.last_login else None
                })

            return Response(user_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Admin users error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Failed to get users'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateAnalysisTrackingView(APIView):
    """API endpoint to track analysis widget usage."""
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Analysis Tracking'],
        operation_id='track_analysis',
        description='Track usage of analysis widgets (face, hair, lips, skin)',
        request=CreateAnalysisTrackingSerializer,
        responses={
            201: {'description': 'Analysis tracked successfully'},
            400: {'description': 'Invalid request data'},
            500: {'description': 'Server error'}
        }
    )
    def post(self, request):
        """Create analysis tracking record."""
        try:
            serializer = CreateAnalysisTrackingSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'success': False, 'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            # Get or create patient user
            patient = None
            if validated_data.get('patientId'):
                try:
                    patient = User.objects.get(id=validated_data['patientId'])
                except User.DoesNotExist:
                    pass
            
            # Get tenant ID if provided
            tenant_id = validated_data.get('tenantId')
            
            # Create tracking record
            tracking = AnalysisTracking.objects.create(
                patient=patient,  # Can be None if no patient ID provided
                tenant_id=tenant_id,
                session_id=validated_data['sessionId'],
                analysis_type=validated_data['analysisType'],
                widget_location=validated_data.get('widgetLocation', 'chat_widget'),
                metadata=validated_data.get('metadata')
            )
            
            return Response({
                'success': True,
                'id': tracking.id,
                'message': 'Analysis tracking recorded successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Analysis tracking error: {str(e)}")
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalysisTrackingStatsView(APIView):
    """API endpoint to get analysis tracking statistics."""
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Analysis Tracking'],
        operation_id='get_analysis_stats',
        description='Get statistics of analysis widget usage',
        parameters=[
            OpenApiParameter(
                name='tenantId',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter by tenant ID'
            )
        ],
        responses={
            200: AnalysisTrackingStatsSerializer,
            500: {'description': 'Server error'}
        }
    )
    def get(self, request):
        """Get analysis tracking statistics."""
        try:
            # Get tenant ID from query params
            tenant_id = request.query_params.get('tenantId')
            
            # Base query
            queryset = AnalysisTracking.objects.all()
            
            # Filter by tenant if provided
            if tenant_id:
                queryset = queryset.filter(tenant_id=tenant_id)
            
            # Get counts by analysis type
            stats = queryset.values('analysis_type').annotate(
                count=Count('id')
            )
            
            # Format statistics
            result = {
                'face': 0,
                'hair': 0,
                'lips': 0,
                'skin': 0,
                'hair_extension': 0,
                'total': 0
            }
            
            for stat in stats:
                analysis_type = stat['analysis_type']
                count = stat['count']
                if analysis_type in result:
                    result[analysis_type] = count
                result['total'] += count
            
            serializer = AnalysisTrackingStatsSerializer(result)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Analysis tracking stats error: {str(e)}")
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
