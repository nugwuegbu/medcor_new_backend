"""
API views for ChatWidget models.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import Http404
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
)
from drf_spectacular.types import OpenApiTypes

from .models import ChatWidgetCustomization, AvartaCollect
from .serializers import (
    ChatWidgetCustomizationSerializer,
    ChatWidgetCreateSerializer,
    ChatWidgetUpdateSerializer,
    AvartaCollectSerializer,
)
from tenants.models import Hospital


@extend_schema_view(
    list=extend_schema(
        summary="List ChatWidget Customizations",
        description="Retrieve a list of all chatwidget customizations.",
        tags=["ChatWidget"],
        responses={
            200: ChatWidgetCustomizationSerializer(many=True),
        },
    ),
    create=extend_schema(
        summary="Create ChatWidget Customization",
        description="Create a new chatwidget customization.",
        tags=["ChatWidget"],
        request=ChatWidgetCustomizationSerializer,
        responses={
            201: ChatWidgetCustomizationSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
    ),
    retrieve=extend_schema(
        summary="Get ChatWidget Customization Details",
        description="Retrieve detailed information about a specific chatwidget customization. The response includes active avatar collections (is_active=True) for the same hospital.",
        tags=["ChatWidget"],
        responses={
            200: ChatWidgetCustomizationSerializer,
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
    ),
    update=extend_schema(
        summary="Update ChatWidget Customization",
        description="Update all fields of an existing chatwidget customization.",
        tags=["ChatWidget"],
        request=ChatWidgetCustomizationSerializer,
        responses={
            200: ChatWidgetCustomizationSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
    ),
    partial_update=extend_schema(
        summary="Partial Update ChatWidget Customization",
        description="Update specific fields of an existing chatwidget customization.",
        tags=["ChatWidget"],
        request=ChatWidgetCustomizationSerializer,
        responses={
            200: ChatWidgetCustomizationSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
    ),
    destroy=extend_schema(
        summary="Delete ChatWidget Customization",
        description="Delete a chatwidget customization permanently.",
        tags=["ChatWidget"],
        responses={
            204: OpenApiResponse(description="ChatWidget customization deleted successfully"),
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
    ),
)
class ChatWidgetCustomizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChatWidgetCustomization CRUD operations.
    All endpoints are publicly accessible without authentication.
    """
    
    queryset = ChatWidgetCustomization.objects.select_related(
        'hospital', 'theme', 'features', 'avatar', 'voice'
    ).prefetch_related('voice__voice_settings')
    serializer_class = ChatWidgetCustomizationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filter queryset based on user's hospital."""
        return ChatWidgetCustomization.objects.select_related(
            'hospital', 'theme', 'features', 'avatar', 'voice'
        ).prefetch_related('voice__voice_settings')
    
    @extend_schema(
        summary="Create ChatWidget Customization for Hospital",
        description="Create a new chatwidget customization for a specific hospital. Supports both nested format ({\"chatwidget\": {...}}) and direct format ({...}).",
        tags=["ChatWidget"],
        request=ChatWidgetCreateSerializer,
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Hospital ID',
                required=True,
            ),
        ],
        responses={
            201: OpenApiResponse(
                response=ChatWidgetCustomizationSerializer,
                description="ChatWidget customization created successfully",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            "message": "ChatWidget customization created successfully",
                            "data": {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "hospital": "33b29972-23ae-47c0-90fe-69566cdd6f43",
                                "theme": {
                                    "company_logo": "https://api.medcor.ai/static/videos_images/logo.jpg",
                                    "primary_color": "#7c3aed",
                                    "secondary_color": "#a855f7",
                                },
                                "features": {
                                    "face_analysis": True,
                                    "hair_analysis": True,
                                },
                                "avatar": {
                                    "avarta_interaction_type": "video_voice",
                                },
                                "voice": {
                                    "voice_id": "voice_001",
                                    "voice_settings": {
                                        "stability": 0.8,
                                        "similarity_boost": 0.7,
                                        "style": 0.0,
                                        "speed": 1.0,
                                        "speaker_boost": False,
                                    },
                                },
                            },
                        },
                    ),
                ],
            ),
            400: OpenApiResponse(description="Validation error or customization already exists"),
        },
        examples=[
            OpenApiExample(
                "Request Body (Direct Format)",
                value={
                    "theme": {
                        "company_logo": "https://api.medcor.ai/static/videos_images/1_medcor_Color_logo_with_background.jpg",
                        "primary_color": "#7c3aed",
                        "secondary_color": "#a855f7",
                        "accent_color": "#3b82f6",
                        "background_color": "#ffffff",
                        "text_color": "#1f2937",
                        "user_message_background": "#dbeafe",
                        "assistant_message_background": "#ffffff",
                        "message_overlay_color": "#7c3aed",
                        "input_background": "#f3f4f6",
                        "glow_border_color": "#7c3aed",
                    },
                    "features": {
                        "face_analysis": True,
                        "hair_analysis": True,
                        "skin_analysis": True,
                        "lips_analysis": True,
                        "hair_extension_analysis": True,
                        "dental_analysis": True,
                        "doctors_profiles": True,
                    },
                    "avatar": {
                        "avarta_interaction_type": "video_voice",
                    },
                    "voice": {
                        "voice_id": "voice_001",
                        "voice_settings": {
                            "stability": 0.8,
                            "similarity_boost": 0.7,
                            "style": 0.0,
                            "speed": 1.0,
                            "speaker_boost": False,
                        },
                    },
                },
                description="Direct format (recommended) - send fields directly without 'chatwidget' wrapper",
            ),
        ],
    )
    @action(detail=False, methods=['post'], url_path='create-for-hospital/(?P<hospital_id>[^/.]+)')
    def create_for_hospital(self, request, hospital_id=None):
        """
        Create chatwidget customization for a specific hospital.
        """
        try:
            # Get the chatwidget data from request
            # Support both nested format {"chatwidget": {...}} and direct format {...}
            if 'chatwidget' in request.data:
                chatwidget_data = request.data.get('chatwidget', {})
            else:
                # If not nested, use the entire request.data
                chatwidget_data = dict(request.data)
            
            if not chatwidget_data:
                return Response(
                    {"error": "chatwidget data is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create serializer with hospital context
            serializer = ChatWidgetCreateSerializer(
                data=chatwidget_data,
                context={'hospital_id': hospital_id}
            )
            
            if serializer.is_valid():
                customization = serializer.save()
                
                # Return the created customization with nested data
                response_serializer = ChatWidgetCustomizationSerializer(customization)
                return Response(
                    {
                        "message": "ChatWidget customization created successfully",
                        "data": response_serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Get ChatWidget Customization by Hospital",
        description="Retrieve chatwidget customization for a specific hospital. The response always includes active avatar collections (is_active=True) for the same hospital, even if no customization exists.",
        tags=["ChatWidget"],
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Hospital ID',
                required=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=ChatWidgetCustomizationSerializer,
                description="ChatWidget customization retrieved successfully (if exists). Response always includes 'avatar_collections' array with active avatar collections for the hospital.",
            ),
        },
    )
    @action(detail=False, methods=['get'], url_path='hospital/(?P<hospital_id>[^/.]+)')
    def get_by_hospital(self, request, hospital_id=None):
        """
        Get chatwidget customization for a specific hospital.
        Includes active avatar collections for the same hospital.
        """
        try:
            hospital = get_object_or_404(Hospital, id=hospital_id)
            
            # Get active avatar collections for the same hospital (always fetch these)
            active_avatar_collections = list(AvartaCollect.objects.filter(
                hospital=hospital,
                is_active=True
            ).order_by('-created_at'))
            
            avatar_collections_serializer = AvartaCollectSerializer(
                active_avatar_collections,
                many=True,
                context={'request': request}
            )
            
            try:
                customization = hospital.chatwidget_customization
                serializer = ChatWidgetCustomizationSerializer(customization)
                
                response_data = serializer.data
                response_data['avatar_collections'] = avatar_collections_serializer.data
                
                return Response(
                    {
                        "message": "ChatWidget customization retrieved successfully",
                        "data": response_data
                    },
                    status=status.HTTP_200_OK
                )
            except ChatWidgetCustomization.DoesNotExist:
                # Return avatar collections even if no customization exists
                return Response(
                    {
                        "message": "No chatwidget customization found for this hospital",
                        "data": {
                            "avatar_collections": avatar_collections_serializer.data
                        }
                    },
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Update ChatWidget Customization for Hospital",
        description="Update chatwidget customization for a specific hospital. Supports both nested format ({\"chatwidget\": {...}}) and direct format ({...}). Partial updates are supported with PATCH. **Note: The 'hospital' field is automatically set from the URL path and should NOT be included in the request body.**",
        tags=["ChatWidget"],
        request=ChatWidgetUpdateSerializer,
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Hospital ID',
                required=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=ChatWidgetCustomizationSerializer,
                description="ChatWidget customization updated successfully",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            "message": "ChatWidget customization updated successfully",
                            "data": {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "hospital": "33b29972-23ae-47c0-90fe-69566cdd6f43",
                                "theme": {
                                    "company_logo": "https://api.medcor.ai/static/videos_images/logo.jpg",
                                    "primary_color": "#7c3aed",
                                },
                                "features": {
                                    "face_analysis": True,
                                },
                                "avatar": {
                                    "avarta_interaction_type": "video_voice",
                                },
                                "voice": {
                                    "voice_id": "voice_001",
                                    "voice_settings": {
                                        "stability": 0.8,
                                        "similarity_boost": 0.7,
                                        "style": 0.0,
                                        "speed": 1.0,
                                        "speaker_boost": False,
                                    },
                                },
                            },
                        },
                    ),
                ],
            ),
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
        examples=[
            OpenApiExample(
                "Request Body (Direct Format)",
                value={
                    "theme": {
                        "company_logo": "https://api.medcor.ai/static/videos_images/1_medcor_Color_logo_with_background.jpg",
                        "primary_color": "#7c3aed",
                        "secondary_color": "#a855f7",
                        "accent_color": "#3b82f6",
                        "background_color": "#ffffff",
                        "text_color": "#1f2937",
                        "user_message_background": "#dbeafe",
                        "assistant_message_background": "#ffffff",
                        "message_overlay_color": "#7c3aed",
                        "input_background": "#f3f4f6",
                        "glow_border_color": "#7c3aed",
                    },
                    "features": {
                        "face_analysis": True,
                        "hair_analysis": True,
                        "skin_analysis": True,
                        "lips_analysis": True,
                        "hair_extension_analysis": True,
                        "dental_analysis": True,
                        "doctors_profiles": True,
                    },
                    "avatar": {
                        "avarta_interaction_type": "video_voice",
                    },
                    "voice": {
                        "voice_id": "voice_001",
                        "voice_settings": {
                            "stability": 0.8,
                            "similarity_boost": 0.7,
                            "style": 0.0,
                            "speed": 1.0,
                            "speaker_boost": False,
                        },
                    },
                },
                description="Direct format (recommended) - send fields directly without 'chatwidget' wrapper",
            ),
        ],
    )
    @action(detail=False, methods=['put', 'patch'], url_path='update-for-hospital/(?P<hospital_id>[^/.]+)')
    def update_for_hospital(self, request, hospital_id=None):
        """
        Update chatwidget customization for a specific hospital.
        """
        try:
            # Get the chatwidget data from request
            # Support both nested format {"chatwidget": {...}} and direct format {...}
            if 'chatwidget' in request.data:
                chatwidget_data = request.data.get('chatwidget', {})
            else:
                # If not nested, use the entire request.data but exclude hospital_id
                chatwidget_data = dict(request.data)
                # Remove hospital from data if present (it's in the URL)
                chatwidget_data.pop('hospital', None)
            
            if not chatwidget_data:
                return Response(
                    {"error": "chatwidget data is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            hospital = get_object_or_404(Hospital, id=hospital_id)
            
            try:
                customization = hospital.chatwidget_customization
                
                # Update the customization (hospital is not needed in data, it's in the URL)
                serializer = ChatWidgetUpdateSerializer(
                    customization,
                    data=chatwidget_data,
                    partial=request.method == 'PATCH'
                )
                
                if serializer.is_valid():
                    updated_customization = serializer.save()
                    
                    # Return the updated customization
                    response_serializer = ChatWidgetCustomizationSerializer(updated_customization)
                    return Response(
                        {
                            "message": "ChatWidget customization updated successfully",
                            "data": response_serializer.data
                        },
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"errors": serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except ChatWidgetCustomization.DoesNotExist:
                return Response(
                    {"error": "No chatwidget customization found for this hospital. Please create one first."},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Delete ChatWidget Customization for Hospital",
        description="Delete chatwidget customization for a specific hospital.",
        tags=["ChatWidget"],
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Hospital ID',
                required=True,
            ),
        ],
        responses={
            200: OpenApiResponse(description="ChatWidget customization deleted successfully"),
            404: OpenApiResponse(description="ChatWidget customization not found"),
        },
    )
    @action(detail=False, methods=['delete'], url_path='delete-for-hospital/(?P<hospital_id>[^/.]+)')
    def delete_for_hospital(self, request, hospital_id=None):
        """
        Delete chatwidget customization for a specific hospital.
        """
        try:
            hospital = get_object_or_404(Hospital, id=hospital_id)
            
            try:
                customization = hospital.chatwidget_customization
                customization.delete()
                
                return Response(
                    {"message": "ChatWidget customization deleted successfully"},
                    status=status.HTTP_200_OK
                )
                
            except ChatWidgetCustomization.DoesNotExist:
                return Response(
                    {"error": "No chatwidget customization found for this hospital"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def list(self, request):
        """
        List all chatwidget customizations.
        """
        try:
            customizations = self.get_queryset()
            serializer = ChatWidgetCustomizationSerializer(customizations, many=True)
            
            return Response(
                {
                    "message": "ChatWidget customizations retrieved successfully",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve a specific chatwidget customization by ID.
        Includes active avatar collections for the same hospital.
        """
        try:
            customization = get_object_or_404(ChatWidgetCustomization, pk=pk)
            serializer = ChatWidgetCustomizationSerializer(customization)
            
            # Get active avatar collections for the same hospital
            # Use the hospital object to ensure proper matching
            if customization.hospital:
                active_avatar_collections = list(AvartaCollect.objects.filter(
                    hospital=customization.hospital,
                    is_active=True
                ).order_by('-created_at'))
            else:
                active_avatar_collections = []
            
            avatar_collections_serializer = AvartaCollectSerializer(
                active_avatar_collections,
                many=True,
                context={'request': request}
            )
            
            response_data = serializer.data
            response_data['avatar_collections'] = avatar_collections_serializer.data
            
            return Response(
                {
                    "message": "ChatWidget customization retrieved successfully",
                    "data": response_data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, pk=None, **kwargs):
        """
        Update a specific chatwidget customization by ID.
        """
        try:
            partial = kwargs.pop('partial', False)
            customization = get_object_or_404(ChatWidgetCustomization, pk=pk)
            serializer = ChatWidgetCustomizationSerializer(
                customization,
                data=request.data,
                partial=partial
            )
            
            if serializer.is_valid():
                updated_customization = serializer.save()
                
                return Response(
                    {
                        "message": "ChatWidget customization updated successfully",
                        "data": ChatWidgetCustomizationSerializer(updated_customization).data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, pk=None):
        """
        Delete a specific chatwidget customization by ID.
        """
        try:
            customization = get_object_or_404(ChatWidgetCustomization, pk=pk)
            customization.delete()
            
            return Response(
                {"message": "ChatWidget customization deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema_view(
    list=extend_schema(
        summary="List Avatar Collections",
        description="Retrieve a list of all avatar collections. Can be filtered by hospital and active status.",
        tags=["ChatWidget - Avatar Collections"],
        parameters=[
            OpenApiParameter(
                name='hospital',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter avatar collections by hospital ID',
                required=False,
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status',
                required=False,
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search by avatar name or hospital name',
                required=False,
            ),
        ],
        responses={
            200: AvartaCollectSerializer(many=True),
        },
    ),
    create=extend_schema(
        summary="Create Avatar Collection",
        description="Create a new avatar collection with video configurations and metadata.",
        tags=["ChatWidget - Avatar Collections"],
        request=AvartaCollectSerializer,
        responses={
            201: OpenApiResponse(
                response=AvartaCollectSerializer,
                description="Avatar collection created successfully",
                examples=[
                    OpenApiExample(
                        "Avatar Collection Response",
                        value={
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "name": "Professional Doctor Avatar",
                            "hospital": "fcdf00c9-3c8e-47de-9a93-62212f87d93e",
                            "talking_video_url": "https://cdn.medcor.ai/media/chatwidget/avatars/talking/avatar_1.mp4",
                            "waiting_video_url": "https://cdn.medcor.ai/media/chatwidget/avatars/waiting/avatar_1.mp4",
                            "opening_video_url": "https://cdn.medcor.ai/media/chatwidget/avatars/opening/avatar_1.mp4",
                            "duration": {
                                "talking": 15,
                                "waiting": 8,
                                "opening": 10
                            },
                            "file_size": {
                                "talking": 2500000,
                                "waiting": 1800000,
                                "opening": 2200000
                            },
                            "upload_date": "2024-10-13T12:00:00Z",
                            "usage_count": 0,
                            "is_active": True,
                        },
                    ),
                ],
            ),
            400: OpenApiResponse(description="Validation error"),
        },
        examples=[
            OpenApiExample(
                "Avatar Collection Request",
                value={
                    "name": "Professional Doctor Avatar",
                    "hospital": "fcdf00c9-3c8e-47de-9a93-62212f87d93e",
                    "talking_video_url": "file (binary)",
                    "waiting_video_url": "file (binary)",
                    "opening_video_url": "file (binary)",
                    "duration": {
                        "talking": 15,
                        "waiting": 8,
                        "opening": 10
                    },
                    "fileSize": {
                        "talking": 2500000,
                        "waiting": 1800000,
                        "opening": 2200000
                    },
                    "usage_count": 0,
                    "is_active": True,
                },
                description="Example request for creating an avatar collection",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Avatar Collection Details",
        description="Retrieve detailed information about a specific avatar collection.",
        tags=["ChatWidget - Avatar Collections"],
        responses={
            200: AvartaCollectSerializer,
            404: OpenApiResponse(description="Avatar collection not found"),
        },
    ),
    update=extend_schema(
        summary="Update Avatar Collection",
        description="Update all fields of an existing avatar collection.",
        tags=["ChatWidget - Avatar Collections"],
        request=AvartaCollectSerializer,
        responses={
            200: AvartaCollectSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Avatar collection not found"),
        },
    ),
    partial_update=extend_schema(
        summary="Partial Update Avatar Collection",
        description="Update specific fields of an existing avatar collection.",
        tags=["ChatWidget - Avatar Collections"],
        request=AvartaCollectSerializer,
        responses={
            200: AvartaCollectSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Avatar collection not found"),
        },
    ),
    destroy=extend_schema(
        summary="Delete Avatar Collection",
        description="Delete an avatar collection permanently.",
        tags=["ChatWidget - Avatar Collections"],
        responses={
            204: OpenApiResponse(description="Avatar collection deleted successfully"),
            404: OpenApiResponse(description="Avatar collection not found"),
        },
    ),
)
class AvartaCollectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Avatar Collections.
    
    Provides CRUD operations for avatar collections with filtering by hospital.
    All endpoints are publicly accessible without authentication.
    
    Ensures only one collection per hospital can be active at a time.
    """
    
    queryset = AvartaCollect.objects.select_related('hospital').all()
    serializer_class = AvartaCollectSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    filterset_fields = ['hospital', 'is_active']
    search_fields = ['name', 'hospital__name']
    ordering_fields = ['name', 'created_at', 'updated_at', 'usage_count']
    ordering = ['-created_at']
    
    def _deactivate_other_collections(self, hospital, exclude_id=None):
        """
        Deactivate all other collections for the given hospital.
        
        Args:
            hospital: Hospital instance
            exclude_id: UUID of collection to exclude from deactivation
        """
        queryset = AvartaCollect.objects.filter(
            hospital=hospital,
            is_active=True
        )
        
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        
        queryset.update(is_active=False)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new avatar collection.
        If is_active=True (explicitly set or default), deactivate all other collections for the same hospital.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get is_active value (defaults to True per model definition)
        is_active = serializer.validated_data.get('is_active', True)
        hospital = serializer.validated_data.get('hospital')
        
        # If creating with is_active=True, deactivate other collections
        if is_active and hospital:
            self._deactivate_other_collections(hospital)
        
        # Create the new collection
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(
            {
                "message": "Avatar collection created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update an avatar collection.
        If is_active=True is explicitly set, deactivate all other collections for the same hospital.
        Also handles hospital changes: if collection is active and hospital changes, deactivate others in new hospital.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Get hospital (may be updated or use existing)
        new_hospital = serializer.validated_data.get('hospital', instance.hospital)
        hospital_changed = 'hospital' in request.data and new_hospital != instance.hospital
        
        # Check if is_active=True is being explicitly set
        if 'is_active' in request.data:
            is_active = serializer.validated_data.get('is_active', False)
            # If updating to is_active=True, deactivate other collections
            if is_active is True and new_hospital:
                self._deactivate_other_collections(new_hospital, exclude_id=instance.id)
        elif hospital_changed and instance.is_active:
            # If hospital is changed and collection is currently active, deactivate others in new hospital
            if new_hospital:
                self._deactivate_other_collections(new_hospital, exclude_id=instance.id)
        
        # Update the collection
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_object_cache', None):
            instance._prefetched_object_cache = {}
        
        return Response(
            {
                "message": "Avatar collection updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        summary="List Avatar Collections by Hospital",
        description="Retrieve all avatar collections for a specific hospital.",
        tags=["ChatWidget - Avatar Collections"],
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Hospital ID',
                required=True,
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status',
                required=False,
            ),
        ],
        responses={
            200: AvartaCollectSerializer(many=True),
            404: OpenApiResponse(description="Hospital not found"),
        },
    )
    @action(detail=False, methods=['get'], url_path='hospital/(?P<hospital_id>[^/.]+)')
    def list_by_hospital(self, request, hospital_id=None):
        """
        List all avatar collections for a specific hospital.
        """
        try:
            hospital = get_object_or_404(Hospital, id=hospital_id)
            
            # Filter by active status if provided
            is_active = request.query_params.get('is_active')
            queryset = AvartaCollect.objects.filter(hospital=hospital)
            
            if is_active is not None:
                is_active_bool = is_active.lower() in ['true', '1', 'yes']
                queryset = queryset.filter(is_active=is_active_bool)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(
                {
                    "message": "Avatar collections retrieved successfully",
                    "count": queryset.count(),
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Increment Usage Count",
        description="Increment the usage count for an avatar collection.",
        tags=["ChatWidget - Avatar Collections"],
        responses={
            200: AvartaCollectSerializer,
            404: OpenApiResponse(description="Avatar collection not found"),
        },
    )
    @action(detail=True, methods=['post'])
    def increment_usage(self, request, pk=None):
        """
        Increment the usage count for an avatar collection.
        """
        try:
            avatar_collect = self.get_object()
            avatar_collect.usage_count += 1
            avatar_collect.save()
            
            serializer = self.get_serializer(avatar_collect)
            return Response(
                {
                    "message": "Usage count incremented successfully",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )