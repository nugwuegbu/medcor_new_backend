from rest_framework import serializers
from django.db.models import Count
from core.models import ChatMessage, HairAnalysisReport, FaceAnalysisReport
from api.models import AnalysisTracking


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatMessage model."""

    user_name = serializers.CharField(source='user.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'session_id', 'user', 'user_name', 'message', 'response',
            'avatar_response', 'language', 'speaker_type', 'doctor',
            'doctor_name', 'face_recognition_data', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for creating chat messages."""

    class Meta:
        model = ChatMessage
        fields = [
            'session_id', 'user', 'message', 'response', 'avatar_response',
            'language', 'speaker_type', 'doctor', 'face_recognition_data'
        ]


class HairAnalysisReportSerializer(serializers.ModelSerializer):
    """Serializer for HairAnalysisReport model."""

    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = HairAnalysisReport
        fields = [
            'id', 'session_id', 'user', 'user_name', 'hair_type',
            'hair_condition', 'scalp_health', 'recommendations', 'confidence',
            'analysis_result', 'image_hash', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateHairAnalysisReportSerializer(serializers.ModelSerializer):
    """Serializer for creating hair analysis reports."""

    class Meta:
        model = HairAnalysisReport
        fields = [
            'session_id', 'user', 'hair_type', 'hair_condition',
            'scalp_health', 'recommendations', 'confidence', 'analysis_result',
            'image_hash'
        ]


class FaceAnalysisReportSerializer(serializers.ModelSerializer):
    """Serializer for FaceAnalysisReport model."""

    class Meta:
        model = FaceAnalysisReport
        fields = [
            'id', 'patient_name', 'patient_email', 'patient_phone',
            'patient_job', 'analysis_result', 'pdf_path', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateFaceAnalysisReportSerializer(serializers.ModelSerializer):
    """Serializer for creating face analysis reports."""

    class Meta:
        model = FaceAnalysisReport
        fields = [
            'patient_name', 'patient_email', 'patient_phone', 'patient_job',
            'analysis_result', 'pdf_path'
        ]


class WeatherRequestSerializer(serializers.Serializer):
    """Serializer for weather request."""

    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)

    def validate(self, attrs):
        """Validate that both coordinates are provided together."""
        lat = attrs.get('latitude')
        lon = attrs.get('longitude')

        if (lat is None) != (lon is None):
            raise serializers.ValidationError(
                "Both latitude and longitude must be provided together")

        return attrs


class AdminStatsSerializer(serializers.Serializer):
    """Serializer for admin statistics."""

    total_patients = serializers.IntegerField()
    total_doctors = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    recent_registrations = serializers.IntegerField()

    def to_representation(self, instance):
        """Convert the data to the expected format."""
        return {
            'totalPatients': instance.get('total_patients', 0),
            'totalDoctors': instance.get('total_doctors', 0),
            'totalAppointments': instance.get('total_appointments', 0),
            'pendingAppointments': instance.get('pending_appointments', 0),
            'recentRegistrations': instance.get('recent_registrations', 0)
        }


class AnalysisTrackingSerializer(serializers.ModelSerializer):
    """Serializer for AnalysisTracking model."""
    
    patient_email = serializers.EmailField(source='patient.email', read_only=True, allow_null=True)
    
    class Meta:
        model = AnalysisTracking
        fields = [
            'id', 'patient', 'patient_email', 'tenant_id',
            'session_id', 'analysis_type', 'widget_location', 
            'created_at', 'metadata'
        ]
        read_only_fields = ['id', 'created_at', 'patient_email']


class CreateAnalysisTrackingSerializer(serializers.Serializer):
    """Serializer for creating analysis tracking records."""
    
    patientId = serializers.IntegerField(required=False, allow_null=True)
    tenantId = serializers.IntegerField(required=False, allow_null=True)
    sessionId = serializers.CharField(max_length=255)
    analysisType = serializers.ChoiceField(choices=['face', 'hair', 'lips', 'skin', 'hair_extension'])
    widgetLocation = serializers.CharField(max_length=50, default='chat_widget')
    metadata = serializers.JSONField(required=False, allow_null=True)


class AnalysisTrackingStatsSerializer(serializers.Serializer):
    """Serializer for analysis tracking statistics."""
    
    face = serializers.IntegerField()
    hair = serializers.IntegerField()
    lips = serializers.IntegerField()
    skin = serializers.IntegerField()
    hair_extension = serializers.IntegerField()
    total = serializers.IntegerField()
