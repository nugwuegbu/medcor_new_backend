"""
Serializers for core user authentication and management.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from tenants.models import Hospital
from tenants.serializers import HospitalBasicSerializer


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with hospital details."""
    
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_details = HospitalBasicSerializer(source='hospital', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone_number', 'date_of_birth', 'gender', 'role',
            'hospital', 'hospital_name', 'hospital_details', 'department', 'specialization',
            'is_active', 'is_verified', 'created_at', 'updated_at',
            'profile_picture', 'bio', 'preferred_language', 'timezone'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'hospital_name', 'hospital_details']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users with hospital selection."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(is_active=True),
        required=True,
        help_text="Select the hospital this user belongs to"
    )
    available_hospitals = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'role',
            'hospital', 'department', 'specialization', 'available_hospitals'
        ]
    
    def get_available_hospitals(self, obj):
        """Return list of available hospitals for selection."""
        hospitals = Hospital.objects.filter(is_active=True).values('id', 'name', 'city', 'state')
        return list(hospitals)
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        attrs.pop('password_confirm')
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password."""
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate password change."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class DoctorSerializer(UserSerializer):
    """Serializer for doctor users."""
    
    appointments_count = serializers.IntegerField(read_only=True)
    patients_count = serializers.IntegerField(read_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'license_number', 'years_of_experience',
            'appointments_count', 'patients_count'
        ]


class PatientSerializer(UserSerializer):
    """Serializer for patient users."""
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'blood_type', 'allergies', 'medical_conditions',
            'current_medications', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship'
        ]