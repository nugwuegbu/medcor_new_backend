from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, Payment, UsageTracking


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'plan_type', 'monthly_price',
            'quarterly_price', 'yearly_price', 'max_chatbot_users',
            'max_monthly_conversations', 'features', 'is_active',
            'is_featured', 'sort_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_features(self, obj):
        return {
            'ai_analysis_included': obj.ai_analysis_included,
            'custom_branding': obj.custom_branding,
            'api_access': obj.api_access,
            'priority_support': obj.priority_support
        }


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_id', 'tenant', 'tenant_name', 'plan',
            'plan_details', 'billing_cycle', 'status', 'start_date',
            'end_date', 'trial_end_date', 'current_price',
            'monthly_conversations_used', 'usage_percentage',
            'next_billing_date', 'auto_renewal', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'subscription_id', 'start_date', 'created_at', 'updated_at'
        ]
    
    def get_usage_percentage(self, obj):
        if obj.plan.max_monthly_conversations > 0:
            return (obj.monthly_conversations_used / obj.plan.max_monthly_conversations) * 100
        return 0


class PaymentSerializer(serializers.ModelSerializer):
    subscription_details = serializers.CharField(source='subscription.__str__', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'external_payment_id', 'subscription',
            'subscription_details', 'amount', 'currency', 'status',
            'payment_method', 'billing_period_start', 'billing_period_end',
            'payment_date', 'failure_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_id', 'created_at', 'updated_at']


class UsageTrackingSerializer(serializers.ModelSerializer):
    subscription_details = serializers.CharField(source='subscription.__str__', read_only=True)
    
    class Meta:
        model = UsageTracking
        fields = [
            'id', 'subscription', 'subscription_details', 'date',
            'conversations_count', 'ai_analysis_count', 'api_calls_count',
            'average_response_time', 'user_satisfaction_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            'tenant', 'plan', 'billing_cycle', 'status',
            'end_date', 'trial_end_date', 'current_price',
            'next_billing_date', 'auto_renewal'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'subscription', 'amount', 'currency', 'payment_method',
            'billing_period_start', 'billing_period_end',
            'external_payment_id'
        ]