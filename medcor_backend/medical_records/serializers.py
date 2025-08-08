from rest_framework import serializers
from .models import MedicalRecord
from tenants.models import User

class SimpleUserSerializer(serializers.ModelSerializer):
    """Simple serializer for User model"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class MedicalRecordSerializer(serializers.ModelSerializer):
    record_id = serializers.ReadOnlyField()
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_details = SimpleUserSerializer(source='patient', read_only=True)
    doctor_details = SimpleUserSerializer(source='doctor', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'record_id', 'patient', 'patient_name', 'patient_details',
            'date', 'diagnosis', 'type', 'doctor', 'doctor_name', 
            'doctor_details', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'record_id', 'created_at', 'updated_at']
    
    def validate_patient(self, value):
        """Ensure the patient has the 'patient' role"""
        if value.role != 'patient':
            raise serializers.ValidationError("Selected user must be a patient")
        return value
    
    def validate_doctor(self, value):
        """Ensure the doctor has the 'doctor' role if provided"""
        if value and value.role != 'doctor':
            raise serializers.ValidationError("Selected user must be a doctor")
        return value

class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating medical records"""
    class Meta:
        model = MedicalRecord
        fields = ['patient', 'date', 'diagnosis', 'type', 'doctor', 'status']
    
    def validate_patient(self, value):
        """Ensure the patient has the 'patient' role"""
        if value.role != 'patient':
            raise serializers.ValidationError("Selected user must be a patient")
        return value
    
    def validate_doctor(self, value):
        """Ensure the doctor has the 'doctor' role if provided"""
        if value and value.role != 'doctor':
            raise serializers.ValidationError("Selected user must be a doctor")
        return value

class MedicalRecordUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating medical records"""
    class Meta:
        model = MedicalRecord
        fields = ['date', 'diagnosis', 'type', 'doctor', 'status']
        
    def validate_doctor(self, value):
        """Ensure the doctor has the 'doctor' role if provided"""
        if value and value.role != 'doctor':
            raise serializers.ValidationError("Selected user must be a doctor")
        return value