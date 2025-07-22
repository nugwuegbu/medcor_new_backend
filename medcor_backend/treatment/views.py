from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Treatment
from .serializers import (
    TreatmentSerializer,
    TreatmentCreateSerializer,
    TreatmentUpdateSerializer,
    TreatmentListSerializer
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
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TreatmentCreateSerializer
        return TreatmentListSerializer
    
    def get_queryset(self):
        """Filter treatments based on user permissions."""
        queryset = Treatment.objects.select_related('tenant')
        
        # Add any additional filtering logic here
        # For example, filter by tenant if user belongs to specific tenant
        
        return queryset


class TreatmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for retrieving, updating, and deleting a specific treatment.
    GET: Retrieve treatment details
    PUT/PATCH: Update treatment
    DELETE: Delete treatment
    """
    queryset = Treatment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TreatmentUpdateSerializer
        return TreatmentSerializer
    
    def get_queryset(self):
        """Filter treatments based on user permissions."""
        return Treatment.objects.select_related('tenant')


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
                queryset = queryset.filter(cost__gte=float(min_cost))
            except ValueError:
                pass
                
        if max_cost:
            try:
                queryset = queryset.filter(cost__lte=float(max_cost))
            except ValueError:
                pass
                
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
            
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
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