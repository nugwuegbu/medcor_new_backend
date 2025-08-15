"""
Serializers for tenant (hospital) management.
"""

from rest_framework import serializers
from .models import Hospital


class HospitalBasicSerializer(serializers.ModelSerializer):
    """Basic hospital serializer with essential fields only."""
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'subdomain', 'city', 'state', 'country',
            'hospital_type', 'is_active'
        ]
        read_only_fields = ['id']


class HospitalSerializer(serializers.ModelSerializer):
    """Full hospital serializer with all details."""
    
    users_count = serializers.IntegerField(read_only=True)
    doctors_count = serializers.IntegerField(read_only=True)
    patients_count = serializers.IntegerField(read_only=True)
    subscription_plan = serializers.CharField(
        source='subscriptions.first.plan.name', 
        read_only=True
    )
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'subdomain', 'registration_number',
            'email', 'phone_number', 'website',
            'address_line1', 'address_line2', 'city', 'state', 
            'country', 'postal_code',
            'hospital_type', 'bed_capacity', 'established_date',
            'description', 'logo', 'cover_image',
            'primary_color', 'secondary_color',
            'is_active', 'is_verified',
            'users_count', 'doctors_count', 'patients_count',
            'subscription_plan',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        """Get total users count for the hospital."""
        return obj.users.count()
    
    def get_doctors_count(self, obj):
        """Get doctors count for the hospital."""
        return obj.users.filter(role='DOCTOR').count()
    
    def get_patients_count(self, obj):
        """Get patients count for the hospital."""
        return obj.users.filter(role='PATIENT').count()


class HospitalCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new hospitals."""
    
    admin_email = serializers.EmailField(write_only=True, required=True)
    admin_password = serializers.CharField(write_only=True, min_length=8, required=True)
    admin_first_name = serializers.CharField(write_only=True, required=True)
    admin_last_name = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Hospital
        fields = [
            'name', 'subdomain', 'registration_number',
            'email', 'phone_number', 'website',
            'address_line1', 'address_line2', 'city', 'state',
            'country', 'postal_code',
            'hospital_type', 'bed_capacity',
            'admin_email', 'admin_password', 
            'admin_first_name', 'admin_last_name'
        ]
    
    def validate_subdomain(self, value):
        """Validate subdomain uniqueness and format."""
        if Hospital.objects.filter(subdomain=value).exists():
            raise serializers.ValidationError(
                f"Subdomain '{value}' is already taken."
            )
        
        # Validate subdomain format (alphanumeric and hyphens only)
        import re
        if not re.match(r'^[a-z0-9-]+$', value):
            raise serializers.ValidationError(
                "Subdomain can only contain lowercase letters, numbers, and hyphens."
            )
        
        return value
    
    def create(self, validated_data):
        """Create hospital and its admin user."""
        from core.models import User
        
        # Extract admin user data
        admin_data = {
            'email': validated_data.pop('admin_email'),
            'password': validated_data.pop('admin_password'),
            'first_name': validated_data.pop('admin_first_name'),
            'last_name': validated_data.pop('admin_last_name'),
        }
        
        # Create hospital
        hospital = Hospital.objects.create(**validated_data)
        
        # Create admin user for the hospital
        admin_user = User.objects.create_user(
            email=admin_data['email'],
            password=admin_data['password'],
            first_name=admin_data['first_name'],
            last_name=admin_data['last_name'],
            hospital=hospital,
            role='ADMIN',
            is_staff=True,
            is_verified=True
        )
        
        return hospital


class HospitalUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating hospital details."""
    
    class Meta:
        model = Hospital
        fields = [
            'name', 'email', 'phone_number', 'website',
            'address_line1', 'address_line2', 'city', 'state',
            'country', 'postal_code',
            'hospital_type', 'bed_capacity', 'description',
            'logo', 'cover_image',
            'primary_color', 'secondary_color'
        ]
    
    def validate(self, attrs):
        """Validate hospital update."""
        # Don't allow changing subdomain or registration number
        if 'subdomain' in attrs or 'registration_number' in attrs:
            raise serializers.ValidationError(
                "Cannot change subdomain or registration number."
            )
        return attrs