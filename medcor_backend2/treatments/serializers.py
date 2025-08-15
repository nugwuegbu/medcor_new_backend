"""
Serializers for Treatment models.
"""

from rest_framework import serializers
from .models import Treatment, Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    """Serializer for Prescription model."""
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'treatment', 'medication_name', 'generic_name', 'brand_name',
            'dosage', 'dosage_unit', 'frequency', 'route', 'duration_days',
            'quantity_prescribed', 'quantity_unit', 'refills_allowed', 'refills_used',
            'instructions', 'take_with_food', 'start_date', 'end_date',
            'pharmacy_name', 'pharmacy_phone', 'is_active', 'is_dispensed', 
            'dispensed_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TreatmentSerializer(serializers.ModelSerializer):
    """Serializer for Treatment model."""
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    prescribed_by_name = serializers.CharField(source='prescribed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id', 'hospital', 'patient', 'patient_name', 'prescribed_by',
            'prescribed_by_name', 'treatment_type', 'name', 'description',
            'start_date', 'end_date', 'status', 'instructions', 'frequency',
            'dosage', 'duration', 'side_effects', 'warnings', 'appointment',
            'medical_record', 'created_at', 'updated_at', 'completed_at',
            'metadata', 'prescriptions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'patient_name', 'prescribed_by_name']
    
    def validate(self, data):
        """Validate treatment data."""
        if 'end_date' in data and 'start_date' in data:
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError("End date must be after start date")
        return data


class TreatmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for treatment listings."""
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    prescribed_by_name = serializers.CharField(source='prescribed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id', 'patient_name', 'prescribed_by_name', 'treatment_type',
            'name', 'start_date', 'status', 'created_at'
        ]
        read_only_fields = fields


class CreateTreatmentSerializer(serializers.ModelSerializer):
    """Serializer for creating treatments with prescriptions."""
    prescriptions = PrescriptionSerializer(many=True, required=False)
    
    class Meta:
        model = Treatment
        fields = [
            'hospital', 'patient', 'prescribed_by', 'treatment_type',
            'name', 'description', 'start_date', 'end_date', 'status',
            'instructions', 'frequency', 'dosage', 'duration',
            'side_effects', 'warnings', 'appointment', 'medical_record',
            'metadata', 'prescriptions'
        ]
    
    def create(self, validated_data):
        """Create treatment with prescriptions."""
        prescriptions_data = validated_data.pop('prescriptions', [])
        treatment = Treatment.objects.create(**validated_data)
        
        for prescription_data in prescriptions_data:
            Prescription.objects.create(treatment=treatment, **prescription_data)
        
        return treatment
    
    def update(self, instance, validated_data):
        """Update treatment and handle prescriptions."""
        prescriptions_data = validated_data.pop('prescriptions', None)
        
        # Update treatment fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle prescriptions if provided
        if prescriptions_data is not None:
            # Delete existing prescriptions and create new ones
            instance.prescriptions.all().delete()
            for prescription_data in prescriptions_data:
                Prescription.objects.create(treatment=instance, **prescription_data)
        
        return instance