"""
Serializers for the email service app.
"""

from rest_framework import serializers
from .models import EmailRequest


class EmailRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating email requests."""
    
    class Meta:
        model = EmailRequest
        fields = [
            'full_name', 'email', 'phone', 'job_profession',
            'subject', 'message', 'file_attached'
        ]
        extra_kwargs = {
            'full_name': {'required': False, 'allow_blank': True},
        }
    
    def validate_email(self, value):
        """Validate email format."""
        if not value:
            raise serializers.ValidationError("Email is required.")
        return value
    
    def validate_full_name(self, value):
        """Allow blank full name; enforce basic sanity only if provided."""
        if value is not None:
            value = value.strip()
            if value and len(value) < 2:
                raise serializers.ValidationError("If provided, full name must be at least 2 characters.")
        return value
    
    def validate_phone(self, value):
        """Validate phone number format."""
        if value:
            # Remove common separators and check if it's numeric
            cleaned_phone = value.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
            if not cleaned_phone.isdigit() or len(cleaned_phone) < 10:
                raise serializers.ValidationError("Please enter a valid phone number.")
        return value


class EmailRequestDetailSerializer(serializers.ModelSerializer):
    """Serializer for viewing email request details."""
    
    has_attachment = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    can_retry = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = EmailRequest
        fields = [
            'id', 'full_name', 'email', 'phone', 'job_profession',
            'subject', 'message', 'file_attached', 'has_attachment',
            'status', 'error_message', 'retry_count', 'max_retries',
            'is_completed', 'can_retry', 'created_at', 'updated_at', 'sent_at'
        ]
        read_only_fields = [
            'id', 'status', 'error_message', 'retry_count', 'max_retries',
            'has_attachment', 'is_completed', 'can_retry', 'created_at', 'updated_at', 'sent_at'
        ]


class EmailRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing email requests."""
    
    has_attachment = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = EmailRequest
        fields = [
            'id', 'full_name', 'email', 'phone', 'job_profession',
            'subject', 'status', 'has_attachment', 'is_completed',
            'created_at', 'sent_at'
        ]
        read_only_fields = fields 