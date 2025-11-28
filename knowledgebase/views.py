from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Ai_Identity, Behavior, Response as ResponseModel, Source, SourceFile
from .serializers import (
    UnifiedKnowledgeBaseSerializer,
    SourceSerializer,
    SourceFileSerializer,
)
from tenants.models import Hospital

User = get_user_model()


class KnowledgeBasePagination(PageNumberPagination):
    """Custom pagination for knowledge base"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(tags=["Knowledge Base"])
class UnifiedKnowledgeBaseViewSet(ModelViewSet):
    """Unified ViewSet for all KnowledgeBase components with hospital_id in URL"""
    permission_classes = [IsAuthenticated]
    pagination_class = KnowledgeBasePagination
    serializer_class = UnifiedKnowledgeBaseSerializer

    def get_queryset(self):
        """Get all hospitals that have knowledge base components"""
        queryset = Hospital.objects.all()
        
        # Filter by hospital if user is not superuser
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'hospital'):
                queryset = queryset.filter(id=self.request.user.hospital.id)
            else:
                # If user has no hospital, return empty queryset
                queryset = queryset.none()
        
        return queryset

    def get_object(self):
        """Get KnowledgeBase components for a specific hospital"""
        hospital_id = self.kwargs.get('hospital_id')
        hospital = get_object_or_404(Hospital, id=hospital_id)
        
        # Check permissions
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'hospital') and self.request.user.hospital != hospital:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to access this hospital's knowledge base.")
            elif not hasattr(self.request.user, 'hospital'):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to access knowledge bases.")
        
        # Get or create all components for this hospital
        ai_identity, _ = Ai_Identity.objects.get_or_create(
            hospital=hospital,
            defaults={
                'agent_name': f"{hospital.name} AI Assistant",
                'agent_title': f"AI Medical Assistant for {hospital.name}",
                'system_prompt': f"You are a helpful AI medical assistant for {hospital.name}.",
            }
        )
        
        behavior, _ = Behavior.objects.get_or_create(
            hospital=hospital,
            defaults={
                'communication_tone': 'Professional',
                'communication_style': 'Conversational',
                'confidence_level': 'Balanced',
                'response_length': 'Medium',
                'enable_follow_up_questions': True,
                'enable_appointment_booking': True,
                'enable_personalization': True,
            }
        )
        
        response, _ = ResponseModel.objects.get_or_create(
            hospital=hospital,
            defaults={
                'greeting_message': "Hello! I'm your AI medical assistant. How can I help you today?",
                'appointment_booking': "I can help you book an appointment. Please let me know your preferred date and time.",
                'general_inquiries': "I'm here to help with your medical inquiries. What would you like to know?",
                'fallback_response': "I'm not sure how to help with that. Please contact our medical staff for assistance.",
                'emergency_response': "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
                'business_hours': "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
                'medical_specialties': "We offer various medical specialties. Please let me know what specific area you're interested in.",
            }
        )
        
        source = Source.objects.filter(hospital=hospital).first()
        
        return {
            'ai_identity': ai_identity,
            'behavior': behavior,
            'response': response,
            'source': source,
            'hospital': hospital
        }

    def list(self, request, *args, **kwargs):
        """List all hospitals with their knowledge base components"""
        queryset = self.get_queryset()
        
        # Build combined data for each hospital
        hospitals_data = []
        for hospital in queryset:
            try:
                # Get all components for this hospital
                ai_identity = getattr(hospital, 'ai_identity', None)
                behavior = getattr(hospital, 'behavior', None)
                response = getattr(hospital, 'response', None)
                source = getattr(hospital, 'source', None)
                
                combined_data = {
                    'ai_identity': ai_identity,
                    'behavior': behavior,
                    'response': response,
                    'source': source,
                    'hospital': hospital
                }
                
                serializer = self.get_serializer(combined_data)
                hospitals_data.append(serializer.data)
            except Exception as e:
                # Skip hospitals with errors
                continue
        
        # Paginate results
        paginator = KnowledgeBasePagination()
        page = paginator.paginate_queryset(hospitals_data, request)
        
        if page is not None:
            return paginator.get_paginated_response(page)
        
        return Response(hospitals_data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve knowledge base components for a specific hospital"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(
        request=UnifiedKnowledgeBaseSerializer,
        responses={201: UnifiedKnowledgeBaseSerializer},
        summary="Create Knowledge Base",
        description="Create knowledge base components for a hospital using JSON payload. The source section accepts file_paths array containing file paths for knowledge base source files."
    )
    def create(self, request, *args, **kwargs):
        """Create knowledge base components for a hospital"""
        hospital_id = self.kwargs.get('hospital_id')
        hospital = get_object_or_404(Hospital, id=hospital_id)
        
        # Check if components already exist
        if (Ai_Identity.objects.filter(hospital=hospital).exists() or
            Behavior.objects.filter(hospital=hospital).exists() or
            ResponseModel.objects.filter(hospital=hospital).exists()):
            return Response({
                'error': 'Knowledge base components already exist for this hospital. Use PUT/PATCH to update.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check permissions
        if not request.user.is_superuser:
            if hasattr(request.user, 'hospital') and request.user.hospital != hospital:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to create knowledge base for this hospital.")
            elif not hasattr(request.user, 'hospital'):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to create knowledge bases.")
        
        # Handle JSON requests only
        data = request.data.copy()
        data['hospital_id'] = hospital_id
        
        serializer = self.get_serializer(data=data, context={'hospital_id': hospital_id})
        if serializer.is_valid():
            result = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        request=UnifiedKnowledgeBaseSerializer,
        responses={200: UnifiedKnowledgeBaseSerializer},
        summary="Update Knowledge Base",
        description="Update knowledge base components for a hospital using JSON payload. The source section accepts file_paths array containing file paths for knowledge base source files."
    )
    def update(self, request, *args, **kwargs):
        """Update knowledge base components for a hospital"""
        instance = self.get_object()
        data = request.data.copy()
        hospital_id = self.kwargs.get('hospital_id')
        
        serializer = self.get_serializer(instance, data=data, partial=kwargs.get('partial', False), context={'hospital_id': hospital_id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Delete all knowledge base components for a hospital"""
        instance = self.get_object()
        
        # Delete all components
        if instance['ai_identity']:
            instance['ai_identity'].delete()
        if instance['behavior']:
            instance['behavior'].delete()
        if instance['response']:
            instance['response'].delete()
        if instance['source']:
            instance['source'].delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def activate(self, request, hospital_id=None):
        """Activate all knowledge base components"""
        instance = self.get_object()
        
        if instance['ai_identity']:
            instance['ai_identity'].is_active = True
            instance['ai_identity'].save()
        
        if instance['behavior']:
            instance['behavior'].is_active = True
            instance['behavior'].save()
        
        if instance['response']:
            instance['response'].is_active = True
            instance['response'].save()
        
        if instance['source']:
            instance['source'].is_active = True
            instance['source'].save()
        
        return Response({
            'message': 'All knowledge base components activated successfully'
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, hospital_id=None):
        """Deactivate all knowledge base components"""
        instance = self.get_object()
        
        if instance['ai_identity']:
            instance['ai_identity'].is_active = False
            instance['ai_identity'].save()
        
        if instance['behavior']:
            instance['behavior'].is_active = False
            instance['behavior'].save()
        
        if instance['response']:
            instance['response'].is_active = False
            instance['response'].save()
        
        if instance['source']:
            instance['source'].is_active = False
            instance['source'].save()
        
        return Response({
            'message': 'All knowledge base components deactivated successfully'
        })

    @action(detail=True, methods=['get'])
    def list_files(self, request, hospital_id=None):
        """List all source files for a hospital"""
        instance = self.get_object()
        source = instance.get('source')
        
        if not source:
            return Response({
                'error': 'No source files available'
            }, status=404)
        
        source_files = source.source_files.filter(is_active=True)
        serializer = SourceFileSerializer(source_files, many=True, context={'request': request})
        
        return Response({
            'files': serializer.data,
            'total_files': source_files.count()
        })
    
    @action(detail=True, methods=['get'])
    def download_file(self, request, hospital_id=None):
        """Download a specific source file by file ID"""
        instance = self.get_object()
        source = instance.get('source')
        file_id = request.query_params.get('file_id')
        
        if not source:
            return Response({
                'error': 'No source files available'
            }, status=404)
        
        if not file_id:
            return Response({
                'error': 'file_id parameter is required'
            }, status=400)
        
        try:
            source_file = source.source_files.get(id=file_id, is_active=True)
        except SourceFile.DoesNotExist:
            return Response({
                'error': 'File not found'
            }, status=404)
        
        from django.http import FileResponse
        from django.conf import settings
        import os
        
        file_path = os.path.join(settings.MEDIA_ROOT, source_file.file.name)
        
        if not os.path.exists(file_path):
            return Response({
                'error': 'File not found on server'
            }, status=404)
        
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{source_file.file_name or os.path.basename(source_file.file.name)}"'
        
        return response
    
    @extend_schema(
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'files': {
                        'type': 'array',
                        'items': {
                            'type': 'string',
                            'format': 'binary'
                        },
                        'description': 'Upload multiple files (PDF, DOC, TXT, etc.) - supports up to 10 files'
                    }
                }
            }
        },
        responses={201: {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'files_count': {'type': 'integer'},
                'files': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string', 'format': 'uuid'},
                            'file_name': {'type': 'string'},
                            'file_size': {'type': 'integer'},
                            'file_type': {'type': 'string'},
                            'uploaded_at': {'type': 'string', 'format': 'date-time'}
                        }
                    }
                }
            }
        }},
        summary="Upload Source Files",
        description="Upload source files for the hospital's knowledge base. Files are stored in the media directory and linked to the source record."
    )
    @action(detail=True, methods=['post'])
    def upload_files(self, request, pk=None, hospital_id=None):
        """Upload source files for a hospital's knowledge base"""
        instance = self.get_object()
        source = instance.get('source')
        
        if not source:
            return Response({
                'error': 'Source not found. Please create knowledge base first.'
            }, status=404)
        
        files = request.FILES.getlist('files')
        if not files:
            return Response({
                'error': 'No files provided'
            }, status=400)
        
        # Limit to 10 files maximum
        if len(files) > 10:
            return Response({
                'error': 'Maximum 10 files allowed per upload'
            }, status=400)
        
        # Check file sizes (limit to 10MB per file)
        max_size = 10 * 1024 * 1024  # 10MB
        for file in files:
            if file.size > max_size:
                return Response({
                    'error': f'File {file.name} is too large. Maximum size is 10MB.'
                }, status=400)
        
        # Upload new files
        uploaded_files = []
        
        for file in files:
            source_file = SourceFile.objects.create(
                source=source,
                file=file,
                is_active=True
            )
            uploaded_files.append({
                'id': str(source_file.id),
                'file_name': source_file.file_name,
                'file_size': source_file.file_size,
                'file_type': source_file.file_type,
                'uploaded_at': source_file.created_at
            })
        
        return Response({
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files_count': source.get_files_count(),
            'files': uploaded_files
        }, status=201)


@extend_schema(tags=["Knowledge Base - Sources"])
class SourceViewSet(ModelViewSet):
    """Manage knowledge base sources."""

    serializer_class = SourceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Source.objects.select_related("hospital").prefetch_related("source_files")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["hospital__name"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        hospital_id = self.request.query_params.get("hospital_id")
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)

        user = self.request.user
        if not user.is_superuser:
            user_hospital = getattr(user, "hospital", None)
            if user_hospital:
                queryset = queryset.filter(hospital=user_hospital)
            else:
                queryset = queryset.none()
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        hospital_id = (
            self.request.data.get("hospital_id")
            or self.request.query_params.get("hospital_id")
        )
        if hospital_id:
            context["hospital_id"] = hospital_id
        return context

    def _check_hospital_permission(self, hospital: Hospital) -> None:
        if self.request.user.is_superuser:
            return
        user_hospital = getattr(self.request.user, "hospital", None)
        if not user_hospital or user_hospital != hospital:
            raise PermissionDenied("You don't have access to this hospital's sources.")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="hospital_id",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.UUID,
                description="Filter sources by hospital ID.",
            ),
            OpenApiParameter(
                name="is_active",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.BOOL,
                description="Filter by active/inactive sources.",
            ),
            OpenApiParameter(
                name="search",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.STR,
                description="Search by hospital name.",
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        hospital_id = serializer.validated_data.get("hospital_id") or self.request.data.get("hospital_id")
        if not hospital_id:
            raise ValidationError({"hospital_id": "This field is required."})

        hospital = get_object_or_404(Hospital, id=hospital_id)
        self._check_hospital_permission(hospital)
        serializer.save(hospital=hospital)

    def perform_update(self, serializer):
        instance = self.get_object()
        self._check_hospital_permission(instance.hospital)
        serializer.save(hospital=instance.hospital)

    def perform_destroy(self, instance):
        self._check_hospital_permission(instance.hospital)
        instance.delete()


@extend_schema(tags=["Knowledge Base - Source Files"])
class SourceFileViewSet(ModelViewSet):
    """Manage knowledge base source files."""

    serializer_class = SourceFileSerializer
    permission_classes = [IsAuthenticated]
    queryset = SourceFile.objects.select_related("source", "source__hospital")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "is_active",
        "file_type",
        "source__id",
        "source__hospital__id",
    ]
    search_fields = ["file_name"]
    ordering_fields = ["created_at", "file_name", "file_type", "file_size"]
    ordering = ["-created_at"]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        source_id = self.request.query_params.get("source_id")
        hospital_id = self.request.query_params.get("hospital_id")

        if source_id:
            queryset = queryset.filter(source_id=source_id)
        if hospital_id:
            queryset = queryset.filter(source__hospital_id=hospital_id)

        user = self.request.user
        if not user.is_superuser:
            user_hospital = getattr(user, "hospital", None)
            if user_hospital:
                queryset = queryset.filter(source__hospital=user_hospital)
            else:
                queryset = queryset.none()
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        source_id = (
            self.request.data.get("source_id")
            or self.request.query_params.get("source_id")
        )
        if source_id:
            context["source_id"] = source_id
        return context

    def _check_source_permission(self, source: Source) -> None:
        if self.request.user.is_superuser:
            return
        user_hospital = getattr(self.request.user, "hospital", None)
        if not user_hospital or user_hospital != source.hospital:
            raise PermissionDenied("You don't have access to this source.")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="source_id",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.UUID,
                description="Filter files by source ID.",
            ),
            OpenApiParameter(
                name="hospital_id",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.UUID,
                description="Filter files by hospital ID.",
            ),
            OpenApiParameter(
                name="file_type",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.STR,
                description="Filter files by type/extension.",
            ),
            OpenApiParameter(
                name="is_active",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.BOOL,
                description="Filter by active/inactive files.",
            ),
            OpenApiParameter(
                name="search",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.STR,
                description="Search files by file name.",
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "source_id": {
                        "type": "string",
                        "format": "uuid",
                        "description": "ID of the source to attach the file to.",
                    },
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "File to upload (max 10MB).",
                    },
                    "is_active": {
                        "type": "boolean",
                        "description": "Mark the uploaded file as active or inactive.",
                    },
                },
                "required": ["source_id", "file"],
            }
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        source_id = (
            serializer.validated_data.get("source_id")
            or self.request.data.get("source_id")
        )
        if not source_id:
            raise ValidationError({"source_id": "This field is required."})
        source = get_object_or_404(Source, id=source_id)
        self._check_source_permission(source)
        serializer.save(source=source)

    def perform_update(self, serializer):
        instance = self.get_object()
        self._check_source_permission(instance.source)
        serializer.save(source=instance.source)

    def perform_destroy(self, instance):
        self._check_source_permission(instance.source)
        instance.delete()
    