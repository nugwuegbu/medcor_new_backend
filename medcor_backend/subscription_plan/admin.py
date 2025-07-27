from django.contrib import admin
from .models import SubscriptionPlan, Subscription, Payment, UsageTracking


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'plan_type', 'monthly_price', 'max_chatbot_users', 
        'max_monthly_conversations', 'is_active', 'is_featured'
    ]
    list_filter = ['plan_type', 'is_active', 'is_featured', 'custom_branding', 'api_access']
    search_fields = ['name', 'description']
    ordering = ['sort_order', 'monthly_price']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'plan_type', 'sort_order')
        }),
        ('Pricing', {
            'fields': ('monthly_price', 'quarterly_price', 'yearly_price')
        }),
        ('Features & Limits', {
            'fields': (
                'max_chatbot_users', 'max_monthly_conversations',
                'ai_analysis_included', 'custom_branding', 
                'api_access', 'priority_support'
            )
        }),
        ('Availability', {
            'fields': ('is_active', 'is_featured')
        }),
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'subscription_id', 'tenant', 'plan', 'status', 'billing_cycle',
        'start_date', 'end_date', 'current_price'
    ]
    list_filter = ['status', 'billing_cycle', 'auto_renewal', 'plan__plan_type']
    search_fields = ['tenant__name', 'subscription_id']
    readonly_fields = ['subscription_id', 'start_date', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Subscription Details', {
            'fields': ('subscription_id', 'tenant', 'plan', 'billing_cycle', 'current_price')
        }),
        ('Status & Lifecycle', {
            'fields': ('status', 'start_date', 'end_date', 'trial_end_date', 'auto_renewal')
        }),
        ('Usage Tracking', {
            'fields': ('monthly_conversations_used', 'last_usage_reset')
        }),
        ('Billing', {
            'fields': ('next_billing_date',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_id', 'subscription', 'amount', 'currency', 
        'status', 'payment_method', 'payment_date'
    ]
    list_filter = ['status', 'payment_method', 'currency']
    search_fields = ['payment_id', 'external_payment_id', 'subscription__tenant__name']
    readonly_fields = ['payment_id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_id', 'external_payment_id', 'subscription')
        }),
        ('Transaction Details', {
            'fields': ('amount', 'currency', 'status', 'payment_method', 'payment_date')
        }),
        ('Billing Period', {
            'fields': ('billing_period_start', 'billing_period_end')
        }),
        ('Processing Details', {
            'fields': ('processor_response', 'failure_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UsageTracking)
class UsageTrackingAdmin(admin.ModelAdmin):
    list_display = [
        'subscription', 'date', 'conversations_count', 
        'ai_analysis_count', 'api_calls_count', 'user_satisfaction_score'
    ]
    list_filter = ['date', 'subscription__plan__plan_type']
    search_fields = ['subscription__tenant__name']
    ordering = ['-date']
    
    fieldsets = (
        ('Usage Information', {
            'fields': ('subscription', 'date')
        }),
        ('Usage Metrics', {
            'fields': ('conversations_count', 'ai_analysis_count', 'api_calls_count')
        }),
        ('Performance Metrics', {
            'fields': ('average_response_time', 'user_satisfaction_score')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )