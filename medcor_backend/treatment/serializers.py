from rest_framework import serializers
from .models import Treatment


class TreatmentSerializer(serializers.ModelSerializer):
    """Serializer for Treatment model with full details."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'name',
            'image',
            'description',
            'cost',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant_name']


class TreatmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Treatment instances."""
    
    class Meta:
        model = Treatment
        fields = [
            'tenant',
            'name',
            'image',
            'description',
            'cost',
            'is_active'
        ]
        
    def validate_cost(self, value):
        """Validate cost is positive."""
        if value <= 0:
            raise serializers.ValidationError("Cost must be greater than 0.")
        return value
        
    def validate_name(self, value):
        """Validate name is not empty."""
        if not value.strip():
            raise serializers.ValidationError("Treatment name cannot be empty.")
        return value.strip()


class TreatmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Treatment instances."""
    
    class Meta:
        model = Treatment
        fields = [
            'name',
            'image',
            'description',
            'cost',
            'is_active'
        ]
        
    def validate_cost(self, value):
        """Validate cost is positive."""
        if value <= 0:
            raise serializers.ValidationError("Cost must be greater than 0.")
        return value
        
    def validate_name(self, value):
        """Validate name is not empty."""
        if not value.strip():
            raise serializers.ValidationError("Treatment name cannot be empty.")
        return value.strip()


class TreatmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing treatments."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id',
            'name',
            'cost',
            'tenant_name',
            'is_active',
            'created_at'
        ]