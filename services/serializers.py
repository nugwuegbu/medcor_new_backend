"""
Serializers for Services app
"""
from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Service model with hospital details
    """
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.UUIDField(source='hospital.id', read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id',
            'hospital',
            'hospital_id',
            'hospital_name',
            'service_name',
            'price',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_service_name(self, value):
        """Validate service name is not empty and has reasonable length"""
        if not value or not value.strip():
            raise serializers.ValidationError("Service name cannot be empty.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Service name must be at least 2 characters long.")
        if len(value.strip()) > 200:
            raise serializers.ValidationError("Service name cannot exceed 200 characters.")
        return value.strip()
    
    def validate_hospital(self, value):
        """Validate hospital exists and is accessible"""
        if not value:
            raise serializers.ValidationError("Hospital is required.")
        return value
    
    def validate_price(self, value):
        """Validate price is non-negative"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value
