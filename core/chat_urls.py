"""
URL configuration for chat, voice, and avatar APIs.
"""

from django.urls import path

from .chat_views import (  # Voice & Chat; Speech Processing; Avatar Management; Face Recognition; Analysis Reports; Location & Context; Consent Management
    AvatarCreateSessionView, AvatarSpeechToTextView, AvatarStartRecordingView,
    AvatarStatusView, AvatarStopRecordingView, ConsentRecordView,
    ConsentRevokeView, FaceAnalysisReportView, FaceLoginView,
    FaceRecognizeView, FaceRegisterView, HairAnalysisReportView, LanguagesView,
    LocationWeatherView, SkinAnalysisView, SpeechToTextView, TextChatView,
    TextToSpeechView, VoiceChatView)

urlpatterns = [
    # 1. Voice & Chat APIs
    path("chat/voice/", VoiceChatView.as_view(), name="voice-chat"),
    path("chat/", TextChatView.as_view(), name="text-chat"),
    # 2. Speech Processing
    path("speech-to-text/", SpeechToTextView.as_view(), name="speech-to-text"),
    path("text-to-speech/", TextToSpeechView.as_view(), name="text-to-speech"),
    path(
        "avatar/speech-to-text/",
        AvatarSpeechToTextView.as_view(),
        name="avatar-speech-to-text",
    ),
    # 3. Avatar Management
    path(
        "avatar/status/<str:session_id>/",
        AvatarStatusView.as_view(),
        name="avatar-status",
    ),
    path(
        "avatar/create-session/",
        AvatarCreateSessionView.as_view(),
        name="avatar-create-session",
    ),
    path(
        "avatar/start-recording/",
        AvatarStartRecordingView.as_view(),
        name="avatar-start-recording",
    ),
    path(
        "avatar/stop-recording/",
        AvatarStopRecordingView.as_view(),
        name="avatar-stop-recording",
    ),
    # 4. Face Recognition
    path("face/recognize/", FaceRecognizeView.as_view(), name="face-recognize"),
    path("face/register/", FaceRegisterView.as_view(), name="face-register"),
    path("auth/face-login/", FaceLoginView.as_view(), name="face-login"),
    # 5. Analysis Reports
    path(
        "face-analysis-report/",
        FaceAnalysisReportView.as_view(),
        name="face-analysis-report",
    ),
    path(
        "hair-analysis-report/",
        HairAnalysisReportView.as_view(),
        name="hair-analysis-report",
    ),
    path("skin-analysis/", SkinAnalysisView.as_view(), name="skin-analysis"),
    # 6. Location & Context
    path("location-weather/", LocationWeatherView.as_view(), name="location-weather"),
    path("languages/", LanguagesView.as_view(), name="languages"),
    # 7. Consent Management
    path("consent/record/", ConsentRecordView.as_view(), name="consent-record"),
    path("consent/revoke/", ConsentRevokeView.as_view(), name="consent-revoke"),
]
