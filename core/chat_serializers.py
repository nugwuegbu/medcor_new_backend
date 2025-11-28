"""
Serializers for chat, voice, and avatar-related models.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .chat_models import (
    AnalysisReport,
    AvatarRecording,
    ChatMessage,
    ChatSession,
    ConsentRecord,
    FaceRecognition,
    UserProfile,
)

User = get_user_model()


class ChatSessionSerializer(serializers.ModelSerializer):
    """Chat session serializer."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "session_id",
            "user",
            "user_email",
            "hospital",
            "hospital_name",
            "language",
            "conversation_state",
            "location_weather",
            "avatar_session_id",
            "avatar_status",
            "created_at",
            "updated_at",
            "last_activity",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    """Chat message serializer."""

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "session",
            "message",
            "response",
            "voice_command",
            "avatar_response",
            "language",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]


class VoiceChatSerializer(serializers.Serializer):
    """Voice chat request serializer."""

    message = serializers.CharField(required=True)
    session_id = serializers.CharField(required=True)
    language = serializers.CharField(default="en")
    user_id = serializers.UUIDField(required=False, allow_null=True)
    user_image = serializers.CharField(required=False, allow_blank=True)
    location_weather = serializers.CharField(required=False, allow_blank=True)
    conversation_state = serializers.JSONField(required=False, default=dict)


class TextChatSerializer(serializers.Serializer):
    """Text chat request serializer."""

    message = serializers.CharField(required=True)
    session_id = serializers.CharField(required=True)
    language = serializers.CharField(default="en")
    use_avatar = serializers.BooleanField(default=False)
    history_limit = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=50,
        required=False,
        help_text="Number of previous messages to include in conversation context (1-50)"
    )


class FaceRecognitionSerializer(serializers.ModelSerializer):
    """Face recognition serializer."""

    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = FaceRecognition
        fields = [
            "id",
            "user",
            "user_email",
            "face_id",
            "confidence_threshold",
            "last_recognized",
            "recognition_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "face_id",
            "created_at",
            "updated_at",
            "last_recognized",
            "recognition_count",
        ]


class FaceRecognizeSerializer(serializers.Serializer):
    """Face recognition request serializer."""

    image_base64 = serializers.CharField(required=True)
    session_id = serializers.CharField(required=True)


class FaceRegisterSerializer(serializers.Serializer):
    """Face registration request serializer."""

    image_base64 = serializers.CharField(required=True)
    user_id = serializers.UUIDField(required=True)
    preferred_language = serializers.CharField(default="en")


class AvatarRecordingSerializer(serializers.ModelSerializer):
    """Avatar recording serializer."""

    class Meta:
        model = AvatarRecording
        fields = [
            "id",
            "session",
            "recording_id",
            "file_url",
            "duration",
            "status",
            "created_at",
            "completed_at",
        ]
        read_only_fields = ["id", "created_at"]


class AnalysisReportSerializer(serializers.ModelSerializer):
    """Analysis report serializer."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    class Meta:
        model = AnalysisReport
        fields = [
            "id",
            "user",
            "user_email",
            "hospital",
            "hospital_name",
            "report_type",
            "analysis_data",
            "recommendations",
            "pdf_url",
            "patient_name",
            "patient_email",
            "patient_phone",
            "patient_job",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "pdf_url"]


class ConsentRecordSerializer(serializers.ModelSerializer):
    """Consent record serializer."""

    user_email = serializers.EmailField(
        source="user.email", read_only=True, allow_null=True
    )

    class Meta:
        model = ConsentRecord
        fields = [
            "id",
            "user",
            "user_email",
            "session_id",
            "accepted_terms",
            "accepted_privacy",
            "accepted_disclaimer",
            "version",
            "user_agent",
            "ip_address",
            "granted_at",
            "revoked_at",
            "is_active",
        ]
        read_only_fields = ["id", "granted_at", "revoked_at"]


class ConsentRecordRequestSerializer(serializers.Serializer):
    """Consent record request serializer."""

    accepted_terms = serializers.BooleanField(required=True)
    accepted_privacy = serializers.BooleanField(required=True)
    accepted_disclaimer = serializers.BooleanField(required=True)
    version = serializers.CharField(required=True)
    user_agent = serializers.CharField(required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(required=False)


class SpeechToTextSerializer(serializers.Serializer):
    """Speech to text request serializer."""

    audio = serializers.CharField(required=True)  # Base64 encoded audio
    language = serializers.CharField(required=False, allow_blank=True)


class TextToSpeechSerializer(serializers.Serializer):
    """Text to speech request serializer."""

    text = serializers.CharField(required=True)
    voice_id = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(default="en")


class LocationWeatherSerializer(serializers.Serializer):
    """Location weather request serializer."""

    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile."""
    
    collected_fields = serializers.SerializerMethodField()
    is_complete = serializers.SerializerMethodField()
    session_id = serializers.CharField(source="session.session_id", read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "session",
            "session_id",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "date_of_birth",
            "gender",
            "location",
            "occupation",
            "preferences",
            "interests",
            "concerns",
            "data_quality",
            "consent_given",
            "consent_timestamp",
            "consent_version",
            "collected_fields",
            "is_complete",
            "created_at",
            "updated_at",
            "last_verified",
        ]
        read_only_fields = [
            "id",
            "session",
            "collected_fields",
            "is_complete",
            "created_at",
            "updated_at",
        ]
    
    def get_collected_fields(self, obj):
        """Return list of fields that have been collected."""
        return obj.get_collected_fields()
    
    def get_is_complete(self, obj):
        """Check if profile is complete."""
        return obj.is_complete()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating UserProfile (partial updates)."""
    
    class Meta:
        model = UserProfile
        fields = [
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "date_of_birth",
            "gender",
            "location",
            "occupation",
            "preferences",
            "interests",
            "concerns",
            "consent_given",
            "consent_version",
        ]
    
    def validate_email(self, value):
        """Validate email format."""
        if value:
            from core.pii_service import PIIValidator
            validator = PIIValidator()
            is_valid, error = validator.validate_email(value)
            if not is_valid:
                raise serializers.ValidationError(error)
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number format."""
        if value:
            from core.pii_service import PIIValidator
            validator = PIIValidator()
            is_valid, error = validator.validate_phone(value)
            if not is_valid:
                raise serializers.ValidationError(error)
        return value
