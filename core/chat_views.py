"""
Views for chat, voice, avatar, and related APIs.
"""

import asyncio
import base64
import json
import logging
from io import BytesIO

from asgiref.sync import async_to_sync, sync_to_async
from django.contrib.auth import authenticate, login
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .chat_models import (AnalysisReport, AvatarRecording, ChatMessage,
                          ChatSession, ConsentRecord, FaceRecognition)
from .chat_serializers import (AnalysisReportSerializer,
                               AvatarRecordingSerializer,
                               ChatMessageSerializer, ChatSessionSerializer,
                               ConsentRecordRequestSerializer,
                               ConsentRecordSerializer,
                               FaceRecognitionSerializer,
                               FaceRecognizeSerializer, FaceRegisterSerializer,
                               LocationWeatherSerializer,
                               SpeechToTextSerializer, TextChatSerializer,
                               TextToSpeechSerializer, VoiceChatSerializer)
from .models import User
from .serializers import UserSerializer
from .services import (FaceRecognitionService, HeyGenService, OpenAIService,
                       SpeechToTextService, TextToSpeechService,
                       VoiceConversationManager, WeatherService)

logger = logging.getLogger(__name__)

# Initialize services
openai_service = OpenAIService()
heygen_service = HeyGenService()
face_recognition_service = FaceRecognitionService()
tts_service = TextToSpeechService()
stt_service = SpeechToTextService()
weather_service = WeatherService()
voice_manager = VoiceConversationManager()


# 1. Voice & Chat APIs
class VoiceChatView(APIView):
    """Voice chat endpoint with all features."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Process voice chat message."""
        serializer = VoiceChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            # Get default hospital for anonymous users
            from tenants.models import Hospital

            default_hospital = None
            if request.user.is_authenticated:
                # For authenticated users, use their hospital if available
                if hasattr(request.user, "hospital"):
                    default_hospital = request.user.hospital

            if not default_hospital:
                # Get or create a default hospital for testing
                default_hospital, _ = Hospital.objects.get_or_create(
                    subdomain="default",
                    defaults={
                        "name": "Default Hospital",
                        "registration_number": "DEFAULT-001",
                        "email": "default@medcor.ai",
                        "phone_number": "+1234567890",
                        "address_line1": "123 Default St",
                        "city": "Default City",
                        "state": "Default State",
                        "country": "USA",
                        "postal_code": "12345",
                    },
                )

            # Get or create chat session
            session, created = ChatSession.objects.get_or_create(
                session_id=data["session_id"],
                defaults={
                    "user": request.user if request.user.is_authenticated else None,
                    "hospital": default_hospital,
                    "language": data.get("language", "en"),
                    "location_weather": data.get("location_weather", ""),
                },
            )

            # Update session if needed
            if data.get("location_weather"):
                session.location_weather = data["location_weather"]
            session.last_activity = timezone.now()
            session.save()

            # Check if this is first user response
            is_first_response = (
                not ChatMessage.objects.filter(session=session, message__isnull=False)
                .exclude(message="")
                .exists()
            )

            # Analyze user image if provided
            compliment = ""
            if data.get("user_image"):
                compliment = async_to_sync(openai_service.analyze_user_image)(
                    data["user_image"]
                )

            # Process voice conversation
            voice_response = async_to_sync(voice_manager.process_voice_input)(
                data["message"], data["session_id"], data.get("conversation_state", {})
            )

            # Build AI response
            ai_response = voice_response.get("message", "")

            # Add weather and compliment to first response
            if is_first_response:
                prefix = ""
                if data.get("location_weather"):
                    prefix += f"So your location is {data['location_weather']} "
                if compliment:
                    prefix += f"{compliment} "
                if prefix and "VOICE_FLOW" not in voice_response.get("action", ""):
                    ai_response = f"{prefix}{ai_response}"

            # Generate avatar response
            avatar_response = async_to_sync(heygen_service.generate_avatar_response)(
                ai_response, data["session_id"], data.get("language", "en")
            )

            # Save chat message
            ChatMessage.objects.create(
                session=session,
                message=data["message"],
                response=ai_response,
                voice_command=voice_response,
                avatar_response=avatar_response,
                language=data.get("language", "en"),
            )

            # Update conversation state
            session.conversation_state = voice_response.get("conversation_state", {})
            session.save()

            return Response(
                {
                    "message": ai_response,
                    "avatarResponse": avatar_response,
                    "sessionId": data["session_id"],
                    "success": True,
                    "conversationState": voice_response.get("conversation_state", {}),
                    "voiceCommand": voice_response,
                }
            )

        except Exception as e:
            logger.error(f"Voice chat error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TextChatView(APIView):
    """Text chat endpoint."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Process text chat message."""
        serializer = TextChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            # Get default hospital for anonymous users
            from tenants.models import Hospital

            default_hospital = None
            if request.user.is_authenticated:
                # For authenticated users, use their hospital if available
                if hasattr(request.user, "hospital"):
                    default_hospital = request.user.hospital

            if not default_hospital:
                # Get or create a default hospital for testing
                default_hospital, _ = Hospital.objects.get_or_create(
                    subdomain="default",
                    defaults={
                        "name": "Default Hospital",
                        "registration_number": "DEFAULT-001",
                        "email": "default@medcor.ai",
                        "phone_number": "+1234567890",
                        "address_line1": "123 Default St",
                        "city": "Default City",
                        "state": "Default State",
                        "country": "USA",
                        "postal_code": "12345",
                    },
                )

            # Get or create chat session
            session, created = ChatSession.objects.get_or_create(
                session_id=data["session_id"],
                defaults={
                    "user": request.user if request.user.is_authenticated else None,
                    "hospital": default_hospital,
                    "language": data.get("language", "en"),
                },
            )

            # Generate AI response
            response_text = async_to_sync(openai_service.generate_chat_response)(
                data["message"], data.get("language", "en")
            )

            # Generate avatar response if requested
            avatar_response = None
            if data.get("use_avatar"):
                avatar_response = async_to_sync(
                    heygen_service.generate_avatar_response
                )(response_text, data["session_id"], data.get("language", "en"))

            # Save chat message
            message = ChatMessage.objects.create(
                session=session,
                message=data["message"],
                response=response_text,
                avatar_response=avatar_response,
                language=data.get("language", "en"),
            )

            return Response(
                {
                    "response": response_text,
                    "messageId": str(message.id),
                    "avatar": avatar_response,
                    "language": data.get("language", "en"),
                }
            )

        except Exception as e:
            logger.error(f"Text chat error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 2. Speech Processing APIs
class SpeechToTextView(APIView):
    """Speech to text conversion."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Convert speech to text."""
        serializer = SpeechToTextSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            result = async_to_sync(stt_service.transcribe_audio)(
                data["audio"], data.get("language")
            )
            return Response(result)

        except Exception as e:
            logger.error(f"STT error: {e}")
            return Response(
                {"error": str(e), "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TextToSpeechView(APIView):
    """Text to speech conversion."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Convert text to speech."""
        serializer = TextToSpeechSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            audio_data = async_to_sync(tts_service.convert_text_to_speech)(
                data["text"], data.get("voice_id"), data.get("language", "en")
            )

            # Return audio as base64
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            return Response({"audio": audio_base64, "success": True})

        except Exception as e:
            logger.error(f"TTS error: {e}")
            return Response(
                {"error": str(e), "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AvatarSpeechToTextView(APIView):
    """Avatar-specific speech to text."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Convert avatar speech to text."""
        # Similar to SpeechToTextView but with avatar-specific processing
        return SpeechToTextView().post(request)


# 3. Avatar Management APIs
class AvatarStatusView(APIView):
    """Get avatar session status."""

    permission_classes = [AllowAny]

    def get(self, request, session_id):
        """Get avatar status."""
        try:
            status_data = async_to_sync(heygen_service.get_avatar_status)(session_id)
            return Response(status_data)

        except Exception as e:
            logger.error(f"Avatar status error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AvatarCreateSessionView(APIView):
    """Create avatar session."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Create new avatar session."""
        session_id = request.data.get("session_id", "")
        if not session_id:
            return Response(
                {"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = async_to_sync(heygen_service.create_avatar_session)(session_id)

            # Update chat session with avatar info
            if result.get("success"):
                ChatSession.objects.filter(session_id=session_id).update(
                    avatar_session_id=session_id, avatar_status="active"
                )

            return Response(result)

        except Exception as e:
            logger.error(f"Avatar session creation error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AvatarStartRecordingView(APIView):
    """Start avatar recording."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Start recording."""
        session_id = request.data.get("session_id", "")
        recording_id = request.data.get("recording_id", "")

        if not session_id or not recording_id:
            return Response(
                {"error": "session_id and recording_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Create recording record
            session = ChatSession.objects.get(session_id=session_id)
            recording = AvatarRecording.objects.create(
                session=session, recording_id=recording_id, status="recording"
            )

            return Response({"success": True, "recording_id": recording_id})

        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Start recording error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AvatarStopRecordingView(APIView):
    """Stop avatar recording."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Stop recording."""
        recording_id = request.data.get("recording_id", "")
        file_url = request.data.get("file_url", "")
        duration = request.data.get("duration")

        if not recording_id:
            return Response(
                {"error": "recording_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Update recording record
            recording = AvatarRecording.objects.get(recording_id=recording_id)
            recording.status = "completed"
            recording.file_url = file_url
            recording.duration = duration
            recording.completed_at = timezone.now()
            recording.save()

            return Response(
                {"success": True, "recording_id": recording_id, "file_url": file_url}
            )

        except AvatarRecording.DoesNotExist:
            return Response(
                {"error": "Recording not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Stop recording error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 4. Face Recognition APIs
class FaceRecognizeView(APIView):
    """Face recognition endpoint."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Recognize face from image."""
        serializer = FaceRecognizeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            result = async_to_sync(face_recognition_service.recognize_face)(
                data["image_base64"], data["session_id"]
            )

            # If recognized, update recognition count
            if result.get("recognized") and result.get("user_id"):
                try:
                    face_rec = FaceRecognition.objects.get(user_id=result["user_id"])
                    face_rec.last_recognized = timezone.now()
                    face_rec.recognition_count += 1
                    face_rec.save()

                    # Get user profile
                    user = User.objects.get(id=result["user_id"])
                    result["profile"] = UserSerializer(user).data
                    result["preferredLanguage"] = user.preferred_language

                except (FaceRecognition.DoesNotExist, User.DoesNotExist):
                    pass

            return Response(result)

        except Exception as e:
            logger.error(f"Face recognition error: {e}")
            return Response(
                {"error": str(e), "recognized": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FaceRegisterView(APIView):
    """Face registration endpoint."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Register face for user."""
        serializer = FaceRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            result = async_to_sync(face_recognition_service.register_face)(
                data["image_base64"],
                data["user_id"],
                data.get("preferred_language", "en"),
            )

            if result.get("success"):
                # Save face recognition data
                user = User.objects.get(id=data["user_id"])
                FaceRecognition.objects.update_or_create(
                    user=user,
                    defaults={
                        "face_encoding": data["image_base64"][
                            :100
                        ],  # Store partial for demo
                        "face_id": result["face_id"],
                    },
                )

                # Update user's preferred language
                user.preferred_language = data.get("preferred_language", "en")
                user.save()

            return Response(result)

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Face registration error: {e}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FaceLoginView(APIView):
    """Face recognition login."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Login using face recognition."""
        image_base64 = request.data.get("imageBase64", "")
        session_id = request.data.get("sessionId", "")

        if not image_base64 or not session_id:
            return Response(
                {"message": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Recognize face
            result = async_to_sync(face_recognition_service.recognize_face)(
                image_base64, session_id
            )

            if result.get("recognized") and result.get("user_id"):
                # Get user and log them in
                try:
                    user = User.objects.get(id=result["user_id"])
                    login(request, user)

                    return Response(
                        {
                            "success": True,
                            "user": UserSerializer(user).data,
                            "message": "Login successful",
                        }
                    )

                except User.DoesNotExist:
                    pass

            return Response({"success": False, "message": "Face not recognized"})

        except Exception as e:
            logger.error(f"Face login error: {e}")
            return Response(
                {"message": "Face login failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# 5. Analysis Reports APIs
class FaceAnalysisReportView(APIView):
    """Generate face analysis report."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Generate face analysis PDF report."""
        required_fields = [
            "patientName",
            "patientEmail",
            "patientPhone",
            "patientJob",
            "analysisResult",
        ]

        # Validate required fields
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {"message": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            # Create analysis report record
            report = AnalysisReport.objects.create(
                user=request.user if request.user.is_authenticated else None,
                hospital_id=(
                    request.user.hospital_id if request.user.is_authenticated else 1
                ),
                report_type="face",
                analysis_data=request.data.get("analysisResult"),
                patient_name=request.data.get("patientName"),
                patient_email=request.data.get("patientEmail"),
                patient_phone=request.data.get("patientPhone"),
                patient_job=request.data.get("patientJob"),
            )

            # Generate PDF
            pdf_buffer = BytesIO()
            pdf = canvas.Canvas(pdf_buffer, pagesize=letter)

            # Add content to PDF
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(50, 750, "MEDCOR - Face Analysis Report")

            pdf.setFont("Helvetica", 12)
            pdf.drawString(50, 700, f"Patient: {report.patient_name}")
            pdf.drawString(50, 680, f"Email: {report.patient_email}")
            pdf.drawString(50, 660, f"Phone: {report.patient_phone}")
            pdf.drawString(50, 640, f"Occupation: {report.patient_job}")

            pdf.drawString(50, 600, "Analysis Results:")
            # Add analysis results (simplified)
            y_position = 580
            for key, value in report.analysis_data.items():
                if y_position < 100:
                    pdf.showPage()
                    y_position = 750
                pdf.drawString(70, y_position, f"{key}: {value}")
                y_position -= 20

            pdf.save()

            # Get PDF content
            pdf_buffer.seek(0)
            pdf_base64 = base64.b64encode(pdf_buffer.read()).decode("utf-8")

            return Response(
                {
                    "message": "PDF report generated successfully",
                    "success": True,
                    "pdf": pdf_base64,
                    "report_id": str(report.id),
                }
            )

        except Exception as e:
            logger.error(f"Face analysis report error: {e}")
            return Response(
                {"message": "Failed to generate report"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HairAnalysisReportView(APIView):
    """Generate hair analysis report."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Generate hair analysis PDF report."""
        # Similar to FaceAnalysisReportView but for hair
        request.data["report_type"] = "hair"
        return FaceAnalysisReportView().post(request)


class SkinAnalysisView(APIView):
    """Perform skin analysis."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Perform skin analysis."""
        image_base64 = request.data.get("image", "")

        if not image_base64:
            return Response(
                {"error": "Image is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Mock skin analysis result
            analysis_result = {
                "skin_type": "Normal",
                "hydration": 75,
                "oil_level": 30,
                "sensitivity": "Low",
                "age_spots": 2,
                "wrinkles": "Fine lines",
                "recommendations": [
                    "Use SPF 30+ sunscreen daily",
                    "Moisturize twice daily",
                    "Consider vitamin C serum",
                ],
            }

            # Save analysis report
            if request.user.is_authenticated:
                AnalysisReport.objects.create(
                    user=request.user,
                    hospital=request.user.hospital,
                    report_type="skin",
                    analysis_data=analysis_result,
                    patient_name=request.user.get_full_name(),
                    patient_email=request.user.email,
                )

            return Response({"success": True, "analysis": analysis_result})

        except Exception as e:
            logger.error(f"Skin analysis error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 6. Location & Context APIs
class LocationWeatherView(APIView):
    """Get weather for location."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Get weather for coordinates."""
        serializer = LocationWeatherSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            weather_info = async_to_sync(weather_service.get_location_weather)(
                data["latitude"], data["longitude"]
            )

            return Response({"message": weather_info, "success": True})

        except Exception as e:
            logger.error(f"Weather service error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LanguagesView(APIView):
    """Get available languages."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get supported languages."""
        languages = [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Español"},
            {"code": "fr", "name": "Français"},
            {"code": "de", "name": "Deutsch"},
            {"code": "zh", "name": "中文"},
            {"code": "ja", "name": "日本語"},
            {"code": "tr", "name": "Türkçe"},
        ]

        return Response(languages)


# 7. Consent Management APIs
class ConsentRecordView(APIView):
    """Record user consent."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Record consent."""
        serializer = ConsentRecordRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            # Get client IP
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0]
            else:
                ip_address = request.META.get("REMOTE_ADDR")

            # Create consent record
            consent = ConsentRecord.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key or "anonymous",
                accepted_terms=data["accepted_terms"],
                accepted_privacy=data["accepted_privacy"],
                accepted_disclaimer=data["accepted_disclaimer"],
                version=data["version"],
                user_agent=data.get(
                    "user_agent", request.META.get("HTTP_USER_AGENT", "")
                ),
                ip_address=ip_address,
            )

            logger.info(f"Consent recorded: {consent.id}")

            return Response(
                {"success": True, "message": "Consent recorded successfully"}
            )

        except Exception as e:
            logger.error(f"Consent record error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConsentRevokeView(APIView):
    """Revoke user consent."""

    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Revoke consent."""
        try:
            # Find and revoke active consent
            if request.user.is_authenticated:
                consents = ConsentRecord.objects.filter(
                    user=request.user, is_active=True
                )
            else:
                consents = ConsentRecord.objects.filter(
                    session_id=request.session.session_key, is_active=True
                )

            for consent in consents:
                consent.revoke()

            logger.info(f"Consent revoked for {consents.count()} records")

            return Response(
                {"success": True, "message": "Consent revoked successfully"}
            )

        except Exception as e:
            logger.error(f"Consent revoke error: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
