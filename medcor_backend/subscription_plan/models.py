from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
import uuid


class SubscriptionPlan(TimeStampedModel):
    """
    Subscription plans available for hospitals/clinics
    """
    PLAN_TYPE_CHOICES = [
        ('basic', 'Basic'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
        ('custom', 'Custom'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    
    # Pricing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    quarterly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Features and limits
    max_chatbot_users = models.IntegerField(help_text="Maximum concurrent chatbot users")
    max_monthly_conversations = models.IntegerField(help_text="Maximum conversations per month")
    ai_analysis_included = models.BooleanField(default=True, help_text="Include skin/hair/lips analysis")
    custom_branding = models.BooleanField(default=False, help_text="Allow custom hospital branding")
    api_access = models.BooleanField(default=False, help_text="API access for integrations")
    priority_support = models.BooleanField(default=False, help_text="Priority customer support")
    
    # Plan availability
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['sort_order', 'monthly_price']
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'
    
    def __str__(self):
        return f"{self.name} - ${self.monthly_price}/month"


class Subscription(TimeStampedModel):
    """
    Hospital/clinic subscription to a specific plan
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('suspended', 'Suspended'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    # Unique subscription identifier
    subscription_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Tenant relationship
    tenant = models.ForeignKey('tenants.Client', on_delete=models.CASCADE, related_name='subscriptions')
    
    # Plan details
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly')
    
    # Subscription lifecycle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    
    # Pricing (stored for historical tracking)
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Usage tracking
    monthly_conversations_used = models.IntegerField(default=0)
    last_usage_reset = models.DateTimeField(auto_now_add=True)
    
    # Billing information
    next_billing_date = models.DateTimeField(null=True, blank=True)
    auto_renewal = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name} ({self.status})"


class Payment(TimeStampedModel):
    """
    Payment records for subscriptions
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('invoice', 'Invoice'),
    ]
    
    # Payment identification
    payment_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    external_payment_id = models.CharField(max_length=255, blank=True, null=True, 
                                         help_text="Payment processor transaction ID")
    
    # Related subscription
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # Billing period covered by this payment
    billing_period_start = models.DateTimeField()
    billing_period_end = models.DateTimeField()
    
    # Payment processor details
    processor_response = models.JSONField(blank=True, null=True, 
                                        help_text="Raw response from payment processor")
    
    # Failure information
    failure_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    payment_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
    
    def __str__(self):
        return f"{self.subscription} - ${self.amount} ({self.status})"


class UsageTracking(TimeStampedModel):
    """
    Track usage metrics for subscriptions
    """
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage_logs')
    
    # Usage metrics
    date = models.DateField()
    conversations_count = models.IntegerField(default=0)
    ai_analysis_count = models.IntegerField(default=0)
    api_calls_count = models.IntegerField(default=0)
    
    # Performance metrics
    average_response_time = models.FloatField(null=True, blank=True, help_text="Average response time in seconds")
    user_satisfaction_score = models.FloatField(null=True, blank=True, help_text="Average satisfaction score 1-5")
    
    class Meta:
        unique_together = ['subscription', 'date']
        ordering = ['-date']
        verbose_name = 'Usage Tracking'
        verbose_name_plural = 'Usage Tracking'
    
    def __str__(self):
        return f"{self.subscription} - {self.date} ({self.conversations_count} conversations)"