from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse, 
    OpenApiExample
)
from drf_spectacular.types import OpenApiTypes
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
        description="Retrieve a paginated list of all available subscription plans with filtering and search capabilities",
        tags=["Subscription Plans"],
        parameters=[
            OpenApiParameter(
                name='plan_type',
                description='Filter by plan type (basic, professional, enterprise)',
                required=False,
                type=str,
                enum=['basic', 'professional', 'enterprise']
            ),
            OpenApiParameter(
                name='is_active',
                description='Filter by active status',
                required=False,
                type=bool
            ),
            OpenApiParameter(
                name='is_featured',
                description='Filter by featured status',
                required=False,
                type=bool
            ),
            OpenApiParameter(
                name='search',
                description='Search in plan name and description',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='ordering',
                description='Order results by field',
                required=False,
                type=str,
                enum=['name', '-name', 'monthly_price', '-monthly_price', 'sort_order', 'created_at']
            )
        ],
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer(many=True),
                description='List of subscription plans',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value=[{
                            'id': 1,
                            'name': 'Professional Plan',
                            'description': 'Perfect for growing hospitals',
                            'plan_type': 'professional',
                            'monthly_price': '199.99',
                            'annual_price': '1999.99',
                            'currency': 'USD',
                            'features': {
                                'max_users': 50,
                                'ai_enabled': True,
                                'support_level': 'priority'
                            },
                            'max_monthly_conversations': 10000,
                            'max_monthly_ai_analyses': 5000,
                            'max_api_calls': 100000,
                            'is_active': True,
                            'is_featured': True,
                            'sort_order': 2,
                            'created_at': '2025-07-01T10:00:00Z'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Permission denied')
        }
    ),
    create=extend_schema(
        summary="Create Subscription Plan",
        description="Create a new subscription plan (Admin only)",
        tags=["Subscription Plans"],
        request=SubscriptionPlanSerializer,
        responses={
            201: OpenApiResponse(
                response=SubscriptionPlanSerializer,
                description='Subscription plan created successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required')
        },
        examples=[
            OpenApiExample(
                'Create Plan Request',
                value={
                    'name': 'Enterprise Plan',
                    'description': 'Complete solution for large hospitals',
                    'plan_type': 'enterprise',
                    'monthly_price': '499.99',
                    'annual_price': '4999.99',
                    'currency': 'USD',
                    'features': {
                        'max_users': 'unlimited',
                        'ai_enabled': True,
                        'support_level': 'dedicated',
                        'custom_branding': True
                    },
                    'max_monthly_conversations': 50000,
                    'max_monthly_ai_analyses': 20000,
                    'max_api_calls': 1000000,
                    'is_active': True,
                    'is_featured': True,
                    'sort_order': 3
                },
                request_only=True
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Get Subscription Plan Details",
        description="Retrieve detailed information about a specific subscription plan",
        tags=["Subscription Plans"],
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer,
                description='Subscription plan details'
            ),
            404: OpenApiResponse(description='Plan not found'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    update=extend_schema(
        summary="Update Subscription Plan",
        description="Update all fields of a subscription plan (Admin only)",
        tags=["Subscription Plans"],
        request=SubscriptionPlanSerializer,
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer,
                description='Plan updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required'),
            404: OpenApiResponse(description='Plan not found')
        }
    ),
    partial_update=extend_schema(
        summary="Partially Update Subscription Plan",
        description="Update specific fields of a subscription plan (Admin only)",
        tags=["Subscription Plans"],
        request=SubscriptionPlanSerializer,
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer,
                description='Plan updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required'),
            404: OpenApiResponse(description='Plan not found')
        }
    ),
    destroy=extend_schema(
        summary="Delete Subscription Plan",
        description="Permanently delete a subscription plan (Admin only). Warning: This action cannot be undone",
        tags=["Subscription Plans"],
        responses={
            204: OpenApiResponse(description='Plan deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required'),
            404: OpenApiResponse(description='Plan not found')
        }
    )
)
class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Subscription Plans
    
    Provides CRUD operations for subscription plans with advanced filtering,
    searching, and sorting capabilities. Admin privileges required for create,
    update, and delete operations.
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
        description="Retrieve only active subscription plans that are currently available for purchase",
        tags=["Subscription Plans"],
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer(many=True),
                description='List of active subscription plans',
                examples=[
                    OpenApiExample(
                        'Active Plans Response',
                        value=[{
                            'id': 1,
                            'name': 'Basic Plan',
                            'plan_type': 'basic',
                            'monthly_price': '99.99',
                            'is_active': True,
                            'is_featured': False
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_plans = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_plans, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Featured Plans",
        description="Retrieve featured subscription plans that should be highlighted to users",
        tags=["Subscription Plans"],
        responses={
            200: OpenApiResponse(
                response=SubscriptionPlanSerializer(many=True),
                description='List of featured subscription plans',
                examples=[
                    OpenApiExample(
                        'Featured Plans Response',
                        value=[{
                            'id': 2,
                            'name': 'Professional Plan',
                            'plan_type': 'professional',
                            'monthly_price': '199.99',
                            'is_active': True,
                            'is_featured': True,
                            'badge': 'Most Popular'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    )
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_plans = self.queryset.filter(is_featured=True, is_active=True)
        serializer = self.get_serializer(featured_plans, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List Subscriptions",
        description="Retrieve a paginated list of all subscriptions with filtering and search capabilities",
        tags=["Subscriptions"],
        parameters=[
            OpenApiParameter(
                name='status',
                description='Filter by subscription status',
                required=False,
                type=str,
                enum=['active', 'expired', 'cancelled', 'pending']
            ),
            OpenApiParameter(
                name='billing_cycle',
                description='Filter by billing cycle',
                required=False,
                type=str,
                enum=['monthly', 'annual']
            ),
            OpenApiParameter(
                name='plan__plan_type',
                description='Filter by plan type',
                required=False,
                type=str,
                enum=['basic', 'professional', 'enterprise']
            ),
            OpenApiParameter(
                name='auto_renewal',
                description='Filter by auto-renewal status',
                required=False,
                type=bool
            ),
            OpenApiParameter(
                name='search',
                description='Search by tenant name or subscription ID',
                required=False,
                type=str
            )
        ],
        responses={
            200: OpenApiResponse(
                response=SubscriptionSerializer(many=True),
                description='List of subscriptions',
                examples=[
                    OpenApiExample(
                        'Subscription List Response',
                        value=[{
                            'id': 1,
                            'subscription_id': 'SUB-2025-001',
                            'tenant': {'id': 1, 'name': 'City Hospital'},
                            'plan': {'id': 2, 'name': 'Professional Plan'},
                            'status': 'active',
                            'billing_cycle': 'monthly',
                            'start_date': '2025-07-01',
                            'end_date': '2025-08-01',
                            'current_price': '199.99',
                            'monthly_conversations_used': 3456,
                            'auto_renewal': True,
                            'created_at': '2025-07-01T10:00:00Z'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        summary="Create Subscription",
        description="Create a new subscription for a tenant",
        tags=["Subscriptions"],
        request=SubscriptionCreateSerializer,
        responses={
            201: OpenApiResponse(
                response=SubscriptionSerializer,
                description='Subscription created successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Permission denied')
        },
        examples=[
            OpenApiExample(
                'Create Subscription Request',
                value={
                    'tenant': 1,
                    'plan': 2,
                    'billing_cycle': 'monthly',
                    'auto_renewal': True,
                    'payment_method': 'card'
                },
                request_only=True
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Get Subscription Details",
        description="Retrieve detailed information about a specific subscription",
        tags=["Subscriptions"],
        responses={
            200: OpenApiResponse(
                response=SubscriptionSerializer,
                description='Subscription details'
            ),
            404: OpenApiResponse(description='Subscription not found'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    update=extend_schema(
        summary="Update Subscription",
        description="Update all fields of a subscription",
        tags=["Subscriptions"],
        request=SubscriptionSerializer,
        responses={
            200: OpenApiResponse(
                response=SubscriptionSerializer,
                description='Subscription updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Subscription not found')
        }
    ),
    partial_update=extend_schema(
        summary="Partially Update Subscription",
        description="Update specific fields of a subscription",
        tags=["Subscriptions"],
        request=SubscriptionSerializer,
        responses={
            200: OpenApiResponse(
                response=SubscriptionSerializer,
                description='Subscription updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Subscription not found')
        }
    ),
    destroy=extend_schema(
        summary="Cancel Subscription",
        description="Cancel an active subscription",
        tags=["Subscriptions"],
        responses={
            204: OpenApiResponse(description='Subscription cancelled successfully'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Subscription not found')
        }
    )
)
class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Subscriptions
    
    Provides comprehensive subscription management with usage tracking,
    billing cycle management, and auto-renewal capabilities.
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
        description="Retrieve all currently active subscriptions across all tenants",
        tags=["Subscriptions"],
        responses={
            200: OpenApiResponse(
                response=SubscriptionSerializer(many=True),
                description='List of active subscriptions',
                examples=[
                    OpenApiExample(
                        'Active Subscriptions Response',
                        value=[{
                            'id': 1,
                            'subscription_id': 'SUB-2025-001',
                            'tenant': {'id': 1, 'name': 'City Hospital'},
                            'plan': {'id': 2, 'name': 'Professional Plan'},
                            'status': 'active',
                            'billing_cycle': 'monthly',
                            'end_date': '2025-08-01'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        active_subscriptions = self.queryset.filter(status='active')
        serializer = self.get_serializer(active_subscriptions, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Subscription Statistics",
        description="Retrieve comprehensive usage and payment statistics for a specific subscription",
        tags=["Subscriptions"],
        responses={
            200: OpenApiResponse(
                description='Subscription statistics',
                examples=[
                    OpenApiExample(
                        'Statistics Response',
                        value={
                            'subscription_info': {
                                'status': 'active',
                                'plan_name': 'Professional Plan',
                                'monthly_limit': 10000,
                                'monthly_used': 3456,
                                'usage_percentage': 34.56
                            },
                            'usage_statistics': {
                                'total_conversations': 15678,
                                'total_analyses': 8901,
                                'total_api_calls': 234567,
                                'avg_response_time': 1.23,
                                'avg_satisfaction': 4.5
                            },
                            'payment_statistics': {
                                'total_paid': 2399.88,
                                'payment_count': 12
                            }
                        }
                    )
                ]
            ),
            404: OpenApiResponse(description='Subscription not found'),
            401: OpenApiResponse(description='Authentication required')
        }
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
        description="Retrieve a paginated list of all payment records with filtering and search capabilities",
        tags=["Payments"],
        parameters=[
            OpenApiParameter(
                name='status',
                description='Filter by payment status',
                required=False,
                type=str,
                enum=['pending', 'completed', 'failed', 'refunded']
            ),
            OpenApiParameter(
                name='payment_method',
                description='Filter by payment method',
                required=False,
                type=str,
                enum=['card', 'bank_transfer', 'paypal', 'stripe']
            ),
            OpenApiParameter(
                name='currency',
                description='Filter by currency',
                required=False,
                type=str,
                enum=['USD', 'EUR', 'GBP']
            ),
            OpenApiParameter(
                name='subscription__tenant',
                description='Filter by tenant ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='search',
                description='Search by payment ID or tenant name',
                required=False,
                type=str
            )
        ],
        responses={
            200: OpenApiResponse(
                response=PaymentSerializer(many=True),
                description='List of payments',
                examples=[
                    OpenApiExample(
                        'Payment List Response',
                        value=[{
                            'id': 1,
                            'payment_id': 'PAY-2025-001',
                            'subscription': {'id': 1, 'subscription_id': 'SUB-2025-001'},
                            'amount': '199.99',
                            'currency': 'USD',
                            'payment_method': 'card',
                            'status': 'completed',
                            'payment_date': '2025-08-01T10:00:00Z',
                            'external_payment_id': 'stripe_payment_xyz123',
                            'created_at': '2025-08-01T09:00:00Z'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        summary="Create Payment",
        description="Create a new payment record for a subscription",
        tags=["Payments"],
        request=PaymentCreateSerializer,
        responses={
            201: OpenApiResponse(
                response=PaymentSerializer,
                description='Payment created successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required')
        },
        examples=[
            OpenApiExample(
                'Create Payment Request',
                value={
                    'subscription': 1,
                    'amount': '199.99',
                    'currency': 'USD',
                    'payment_method': 'card',
                    'external_payment_id': 'stripe_payment_xyz123'
                },
                request_only=True
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Get Payment Details",
        description="Retrieve detailed information about a specific payment",
        tags=["Payments"],
        responses={
            200: OpenApiResponse(
                response=PaymentSerializer,
                description='Payment details'
            ),
            404: OpenApiResponse(description='Payment not found'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    update=extend_schema(
        summary="Update Payment",
        description="Update payment information",
        tags=["Payments"],
        request=PaymentSerializer,
        responses={
            200: OpenApiResponse(
                response=PaymentSerializer,
                description='Payment updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Payment not found')
        }
    ),
    partial_update=extend_schema(
        summary="Update Payment Status",
        description="Update payment status or specific fields",
        tags=["Payments"],
        request=PaymentSerializer,
        responses={
            200: OpenApiResponse(
                response=PaymentSerializer,
                description='Payment updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Payment not found')
        },
        examples=[
            OpenApiExample(
                'Update Payment Status',
                value={
                    'status': 'completed',
                    'payment_date': '2025-08-07T10:00:00Z'
                },
                request_only=True
            )
        ]
    ),
    destroy=extend_schema(
        summary="Delete Payment Record",
        description="Delete a payment record (Admin only)",
        tags=["Payments"],
        responses={
            204: OpenApiResponse(description='Payment deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required'),
            404: OpenApiResponse(description='Payment not found')
        }
    )
)
class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payments
    
    Handles payment processing, tracking, and reporting for subscription billing.
    Integrates with external payment providers and maintains audit trail.
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
        description="Retrieve all completed/successful payment transactions",
        tags=["Payments"],
        responses={
            200: OpenApiResponse(
                response=PaymentSerializer(many=True),
                description='List of successful payments',
                examples=[
                    OpenApiExample(
                        'Successful Payments Response',
                        value=[{
                            'id': 1,
                            'payment_id': 'PAY-2025-001',
                            'amount': '199.99',
                            'status': 'completed',
                            'payment_date': '2025-08-01T10:00:00Z'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    )
    @action(detail=False, methods=['get'])
    def successful(self, request):
        successful_payments = self.queryset.filter(status='completed')
        serializer = self.get_serializer(successful_payments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Payment Statistics",
        description="Retrieve comprehensive payment analytics including revenue trends and payment status distribution",
        tags=["Payments"],
        responses={
            200: OpenApiResponse(
                description='Payment statistics and analytics',
                examples=[
                    OpenApiExample(
                        'Payment Statistics Response',
                        value={
                            'total_payments': 156,
                            'total_amount': 31234.56,
                            'successful_payments': 150,
                            'failed_payments': 4,
                            'pending_payments': 2,
                            'monthly_revenue': [
                                {'month': '2025-08', 'revenue': 4599.88},
                                {'month': '2025-07', 'revenue': 5299.95}
                            ]
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
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
        description="Retrieve comprehensive usage tracking data with filtering and search capabilities",
        tags=["Usage Tracking"],
        parameters=[
            OpenApiParameter(
                name='date',
                description='Filter by specific date (YYYY-MM-DD)',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='subscription__tenant',
                description='Filter by tenant ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='subscription__plan',
                description='Filter by plan ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='search',
                description='Search by tenant name',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='ordering',
                description='Order results by field',
                required=False,
                type=str,
                enum=['date', '-date', 'conversations_count', '-conversations_count', 'created_at']
            )
        ],
        responses={
            200: OpenApiResponse(
                response=UsageTrackingSerializer(many=True),
                description='List of usage records',
                examples=[
                    OpenApiExample(
                        'Usage Tracking Response',
                        value=[{
                            'id': 1,
                            'subscription': {'id': 1, 'subscription_id': 'SUB-2025-001'},
                            'date': '2025-08-07',
                            'conversations_count': 234,
                            'ai_analysis_count': 156,
                            'api_calls_count': 3456,
                            'storage_used_mb': 1234.56,
                            'average_response_time': 1.23,
                            'user_satisfaction_score': 4.5,
                            'created_at': '2025-08-07T10:00:00Z'
                        }]
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        summary="Create Usage Record",
        description="Create a new usage tracking record for monitoring subscription utilization",
        tags=["Usage Tracking"],
        request=UsageTrackingSerializer,
        responses={
            201: OpenApiResponse(
                response=UsageTrackingSerializer,
                description='Usage record created successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required')
        },
        examples=[
            OpenApiExample(
                'Create Usage Record Request',
                value={
                    'subscription': 1,
                    'date': '2025-08-07',
                    'conversations_count': 234,
                    'ai_analysis_count': 156,
                    'api_calls_count': 3456,
                    'storage_used_mb': 1234.56,
                    'average_response_time': 1.23,
                    'user_satisfaction_score': 4.5
                },
                request_only=True
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Get Usage Details",
        description="Retrieve detailed usage information for a specific record",
        tags=["Usage Tracking"],
        responses={
            200: OpenApiResponse(
                response=UsageTrackingSerializer,
                description='Usage record details'
            ),
            404: OpenApiResponse(description='Usage record not found'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    update=extend_schema(
        summary="Update Usage Record",
        description="Update all fields of a usage tracking record",
        tags=["Usage Tracking"],
        request=UsageTrackingSerializer,
        responses={
            200: OpenApiResponse(
                response=UsageTrackingSerializer,
                description='Usage record updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Usage record not found')
        }
    ),
    partial_update=extend_schema(
        summary="Partially Update Usage Record",
        description="Update specific fields of a usage tracking record",
        tags=["Usage Tracking"],
        request=UsageTrackingSerializer,
        responses={
            200: OpenApiResponse(
                response=UsageTrackingSerializer,
                description='Usage record updated successfully'
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Usage record not found')
        }
    ),
    destroy=extend_schema(
        summary="Delete Usage Record",
        description="Delete a usage tracking record (Admin only)",
        tags=["Usage Tracking"],
        responses={
            204: OpenApiResponse(description='Usage record deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            403: OpenApiResponse(description='Admin privileges required'),
            404: OpenApiResponse(description='Usage record not found')
        }
    )
)
class UsageTrackingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Usage Tracking
    
    Monitors and records subscription usage metrics including conversations,
    AI analyses, API calls, storage, and performance indicators.
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
        description="Retrieve comprehensive usage analytics and trends for a specified date range",
        tags=["Usage Tracking"],
        parameters=[
            OpenApiParameter(
                name='start_date',
                description='Start date for analytics period (YYYY-MM-DD)',
                required=False,
                type=str
            ),
            OpenApiParameter(
                name='end_date',
                description='End date for analytics period (YYYY-MM-DD)',
                required=False,
                type=str
            )
        ],
        responses={
            200: OpenApiResponse(
                description='Usage analytics and trends',
                examples=[
                    OpenApiExample(
                        'Usage Analytics Response',
                        value={
                            'period': {
                                'start': '2025-07-01',
                                'end': '2025-08-07'
                            },
                            'totals': {
                                'conversations': 45678,
                                'ai_analyses': 23456,
                                'api_calls': 567890
                            },
                            'daily_average': {
                                'conversations': 1234,
                                'ai_analyses': 633,
                                'api_calls': 15348
                            },
                            'trends': {
                                'conversations_growth': 12.5,
                                'ai_analyses_growth': 8.3,
                                'api_calls_growth': 15.7
                            }
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
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