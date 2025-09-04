"""
Serializers for Subscription Plans models.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan model."""

    monthly_price = serializers.DecimalField(
        source="get_monthly_price", read_only=True, max_digits=10, decimal_places=2
    )

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "plan_type",
            "description",
            "price",
            "currency",
            "billing_cycle",
            "trial_days",
            "max_users",
            "max_doctors",
            "max_patients",
            "max_appointments_per_month",
            "storage_gb",
            "has_telemedicine",
            "has_analytics",
            "has_api_access",
            "has_custom_branding",
            "has_priority_support",
            "has_data_export",
            "has_multi_location",
            "has_advanced_reporting",
            "features",
            "is_active",
            "is_featured",
            "display_order",
            "created_at",
            "updated_at",
            "metadata",
            "monthly_price",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "monthly_price"]

    def validate_features(self, value):
        """Ensure features is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Features must be a list")
        return value


class SubscriptionPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for plan listings."""

    monthly_price = serializers.DecimalField(
        source="get_monthly_price", read_only=True, max_digits=10, decimal_places=2
    )

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "plan_type",
            "price",
            "currency",
            "billing_cycle",
            "monthly_price",
            "is_featured",
            "features",
        ]
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model."""

    plan_name = serializers.CharField(source="plan.name", read_only=True)
    hospital_name = serializers.CharField(read_only=True)
    plan_details = SubscriptionPlanSerializer(source="plan", read_only=True)
    days_until_renewal = serializers.SerializerMethodField()
    is_in_trial = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "hospital",
            "hospital_name",
            "plan",
            "plan_name",
            "plan_details",
            "status",
            "start_date",
            "end_date",
            "trial_end_date",
            "cancelled_at",
            "current_period_start",
            "current_period_end",
            "next_billing_date",
            "payment_method",
            "last_payment_date",
            "last_payment_amount",
            "current_users",
            "current_doctors",
            "current_patients",
            "current_appointments_this_month",
            "current_storage_gb",
            "auto_renew",
            "created_at",
            "updated_at",
            "metadata",
            "days_until_renewal",
            "is_in_trial",
            "usage_percentage",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "plan_name",
            "hospital",
            "hospital_name",
            "days_until_renewal",
            "is_in_trial",
            "usage_percentage",
        ]

    def get_days_until_renewal(self, obj):
        """Calculate days until next renewal."""
        if obj.next_billing_date:
            delta = obj.next_billing_date - timezone.now()
            return max(0, delta.days)
        return None

    def get_is_in_trial(self, obj):
        """Check if subscription is in trial period."""
        if obj.trial_end_date:
            return timezone.now() < obj.trial_end_date
        return False

    def get_usage_percentage(self, obj):
        """Calculate usage percentage for various limits."""
        usage = {}
        if obj.plan:
            if obj.plan.max_users > 0:
                usage["users"] = (obj.current_users / obj.plan.max_users) * 100
            if obj.plan.max_doctors > 0:
                usage["doctors"] = (obj.current_doctors / obj.plan.max_doctors) * 100
            if obj.plan.max_patients > 0:
                usage["patients"] = (obj.current_patients / obj.plan.max_patients) * 100
            if obj.plan.storage_gb > 0:
                usage["storage"] = (
                    float(obj.current_storage_gb) / obj.plan.storage_gb
                ) * 100
        return usage

    def validate(self, data):
        """Validate subscription data."""
        if "end_date" in data and "start_date" in data:
            if data["end_date"] < data["start_date"]:
                raise serializers.ValidationError("End date must be after start date")

        if "current_period_end" in data and "current_period_start" in data:
            if data["current_period_end"] < data["current_period_start"]:
                raise serializers.ValidationError(
                    "Current period end must be after start"
                )

        return data


class CreateSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating subscriptions."""

    class Meta:
        model = Subscription
        fields = [
            "hospital",
            "plan",
            "status",
            "start_date",
            "end_date",
            "trial_end_date",
            "current_period_start",
            "current_period_end",
            "next_billing_date",
            "payment_method",
            "auto_renew",
            "metadata",
        ]

    def create(self, validated_data):
        """Create subscription with calculated dates."""
        plan = validated_data["plan"]

        # Set default dates if not provided
        if "start_date" not in validated_data:
            validated_data["start_date"] = timezone.now()

        # Calculate trial end date if trial days exist
        if plan.trial_days > 0 and "trial_end_date" not in validated_data:
            validated_data["trial_end_date"] = validated_data[
                "start_date"
            ] + timezone.timedelta(days=plan.trial_days)

        # Set initial period
        if "current_period_start" not in validated_data:
            validated_data["current_period_start"] = validated_data["start_date"]

        if "current_period_end" not in validated_data:
            # Calculate based on billing cycle
            if plan.billing_cycle == "MONTHLY":
                delta = timezone.timedelta(days=30)
            elif plan.billing_cycle == "QUARTERLY":
                delta = timezone.timedelta(days=90)
            elif plan.billing_cycle == "SEMI_ANNUAL":
                delta = timezone.timedelta(days=180)
            elif plan.billing_cycle == "ANNUAL":
                delta = timezone.timedelta(days=365)
            else:
                delta = timezone.timedelta(days=30)

            validated_data["current_period_end"] = (
                validated_data["current_period_start"] + delta
            )

        if "end_date" not in validated_data:
            validated_data["end_date"] = validated_data["current_period_end"]

        if "next_billing_date" not in validated_data and validated_data.get(
            "auto_renew"
        ):
            validated_data["next_billing_date"] = validated_data["current_period_end"]

        return super().create(validated_data)


class SubscriptionUsageSerializer(serializers.Serializer):
    """Serializer for subscription usage statistics."""

    hospital_id = serializers.UUIDField()
    hospital_name = serializers.CharField()
    plan_name = serializers.CharField()
    users = serializers.DictField()
    doctors = serializers.DictField()
    patients = serializers.DictField()
    appointments = serializers.DictField()
    storage = serializers.DictField()
    is_over_limit = serializers.BooleanField()
    recommendations = serializers.ListField()
