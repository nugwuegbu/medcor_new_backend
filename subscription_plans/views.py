"""
ViewSets for Subscription Plans management.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, F
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, Subscription
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionPlanListSerializer,
    SubscriptionSerializer, CreateSubscriptionSerializer,
    SubscriptionUsageSerializer
)


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subscription Plan CRUD operations.
    
    Provides endpoints for:
    - List all subscription plans
    - Create new plan (admin only)
    - Retrieve plan details
    - Update plan (admin only)
    - Delete plan (admin only)
    - Custom actions for plan management
    """
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan_type', 'is_active', 'is_featured', 'billing_cycle']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'display_order', 'created_at']
    ordering = ['display_order', 'price']
    
    def get_permissions(self):
        """Allow anonymous users to view plans."""
        if self.action in ['list', 'retrieve', 'available', 'compare']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter active plans for non-admin users."""
        queryset = super().get_queryset()
        
        # Only show active plans to non-admin users
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return SubscriptionPlanListSerializer
        return SubscriptionPlanSerializer
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available plans for public display."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = SubscriptionPlanSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured plans."""
        queryset = self.get_queryset().filter(is_active=True, is_featured=True)
        serializer = SubscriptionPlanSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def compare(self, request):
        """Compare multiple plans."""
        plan_ids = request.data.get('plan_ids', [])
        if not plan_ids:
            return Response(
                {'error': 'plan_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        plans = self.get_queryset().filter(id__in=plan_ids)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        
        # Create comparison matrix
        comparison = {
            'plans': serializer.data,
            'features_matrix': self._create_features_matrix(plans)
        }
        
        return Response(comparison)
    
    def _create_features_matrix(self, plans):
        """Create a feature comparison matrix."""
        features = [
            'max_users', 'max_doctors', 'max_patients',
            'max_appointments_per_month', 'storage_gb',
            'has_telemedicine', 'has_analytics', 'has_api_access',
            'has_custom_branding', 'has_priority_support',
            'has_data_export', 'has_multi_location',
            'has_advanced_reporting'
        ]
        
        matrix = {}
        for feature in features:
            matrix[feature] = {}
            for plan in plans:
                matrix[feature][str(plan.id)] = getattr(plan, feature)
        
        return matrix


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subscription management.
    
    Provides endpoints for:
    - List all subscriptions (admin)
    - Create new subscription
    - Retrieve subscription details
    - Update subscription
    - Cancel subscription
    - Custom actions for subscription management
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'plan', 'auto_renew']
    search_fields = ['hospital_name']
    ordering_fields = ['created_at', 'end_date', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter subscriptions based on user role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Non-admin users can only see their hospital's subscription
        if not user.is_staff:
            if hasattr(user, 'hospital_name') and user.hospital_name:
                queryset = queryset.filter(hospital_name=user.hospital_name)
            else:
                # Return empty queryset if user has no hospital
                return queryset.none()
        
        return queryset.select_related('plan')
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return CreateSubscriptionSerializer
        return SubscriptionSerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's hospital subscription."""
        if not hasattr(request.user, 'hospital_name') or not request.user.hospital_name:
            return Response(
                {'error': 'User has no associated hospital'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            subscription = Subscription.objects.get(hospital_name=request.user.hospital_name)
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription."""
        subscription = self.get_object()
        subscription.status = 'CANCELLED'
        subscription.cancelled_at = timezone.now()
        subscription.auto_renew = False
        subscription.save()
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Manually renew a subscription."""
        subscription = self.get_object()
        
        # Calculate new period based on billing cycle
        plan = subscription.plan
        if plan.billing_cycle == 'MONTHLY':
            delta = timedelta(days=30)
        elif plan.billing_cycle == 'QUARTERLY':
            delta = timedelta(days=90)
        elif plan.billing_cycle == 'SEMI_ANNUAL':
            delta = timedelta(days=180)
        elif plan.billing_cycle == 'ANNUAL':
            delta = timedelta(days=365)
        else:
            delta = timedelta(days=30)
        
        # Update subscription periods
        subscription.current_period_start = subscription.current_period_end
        subscription.current_period_end = subscription.current_period_end + delta
        subscription.end_date = subscription.current_period_end
        subscription.next_billing_date = subscription.current_period_end
        subscription.status = 'ACTIVE'
        subscription.save()
        
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        """Upgrade subscription to a different plan."""
        subscription = self.get_object()
        new_plan_id = request.data.get('plan_id')
        
        if not new_plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid plan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update subscription with new plan
        subscription.plan = new_plan
        subscription.save()
        
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get subscriptions expiring in the next 30 days."""
        thirty_days_from_now = timezone.now() + timedelta(days=30)
        queryset = self.get_queryset().filter(
            end_date__lte=thirty_days_from_now,
            status__in=['ACTIVE', 'TRIAL']
        )
        serializer = SubscriptionSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get subscription usage statistics."""
        subscription = self.get_object()
        
        # Calculate usage percentages
        usage_data = {
            'hospital_id': None,  # No longer using hospital ID
            'hospital_name': subscription.hospital_name,
            'plan_name': subscription.plan.name,
            'users': {
                'current': subscription.current_users,
                'limit': subscription.plan.max_users,
                'percentage': (subscription.current_users / subscription.plan.max_users * 100) 
                    if subscription.plan.max_users > 0 else 0
            },
            'doctors': {
                'current': subscription.current_doctors,
                'limit': subscription.plan.max_doctors,
                'percentage': (subscription.current_doctors / subscription.plan.max_doctors * 100)
                    if subscription.plan.max_doctors > 0 else 0
            },
            'patients': {
                'current': subscription.current_patients,
                'limit': subscription.plan.max_patients,
                'percentage': (subscription.current_patients / subscription.plan.max_patients * 100)
                    if subscription.plan.max_patients > 0 else 0
            },
            'appointments': {
                'current': subscription.current_appointments_this_month,
                'limit': subscription.plan.max_appointments_per_month,
                'percentage': (subscription.current_appointments_this_month / 
                             subscription.plan.max_appointments_per_month * 100)
                    if subscription.plan.max_appointments_per_month > 0 else 0
            },
            'storage': {
                'current': float(subscription.current_storage_gb),
                'limit': subscription.plan.storage_gb,
                'percentage': (float(subscription.current_storage_gb) / 
                             subscription.plan.storage_gb * 100)
                    if subscription.plan.storage_gb > 0 else 0
            },
            'is_over_limit': False,
            'recommendations': []
        }
        
        # Check if any limit is exceeded
        for resource in ['users', 'doctors', 'patients', 'appointments', 'storage']:
            if usage_data[resource]['percentage'] > 90:
                usage_data['recommendations'].append(
                    f"Consider upgrading - {resource} usage at {usage_data[resource]['percentage']:.1f}%"
                )
            if usage_data[resource]['percentage'] > 100:
                usage_data['is_over_limit'] = True
        
        serializer = SubscriptionUsageSerializer(usage_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get subscription statistics (admin only)."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total_subscriptions': queryset.count(),
            'active_subscriptions': queryset.filter(status='ACTIVE').count(),
            'trial_subscriptions': queryset.filter(status='TRIAL').count(),
            'cancelled_subscriptions': queryset.filter(status='CANCELLED').count(),
            'subscriptions_by_plan': dict(
                queryset.values('plan__name').annotate(count=Count('id')).values_list('plan__name', 'count')
            ),
            'subscriptions_by_status': dict(
                queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')
            ),
            'total_revenue': queryset.filter(status='ACTIVE').aggregate(
                total=Sum('plan__price')
            )['total'] or 0
        }
        
        return Response(stats)