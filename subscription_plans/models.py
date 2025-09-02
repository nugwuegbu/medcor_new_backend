"""
Subscription Plans models for hospital billing and plan management.
Manages different tiers of service for multi-tenant hospitals.
"""

from django.db import models
from django.utils import timezone
import uuid


class SubscriptionPlan(models.Model):
    """
    Subscription plan model for managing hospital subscription tiers.
    Defines features, limits, and pricing for different plans.
    """
    
    PLAN_TYPE_CHOICES = [
        ('FREE', 'Free'),
        ('BASIC', 'Basic'),
        ('PROFESSIONAL', 'Professional'),
        ('ENTERPRISE', 'Enterprise'),
        ('CUSTOM', 'Custom'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('SEMI_ANNUAL', 'Semi-Annual'),
        ('ANNUAL', 'Annual'),
        ('ONE_TIME', 'One-Time'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    
    # Plan details
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    description = models.TextField()
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='MONTHLY')
    
    # Trial period
    trial_days = models.IntegerField(default=14)
    
    # Features and limits
    max_users = models.IntegerField()
    max_doctors = models.IntegerField()
    max_patients = models.IntegerField()
    max_appointments_per_month = models.IntegerField()
    storage_gb = models.IntegerField()
    
    # Feature flags
    has_telemedicine = models.BooleanField(default=True)
    has_analytics = models.BooleanField(default=True)
    has_api_access = models.BooleanField(default=False)
    has_custom_branding = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    has_data_export = models.BooleanField(default=True)
    has_multi_location = models.BooleanField(default=False)
    has_advanced_reporting = models.BooleanField(default=False)
    
    # Additional features (JSON for flexibility)
    features = models.JSONField(default=list, blank=True)
    # Example: ["24/7 Support", "Custom Integrations", "Dedicated Account Manager"]
    
    # Display settings
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['display_order', 'price']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"
    
    def get_monthly_price(self):
        """Calculate monthly price based on billing cycle."""
        if self.billing_cycle == 'MONTHLY':
            return self.price
        elif self.billing_cycle == 'QUARTERLY':
            return self.price / 3
        elif self.billing_cycle == 'SEMI_ANNUAL':
            return self.price / 6
        elif self.billing_cycle == 'ANNUAL':
            return self.price / 12
        return self.price


class Subscription(models.Model):
    """
    Subscription model for tracking hospital subscriptions.
    Links hospitals to their active subscription plans.
    """
    
    STATUS_CHOICES = [
        ('TRIAL', 'Trial'),
        ('ACTIVE', 'Active'),
        ('PAST_DUE', 'Past Due'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Hospital and Plan
    hospital = models.ForeignKey(
        'tenants.Hospital',
        on_delete=models.CASCADE,
        related_name='subscriptions',
        help_text='Hospital this subscription belongs to'
    )
    plan = models.ForeignKey(
        'SubscriptionPlan',
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    
    # Subscription details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TRIAL')
    
    # Dates
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    trial_end_date = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Billing
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    next_billing_date = models.DateTimeField(null=True, blank=True)
    
    # Payment information
    payment_method = models.CharField(max_length=50, blank=True)  # card, bank_transfer, etc.
    last_payment_date = models.DateTimeField(null=True, blank=True)
    last_payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Usage tracking
    current_users = models.IntegerField(default=0)
    current_doctors = models.IntegerField(default=0)
    current_patients = models.IntegerField(default=0)
    current_appointments_this_month = models.IntegerField(default=0)
    current_storage_gb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Auto-renewal
    auto_renew = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital']),
            models.Index(fields=['status']),
            models.Index(fields=['end_date']),
        ]
    
    def __str__(self):
        return f"Subscription: {self.hospital.name} - {self.plan.name}"
    
    @property
    def is_active(self):
        """Check if subscription is currently active."""
        return self.status == 'ACTIVE' and self.end_date > timezone.now()
    
    @property
    def is_trial(self):
        """Check if subscription is in trial period."""
        return self.status == 'TRIAL' and self.trial_end_date and self.trial_end_date > timezone.now()
    
    @property
    def days_remaining(self):
        """Calculate days remaining in subscription."""
        if self.end_date > timezone.now():
            return (self.end_date - timezone.now()).days
        return 0
    
    def can_add_user(self):
        """Check if more users can be added."""
        return self.current_users < self.plan.max_users
    
    def can_add_doctor(self):
        """Check if more doctors can be added."""
        return self.current_doctors < self.plan.max_doctors
    
    def can_add_patient(self):
        """Check if more patients can be added."""
        return self.current_patients < self.plan.max_patients