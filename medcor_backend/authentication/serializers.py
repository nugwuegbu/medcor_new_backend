from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .authentication import PasswordManager, JWTManager
import re

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'phone_number', 'role',
            'profile_picture', 'preferred_language', 'face_login_enabled',
            'face_registered', 'is_new_user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required")
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        
        if not PasswordManager.verify_password(password, user.password):
            raise serializers.ValidationError("Invalid credentials")
        
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled")
        
        attrs['user'] = user
        return attrs


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'name', 'phone_number', 'password', 
            'confirm_password', 'role', 'preferred_language'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness and format."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists")
        
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters")
        
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        
        # Check for uppercase, lowercase, digit, and special character
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one digit")
        
        if not re.search(r'[@$!%*?&]', value):
            raise serializers.ValidationError("Password must contain at least one special character")
        
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError("Passwords don't match")
        
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password."""
        # Remove confirm_password from validated_data
        validated_data.pop('confirm_password', None)
        
        # Hash password
        password = validated_data.pop('password')
        hashed_password = PasswordManager.hash_password(password)
        
        # Create user
        user = User.objects.create(
            password=hashed_password,
            **validated_data
        )
        
        return user


class FaceLoginSerializer(serializers.Serializer):
    """Serializer for face recognition login."""
    
    face_data = serializers.CharField(help_text="Base64 encoded face image")
    session_id = serializers.CharField(required=False)
    
    def validate_face_data(self, value):
        """Validate face data format."""
        if not value:
            raise serializers.ValidationError("Face data is required")
        return value


class RegisterFaceSerializer(serializers.Serializer):
    """Serializer for face registration."""
    
    face_data = serializers.CharField(help_text="Base64 encoded face image")
    
    def validate_face_data(self, value):
        """Validate face data format."""
        if not value:
            raise serializers.ValidationError("Face data is required")
        return value


class UpdatePhoneSerializer(serializers.Serializer):
    """Serializer for updating phone number."""
    
    phone_number = serializers.CharField(max_length=20)
    
    def validate_phone_number(self, value):
        """Validate phone number format."""
        if not value:
            raise serializers.ValidationError("Phone number is required")
        return value