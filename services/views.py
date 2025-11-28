"""
API Views for Services app
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import Service
from .serializers import ServiceSerializer
from tenants.models import Hospital

logger = logging.getLogger(__name__)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hospital services
    
    Provides CRUD operations for services with filtering by hospital
    """
    
    queryset = Service.objects.select_related('hospital').all()
    serializer_class = ServiceSerializer
    filterset_fields = ['hospital']
    search_fields = ['service_name', 'hospital__name']
    ordering_fields = ['service_name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    @extend_schema(
        summary="List all services",
        description="Retrieve a list of all hospital services. Can be filtered by hospital.",
        responses={
            200: ServiceSerializer(many=True),
        },
        parameters=[
            OpenApiParameter(
                name='hospital',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter services by hospital ID',
                required=False,
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search services by name or hospital name',
                required=False,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Create a new service",
        description="Create a new hospital service",
        request=ServiceSerializer,
        responses={
            201: ServiceSerializer,
            400: OpenApiResponse(description="Bad Request - Validation errors"),
        }
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'success': True,
                'message': 'Service created successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @extend_schema(
        summary="Retrieve a specific service",
        description="Get detailed information about a specific service",
        responses={
            200: ServiceSerializer,
            404: OpenApiResponse(description="Service not found"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update a service",
        description="Update an existing service",
        request=ServiceSerializer,
        responses={
            200: ServiceSerializer,
            400: OpenApiResponse(description="Bad Request - Validation errors"),
            404: OpenApiResponse(description="Service not found"),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Partial update of a service",
        description="Partially update an existing service",
        request=ServiceSerializer,
        responses={
            200: ServiceSerializer,
            400: OpenApiResponse(description="Bad Request - Validation errors"),
            404: OpenApiResponse(description="Service not found"),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Delete a service",
        description="Delete a service from the system",
        responses={
            204: OpenApiResponse(description="Service deleted successfully"),
            404: OpenApiResponse(description="Service not found"),
        }
    )
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                'success': True,
                'message': 'Service deleted successfully'
            },
            status=status.HTTP_204_NO_CONTENT
        )
    
    @extend_schema(
        summary="Get services by hospital",
        description="Retrieve all services for a specific hospital",
        methods=['GET'],
        responses={
            200: ServiceSerializer(many=True),
            404: OpenApiResponse(description="Hospital not found"),
        },
        parameters=[
            OpenApiParameter(
                name='hospital_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='UUID of the hospital',
                required=True,
            ),
        ]
    )
    @action(detail=False, methods=['get'], url_path='by-hospital/(?P<hospital_id>[^/.]+)')
    def by_hospital(self, request, hospital_id=None):
        """
        Get all services for a specific hospital
        """
        try:
            hospital = Hospital.objects.get(id=hospital_id)
            services = self.queryset.filter(hospital=hospital)
            serializer = self.get_serializer(services, many=True)
            return Response(
                {
                    'success': True,
                    'hospital_id': str(hospital.id),
                    'hospital_name': hospital.name,
                    'count': services.count(),
                    'services': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Hospital.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'error': 'Hospital not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )