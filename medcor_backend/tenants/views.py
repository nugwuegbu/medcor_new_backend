from django.shortcuts import render
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from .models import Client, Domain
from .serializers import (
    ClientSerializer, DomainSerializer, CreateClientSerializer, AdminStatsSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    API viewset for Client (Tenant) management.
    """
    queryset = Client.objects.all().prefetch_related('domain_set')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return the appropriate serializer based on action."""
        if self.action == 'create':
            return CreateClientSerializer
        return ClientSerializer
    
    @action(detail=True, methods=['get'])
    def domains(self, request, pk=None):
        """Get all domains for a specific tenant."""
        client = self.get_object()
        domains = Domain.objects.filter(tenant=client)
        serializer = DomainSerializer(domains, many=True)
        return Response({
            'tenant': client.name,
            'tenant_id': client.id,
            'domains': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive tenant statistics for admin dashboard."""
        # Calculate date ranges
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        
        # Basic counts
        total_tenants = Client.objects.count()
        total_domains = Domain.objects.count()
        active_tenants = Client.objects.filter(created_on__gte=last_month).count()
        
        # Recent tenants
        recent_tenants = Client.objects.order_by('-created_on')[:5]
        recent_tenants_data = ClientSerializer(recent_tenants, many=True).data
        
        # Tenant growth data (last 7 days)
        tenant_growth = {}
        for i in range(7):
            date = (now - timedelta(days=i)).date()
            count = Client.objects.filter(created_on=date).count()
            tenant_growth[date.strftime('%Y-%m-%d')] = count
        
        stats_data = {
            'total_tenants': total_tenants,
            'total_domains': total_domains,
            'active_tenants': active_tenants,
            'recent_tenants': recent_tenants_data,
            'tenant_growth': tenant_growth
        }
        
        serializer = AdminStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class DomainViewSet(viewsets.ModelViewSet):
    """
    API viewset for Domain management.
    """
    queryset = Domain.objects.all().select_related('tenant')
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_tenant(self, request):
        """Get domains grouped by tenant."""
        tenant_id = request.query_params.get('tenant_id')
        if tenant_id:
            domains = Domain.objects.filter(tenant_id=tenant_id).select_related('tenant')
        else:
            domains = Domain.objects.all().select_related('tenant')
            
        serializer = DomainSerializer(domains, many=True)
        return Response(serializer.data)


