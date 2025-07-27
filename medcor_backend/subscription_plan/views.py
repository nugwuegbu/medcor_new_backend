from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Count, Sum, Avg
from datetime import datetime, timedelta

from .models import SubscriptionPlan, Subscription, Payment, UsageTracking
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer, PaymentSerializer,
    UsageTrackingSerializer, SubscriptionCreateSerializer, PaymentCreateSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List Subscription Plans",
        description="Retrieve a list of all available subscription plans",
        tags=["Subscription Plans"]
    ),
    create=extend_schema(
        summary="Create Subscription Plan",
        description="Create a new subscription plan",
        tags=["Subscription Plans"]
    ),
    retrieve=extend_schema(
        summary="Get Subscription Plan Details",
        description="Retrieve detailed information about a specific subscription plan",
        tags=["Subscription Plans"]
    )
)
class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Subscription Plans
    """
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan_type', 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'monthly_price', 'sort_order', 'created_at']
    ordering = ['sort_order', 'monthly_price']

    @extend_schema(
        summary="Get Active Plans",
        description="Get only active subscription plans",
        tags=["Subscription Plans"]
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_plans = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_plans, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Featured Plans",
        description="Get featured subscription plans",
        tags=["Subscription Plans"]
    )
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_plans = self.queryset.filter(is_featured=True, is_active=True)
        serializer = self.get_serializer(featured_plans, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List Subscriptions",
        description="Retrieve a list of all subscriptions",
        tags=["Subscriptions"]
    ),
    create=extend_schema(
        summary="Create Subscription",
        description="Create a new subscription",
        tags=["Subscriptions"]
    ),
    retrieve=extend_schema(
        summary="Get Subscription Details",
        description="Retrieve detailed information about a specific subscription",
        tags=["Subscriptions"]
    )
)
class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Subscriptions
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'billing_cycle', 'plan__plan_type', 'auto_renewal']
    search_fields = ['tenant__name', 'subscription_id']
    ordering_fields = ['start_date', 'end_date', 'current_price', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return SubscriptionCreateSerializer
        return SubscriptionSerializer

    @extend_schema(
        summary="Get Active Subscriptions",
        description="Get all active subscriptions",
        tags=["Subscriptions"]
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_subscriptions = self.queryset.filter(status='active')
        serializer = self.get_serializer(active_subscriptions, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Subscription Statistics",
        description="Get statistics for a specific subscription",
        tags=["Subscriptions"]
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        subscription = self.get_object()
        
        # Calculate usage statistics
        usage_stats = UsageTracking.objects.filter(
            subscription=subscription
        ).aggregate(
            total_conversations=Sum('conversations_count'),
            total_analyses=Sum('ai_analysis_count'),
            total_api_calls=Sum('api_calls_count'),
            avg_response_time=Avg('average_response_time'),
            avg_satisfaction=Avg('user_satisfaction_score')
        )
        
        # Calculate payment statistics
        payment_stats = Payment.objects.filter(
            subscription=subscription,
            status='completed'
        ).aggregate(
            total_paid=Sum('amount'),
            payment_count=Count('id')
        )
        
        stats = {
            'subscription_info': {
                'status': subscription.status,
                'plan_name': subscription.plan.name,
                'monthly_limit': subscription.plan.max_monthly_conversations,
                'monthly_used': subscription.monthly_conversations_used,
                'usage_percentage': (subscription.monthly_conversations_used / subscription.plan.max_monthly_conversations) * 100
            },
            'usage_statistics': usage_stats,
            'payment_statistics': payment_stats
        }
        
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List Payments",
        description="Retrieve a list of all payments",
        tags=["Payments"]
    ),
    create=extend_schema(
        summary="Create Payment",
        description="Create a new payment record",
        tags=["Payments"]
    ),
    retrieve=extend_schema(
        summary="Get Payment Details",
        description="Retrieve detailed information about a specific payment",
        tags=["Payments"]
    )
)
class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payments
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'currency', 'subscription__tenant']
    search_fields = ['payment_id', 'external_payment_id', 'subscription__tenant__name']
    ordering_fields = ['amount', 'payment_date', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    @extend_schema(
        summary="Get Successful Payments",
        description="Get all completed payments",
        tags=["Payments"]
    )
    @action(detail=False, methods=['get'])
    def successful(self, request):
        successful_payments = self.queryset.filter(status='completed')
        serializer = self.get_serializer(successful_payments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Payment Statistics",
        description="Get payment statistics and analytics",
        tags=["Payments"]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        # Overall payment statistics
        from django.db.models import Q
        stats = Payment.objects.aggregate(
            total_payments=Count('id'),
            total_amount=Sum('amount'),
            successful_payments=Count('id', filter=Q(status='completed')),
            failed_payments=Count('id', filter=Q(status='failed')),
            pending_payments=Count('id', filter=Q(status='pending'))
        )
        
        # Monthly revenue (last 12 months)
        monthly_revenue = []
        for i in range(12):
            date = datetime.now() - timedelta(days=30 * i)
            month_revenue = Payment.objects.filter(
                status='completed',
                payment_date__year=date.year,
                payment_date__month=date.month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_revenue.append({
                'month': date.strftime('%Y-%m'),
                'revenue': float(month_revenue)
            })
        
        stats['monthly_revenue'] = monthly_revenue
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="List Usage Tracking",
        description="Retrieve usage tracking data",
        tags=["Usage Tracking"]
    ),
    create=extend_schema(
        summary="Create Usage Record",
        description="Create a new usage tracking record",
        tags=["Usage Tracking"]
    )
)
class UsageTrackingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Usage Tracking
    """
    queryset = UsageTracking.objects.all()
    serializer_class = UsageTrackingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date', 'subscription__tenant', 'subscription__plan']
    search_fields = ['subscription__tenant__name']
    ordering_fields = ['date', 'conversations_count', 'created_at']
    ordering = ['-date']

    @extend_schema(
        summary="Get Usage Analytics",
        description="Get usage analytics and trends",
        tags=["Usage Tracking"]
    )
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        # Get date range from query params (default to last 30 days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        if 'start_date' in request.query_params:
            start_date = datetime.strptime(request.query_params['start_date'], '%Y-%m-%d').date()
        if 'end_date' in request.query_params:
            end_date = datetime.strptime(request.query_params['end_date'], '%Y-%m-%d').date()
        
        # Calculate analytics
        usage_data = self.queryset.filter(
            date__range=[start_date, end_date]
        ).aggregate(
            total_conversations=Sum('conversations_count'),
            total_analyses=Sum('ai_analysis_count'),
            total_api_calls=Sum('api_calls_count'),
            avg_response_time=Avg('average_response_time'),
            avg_satisfaction=Avg('user_satisfaction_score')
        )
        
        # Daily usage trends
        daily_usage = []
        current_date = start_date
        while current_date <= end_date:
            day_usage = self.queryset.filter(date=current_date).aggregate(
                conversations=Sum('conversations_count'),
                analyses=Sum('ai_analysis_count'),
                api_calls=Sum('api_calls_count')
            )
            daily_usage.append({
                'date': current_date.isoformat(),
                'conversations': day_usage['conversations'] or 0,
                'analyses': day_usage['analyses'] or 0,
                'api_calls': day_usage['api_calls'] or 0
            })
            current_date += timedelta(days=1)
        
        analytics = {
            'period': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'totals': usage_data,
            'daily_trends': daily_usage
        }
        
        return Response(analytics)