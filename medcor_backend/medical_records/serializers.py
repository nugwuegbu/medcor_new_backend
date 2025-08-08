from rest_framework import serializers
from .models import MedicalRecord, MedicalRecordFile
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

class MedicalRecordFileSerializer(serializers.ModelSerializer):
    """Serializer for medical record file uploads"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecordFile
        fields = ['id', 'file', 'file_name', 'file_size', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'file_name', 'file_size', 'uploaded_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class MedicalRecordSerializer(serializers.ModelSerializer):
    record_id = serializers.ReadOnlyField()
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_details = SimpleUserSerializer(source='patient', read_only=True)
    files = MedicalRecordFileSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'record_id', 'patient', 'patient_name', 'patient_details',
            'date', 'diagnosis', 'files', 'uploaded_files', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'record_id', 'created_at', 'updated_at']
    
    def validate_patient(self, value):
        """Ensure the patient has the 'patient' role"""
        if value.role != 'patient':
            raise serializers.ValidationError("Selected user must be a patient")
        return value
    
    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        medical_record = MedicalRecord.objects.create(**validated_data)
        
        # Create file records for uploaded files
        for file in uploaded_files:
            MedicalRecordFile.objects.create(
                medical_record=medical_record,
                file=file
            )
        
        return medical_record
    
    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        
        # Update the medical record
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Add new files if any
        for file in uploaded_files:
            MedicalRecordFile.objects.create(
                medical_record=instance,
                file=file
            )
        
        return instance

class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating medical records"""
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = MedicalRecord
        fields = ['patient', 'date', 'diagnosis', 'uploaded_files']
    
    def validate_patient(self, value):
        """Ensure the patient has the 'patient' role"""
        if value.role != 'patient':
            raise serializers.ValidationError("Selected user must be a patient")
        return value
    
    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        medical_record = MedicalRecord.objects.create(**validated_data)
        
        # Create file records for uploaded files
        for file in uploaded_files:
            MedicalRecordFile.objects.create(
                medical_record=medical_record,
                file=file
            )
        
        return medical_record

class MedicalRecordUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating medical records"""
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = MedicalRecord
        fields = ['date', 'diagnosis', 'uploaded_files']
    
    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        
        # Update the medical record
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Add new files if any
        for file in uploaded_files:
            MedicalRecordFile.objects.create(
                medical_record=instance,
                file=file
            )
        
        return instance