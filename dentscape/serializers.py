"""
Dentscape AI Serializers
"""

from rest_framework import serializers
from .models import DentscapeSimulation, DentscapeAnalysis, DentscapeHistory


class DentscapeSimulationSerializer(serializers.ModelSerializer):
    """Serializer for Dentscape Simulation requests and responses"""
    
    user_id = serializers.CharField(required=True, help_text="User ID for tracking purposes")
    
    class Meta:
        model = DentscapeSimulation
        fields = [
            'id', 'user_id', 'tracking_user_id', 'simulation_type', 'image', 'status',
            'raw_response', 'simulation_results', 'before_image_url', 'after_image_url',
            'error_message', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'status', 'raw_response', 'simulation_results',
            'before_image_url', 'after_image_url', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
    
    def validate_image(self, value):
        """Validate image file"""
        if not value:
            raise serializers.ValidationError("Image is required")
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be less than 10MB")
        
        # Check file format
        allowed_formats = ['JPEG', 'JPG', 'PNG']
        if value.image.format not in allowed_formats:
            raise serializers.ValidationError(f"Image format must be one of: {', '.join(allowed_formats)}")
        
        return value
    
    def validate_user_id(self, value):
        """Validate user_id is provided"""
        if not value or not value.strip():
            raise serializers.ValidationError("User ID is required for tracking purposes")
        return value.strip()


class DentscapeAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for Dentscape Analysis requests and responses"""
    
    user_id = serializers.CharField(required=True, help_text="User ID for tracking purposes")
    
    class Meta:
        model = DentscapeAnalysis
        fields = [
            'id', 'user_id', 'tracking_user_id', 'analysis_type', 'image', 'status',
            'raw_response', 'analysis_results', 'measurements', 'annotations_image_url',
            'error_message', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'status', 'raw_response', 'analysis_results',
            'measurements', 'annotations_image_url', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
    
    def validate_image(self, value):
        """Validate image file"""
        if not value:
            raise serializers.ValidationError("Image is required")
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be less than 10MB")
        
        # Check file format
        allowed_formats = ['JPEG', 'JPG', 'PNG']
        if value.image.format not in allowed_formats:
            raise serializers.ValidationError(f"Image format must be one of: {', '.join(allowed_formats)}")
        
        return value
    
    def validate_user_id(self, value):
        """Validate user_id is provided"""
        if not value or not value.strip():
            raise serializers.ValidationError("User ID is required for tracking purposes")
        return value.strip()


class DentscapeSimulationResponseSerializer(serializers.ModelSerializer):
    """Serializer for Dentscape Simulation responses"""
    
    class Meta:
        model = DentscapeSimulation
        fields = [
            'id', 'tracking_user_id', 'simulation_type', 'status',
            'simulation_results', 'before_image_url', 'after_image_url',
            'error_message', 'created_at', 'completed_at'
        ]


class DentscapeAnalysisResponseSerializer(serializers.ModelSerializer):
    """Serializer for Dentscape Analysis responses"""
    
    class Meta:
        model = DentscapeAnalysis
        fields = [
            'id', 'tracking_user_id', 'analysis_type', 'status',
            'analysis_results', 'measurements', 'annotations_image_url',
            'error_message', 'created_at', 'completed_at'
        ]


class DentscapeHistorySerializer(serializers.ModelSerializer):
    """Serializer for Dentscape History"""
    
    simulation = DentscapeSimulationResponseSerializer(read_only=True)
    analysis = DentscapeAnalysisResponseSerializer(read_only=True)
    
    class Meta:
        model = DentscapeHistory
        fields = [
            'id', 'tracking_user_id', 'simulation', 'analysis',
            'viewed_at', 'feedback_rating', 'feedback_comment'
        ]
        read_only_fields = ['id', 'viewed_at']


class SimulationRequestSerializer(serializers.Serializer):
    """Serializer for simulation request validation"""
    
    user_id = serializers.CharField(required=True, help_text="User ID for tracking purposes")
    image = serializers.ImageField(required=True, help_text="Dental image for simulation")
    
    def validate_user_id(self, value):
        """Validate user_id is provided"""
        if not value or not value.strip():
            raise serializers.ValidationError("User ID is required for tracking purposes")
        return value.strip()


class AnalysisRequestSerializer(serializers.Serializer):
    """Serializer for analysis request validation"""
    
    user_id = serializers.CharField(required=True, help_text="User ID for tracking purposes")
    image = serializers.ImageField(required=True, help_text="Dental image for analysis")
    
    def validate_user_id(self, value):
        """Validate user_id is provided"""
        if not value or not value.strip():
            raise serializers.ValidationError("User ID is required for tracking purposes")
        return value.strip()
