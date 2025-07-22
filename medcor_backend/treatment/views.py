from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, QuerySet
from rest_framework.serializers import BaseSerializer
from typing import Type, Union, Any, Optional
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Treatment
from .serializers import (
    TreatmentSerializer,
    TreatmentCreateSerializer,
    TreatmentUpdateSerializer,
    TreatmentListSerializer
)


@extend_schema_view(
    get=extend_schema(
        summary="List treatments",
        description="Retrieve a list of all medical treatments with filtering and search capabilities.",
        tags=['Treatments']
    ),
    post=extend_schema(
        summary="Create treatment",
        description="Create a new medical treatment with details, cost, and rich text description.",
        tags=['Treatments']
    ),
)
class TreatmentListCreateView(generics.ListCreateAPIView):
    """
    API view for listing and creating treatments.
    GET: List all treatments with filtering and search
    POST: Create a new treatment
    """
    queryset = Treatment.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'cost', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):  # type: ignore
        if self.request.method == 'POST':
            return TreatmentCreateSerializer
        return TreatmentListSerializer
    
    def get_queryset(self):
        """Filter treatments based on user permissions."""
        queryset = Treatment.objects.select_related('tenant')
        
        # Add any additional filtering logic here
        # For example, filter by tenant if user belongs to specific tenant
        
        return queryset


@extend_schema_view(
    get=extend_schema(
        summary="Get treatment details",
        description="Retrieve detailed information about a specific treatment.",
        tags=['Treatments']
    ),
    put=extend_schema(
        summary="Update treatment",
        description="Update all fields of an existing treatment.",
        tags=['Treatments']
    ),
    patch=extend_schema(
        summary="Partially update treatment",
        description="Update specific fields of an existing treatment.",
        tags=['Treatments']
    ),
    delete=extend_schema(
        summary="Delete treatment",
        description="Delete a treatment from the system.",
        tags=['Treatments']
    ),
)
class TreatmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for retrieving, updating, and deleting a specific treatment.
    GET: Retrieve treatment details
    PUT/PATCH: Update treatment
    DELETE: Delete treatment
    """
    queryset = Treatment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):  # type: ignore
        if self.request.method in ['PUT', 'PATCH']:
            return TreatmentUpdateSerializer
        return TreatmentSerializer
    
    def get_queryset(self):
        """Filter treatments based on user permissions."""
        return Treatment.objects.select_related('tenant')


@extend_schema(
    summary="List treatments by tenant",
    description="Retrieve all treatments for a specific tenant/clinic.",
    parameters=[
        OpenApiParameter(
            name='tenant_id',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description='ID of the tenant/clinic',
            required=True,
        ),
    ],
    tags=['Treatments']
)
class TreatmentByTenantView(generics.ListAPIView):
    """
    API view for listing treatments by tenant.
    GET: List all treatments for a specific tenant
    """
    serializer_class = TreatmentListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'cost', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Get treatments for specific tenant."""
        tenant_id = self.kwargs.get('tenant_id')
        return Treatment.objects.filter(
            tenant_id=tenant_id,
            is_active=True
        ).select_related('tenant')


class TreatmentSearchView(generics.ListAPIView):
    """
    API view for advanced treatment search.
    GET: Search treatments with complex filters
    """
    serializer_class = TreatmentListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Advanced search with multiple criteria."""
        queryset = Treatment.objects.select_related('tenant')
        
        # Get query parameters
        query = self.request.query_params.get('q', '')
        min_cost = self.request.query_params.get('min_cost')
        max_cost = self.request.query_params.get('max_cost')
        tenant_id = self.request.query_params.get('tenant_id')
        is_active = self.request.query_params.get('is_active')
        
        # Apply search filters
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query)
            )
        
        if min_cost:
            try:
                min_cost_val = float(min_cost) if isinstance(min_cost, str) else min_cost
                queryset = queryset.filter(cost__gte=min_cost_val)
            except (ValueError, TypeError):
                pass
                
        if max_cost:
            try:
                max_cost_val = float(max_cost) if isinstance(max_cost, str) else max_cost
                queryset = queryset.filter(cost__lte=max_cost_val)
            except (ValueError, TypeError):
                pass
                
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
            
        if is_active is not None:
            is_active_str = str(is_active).lower() if is_active else ''
            queryset = queryset.filter(is_active=is_active_str == 'true')
        
        return queryset.order_by('name')


class TreatmentStatsView(generics.GenericAPIView):
    """
    API view for treatment statistics.
    GET: Get treatment statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Get treatment statistics."""
        queryset = Treatment.objects.all()
        
        # Apply tenant filtering if provided
        tenant_id = request.query_params.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        stats = {
            'total_treatments': queryset.count(),
            'active_treatments': queryset.filter(is_active=True).count(),
            'inactive_treatments': queryset.filter(is_active=False).count(),
        }
        
        # Add cost statistics if treatments exist
        if queryset.exists():
            costs = queryset.values_list('cost', flat=True)
            stats.update({
                'average_cost': sum(costs) / len(costs),
                'min_cost': min(costs),
                'max_cost': max(costs),
            })
        
        return Response(stats, status=status.HTTP_200_OK)