"""
Core services for AI, voice, avatar, and external integrations.
"""

import asyncio
import base64
import hashlib
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import aiohttp
import boto3
import httpx
import python_weather
from azure.cognitiveservices.vision.face import FaceClient
from django.conf import settings
from django.core.cache import cache
from elevenlabs import AsyncElevenLabs
from geopy.geocoders import Nominatim
from msrest.authentication import CognitiveServicesCredentials
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class OpenAIService:
    """OpenAI GPT service for chat responses."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_chat_response(
        self, message: str, language: str = "en", context: Dict = None
    ) -> str:
        """Generate AI chat response."""
        try:
            system_prompt = self._get_system_prompt(language)

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ]

            if context and context.get("history"):
                # Add conversation history
                for hist in context["history"][-5:]:  # Last 5 messages
                    messages.insert(-1, {"role": "user", "content": hist["message"]})
                    messages.insert(
                        -1, {"role": "assistant", "content": hist["response"]}
                    )

            response = await self.client.chat.completions.create(
                model="gpt-4o", messages=messages, temperature=0.7, max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI chat error: {e}")
            return "I'm sorry, I'm having trouble understanding. Could you please try again?"

    async def analyze_user_image(self, image_base64: str) -> str:
        """Analyze user image for compliments."""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a kind AI that notices nice details about people. Give 1 brief compliment about something specific you see (clothing, style, accessories). Be genuine and warm. Keep it under 15 words.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Give a brief compliment about their appearance.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                },
                            },
                        ],
                    },
                ],
                max_tokens=30,
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return ""

    def _get_system_prompt(self, language: str) -> str:
        """Get system prompt based on language."""
        prompts = {
            "en": "You are MedCare AI, a helpful healthcare assistant. Provide clear, compassionate, and professional medical guidance.",
            "es": "Eres MedCare AI, un asistente de salud útil. Proporciona orientación médica clara, compasiva y profesional.",
            "tr": "Sen MedCare AI, yardımcı bir sağlık asistanısın. Açık, şefkatli ve profesyonel tıbbi rehberlik sağla.",
            "fr": "Vous êtes MedCare AI, un assistant de santé utile. Fournissez des conseils médicaux clairs, compatissants et professionnels.",
            "de": "Sie sind MedCare AI, ein hilfreicher Gesundheitsassistent. Bieten Sie klare, mitfühlende und professionelle medizinische Beratung.",
            "zh": "您是MedCare AI，一位有用的医疗助理。提供清晰、富有同情心和专业的医疗指导。",
            "ja": "あなたはMedCare AI、役立つヘルスケアアシスタントです。明確で思いやりのある専門的な医療ガイダンスを提供してください。",
        }
        return prompts.get(language, prompts["en"])


class HeyGenService:
    """HeyGen avatar service."""

    def __init__(self):
        self.api_key = os.getenv(
            "HEYGEN_API_KEY",
            "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==",
        )
        self.base_url = "https://api.heygen.com/v1"
        self.streaming_url = "https://api.heygen.com/v1/streaming.new"

    async def create_avatar_session(self, session_id: str) -> Dict:
        """Create new avatar streaming session."""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "x-api-key": self.api_key,
                    "Content-Type": "application/json",
                }

                data = {
                    "quality": "high",
                    "avatar_name": "anna_public_3_20240108",
                    "voice": {"voice_id": "1bd001e7e50f421d891986aad5158bc8"},
                }

                async with session.post(
                    self.streaming_url, headers=headers, json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": True,
                            "session_id": session_id,
                            "data": result.get("data", {}),
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"HeyGen session creation failed: {error_text}")
                        return {"success": False, "error": error_text}

        except Exception as e:
            logger.error(f"HeyGen session error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_avatar_response(
        self, text: str, session_id: str, language: str = "en"
    ) -> Dict:
        """Generate avatar response with text."""
        try:
            # For now, return a mock response since HeyGen requires complex setup
            return {
                "text": text,
                "session_id": session_id,
                "language": language,
                "avatar_url": None,
                "status": "processing",
            }
        except Exception as e:
            logger.error(f"Avatar response error: {e}")
            return {"error": str(e)}

    async def get_avatar_status(self, session_id: str) -> Dict:
        """Get avatar session status."""
        try:
            # Check cache for session status
            cached_status = cache.get(f"avatar_status_{session_id}")
            if cached_status:
                return cached_status

            return {
                "session_id": session_id,
                "status": "active",
                "created_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Avatar status error: {e}")
            return {"error": str(e)}


class FaceRecognitionService:
    """Face recognition service using Azure or AWS."""

    def __init__(self):
        self.use_azure = os.getenv("USE_AZURE_FACE", "true").lower() == "true"
        self.face_client = None
        self.rekognition = None

        if self.use_azure:
            azure_key = os.getenv("AZURE_FACE_KEY", "")
            if azure_key:
                try:
                    self.face_client = FaceClient(
                        os.getenv(
                            "AZURE_FACE_ENDPOINT",
                            "https://eastus.api.cognitive.microsoft.com/",
                        ),
                        CognitiveServicesCredentials(azure_key),
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize Azure Face API: {e}")
        else:
            try:
                self.rekognition = boto3.client(
                    "rekognition", region_name=os.getenv("AWS_REGION", "us-east-1")
                )
            except Exception as e:
                logger.warning(f"Failed to initialize AWS Rekognition: {e}")

    async def recognize_face(self, image_base64: str, session_id: str) -> Dict:
        """Recognize face from image."""
        try:
            # For demo, generate a mock face ID
            face_id = hashlib.sha256(
                f"{session_id}_{datetime.now()}".encode()
            ).hexdigest()

            # Check if face exists in database (would query FaceRecognition model)
            # For now, return mock response
            return {
                "recognized": False,
                "face_id": face_id,
                "confidence": 0.0,
                "suggested_language": "en",
                "message": "New face detected. Would you like to register?",
            }

        except Exception as e:
            logger.error(f"Face recognition error: {e}")
            return {"error": str(e), "recognized": False}

    async def register_face(
        self, image_base64: str, user_id: str, preferred_language: str
    ) -> Dict:
        """Register new face for user."""
        try:
            # Generate face encoding
            face_id = hashlib.sha256(f"{user_id}_{datetime.now()}".encode()).hexdigest()

            # In production, would save to FaceRecognition model
            return {
                "success": True,
                "face_id": face_id,
                "message": "Face registered successfully!",
            }

        except Exception as e:
            logger.error(f"Face registration error: {e}")
            return {"success": False, "error": str(e)}


class TextToSpeechService:
    """Text-to-speech service using ElevenLabs or OpenAI."""

    def __init__(self):
        self.use_elevenlabs = os.getenv("USE_ELEVENLABS", "false").lower() == "true"

        if self.use_elevenlabs:
            self.elevenlabs = AsyncElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
        else:
            self.openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def convert_text_to_speech(
        self, text: str, voice_id: str = None, language: str = "en"
    ) -> bytes:
        """Convert text to speech audio."""
        try:
            if self.use_elevenlabs and self.elevenlabs:
                # Use ElevenLabs
                audio = await self.elevenlabs.text_to_speech.convert(
                    text=text,
                    voice_id=voice_id or "21m00Tcm4TlvDq8ikWAM",  # Default voice
                    model="eleven_multilingual_v2",
                )
                return audio
            else:
                # Use OpenAI TTS
                response = await self.openai.audio.speech.create(
                    model="tts-1", voice="nova", input=text
                )
                return response.content

        except Exception as e:
            logger.error(f"TTS error: {e}")
            return b""


class SpeechToTextService:
    """Speech-to-text service using OpenAI Whisper."""

    def __init__(self):
        self.openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def transcribe_audio(self, audio_base64: str, language: str = None) -> Dict:
        """Transcribe audio to text."""
        try:
            # For demo, return mock transcription
            mock_transcriptions = [
                "I would like to book an appointment with Dr. Johnson",
                "Can you help me with my medical condition?",
                "I need to see a doctor tomorrow",
                "What are your available times?",
                "I have a question about my health",
            ]

            import random

            return {
                "text": random.choice(mock_transcriptions),
                "language": language or "en",
                "confidence": 0.95,
                "success": True,
            }

        except Exception as e:
            logger.error(f"STT error: {e}")
            return {"success": False, "error": str(e)}


class WeatherService:
    """Weather service for location context."""

    def __init__(self):
        self.geolocator = Nominatim(user_agent="medcare_ai")

    async def get_location_weather(self, latitude: float, longitude: float) -> str:
        """Get weather for location."""
        try:
            # Get location name
            location = self.geolocator.reverse(f"{latitude}, {longitude}")
            city = location.raw.get("address", {}).get("city", "Unknown")

            # Get weather (simplified for demo)
            async with python_weather.Client(unit=python_weather.METRIC) as client:
                weather = await client.get(city)
                return f"{city}, {weather.temperature}°C, {weather.description}"

        except Exception as e:
            logger.error(f"Weather service error: {e}")
            return "Location unavailable"


class VoiceConversationManager:
    """Manage stateful voice conversations."""

    def __init__(self):
        self.sessions = {}

    async def process_voice_input(
        self, message: str, session_id: str, state: Dict = None
    ) -> Dict:
        """Process voice input and manage conversation state."""
        try:
            # Initialize or update session state
            if session_id not in self.sessions:
                self.sessions[session_id] = {
                    "state": "greeting",
                    "context": {},
                    "history": [],
                }

            session = self.sessions[session_id]
            if state:
                session.update(state)

            # Detect voice commands
            voice_command = self._detect_voice_command(message)

            # Generate appropriate response
            response = await self._generate_contextual_response(
                message, session, voice_command
            )

            # Update history
            session["history"].append(
                {
                    "message": message,
                    "response": response["message"],
                    "timestamp": datetime.now().isoformat(),
                }
            )

            # Keep only last 10 messages in history
            if len(session["history"]) > 10:
                session["history"] = session["history"][-10:]

            response["conversation_state"] = session
            return response

        except Exception as e:
            logger.error(f"Voice conversation error: {e}")
            return {
                "action": "ERROR",
                "message": "I'm sorry, I didn't understand that. Could you please repeat?",
                "conversation_state": state or {},
            }

    def _detect_voice_command(self, message: str) -> Dict:
        """Detect voice commands in message."""
        message_lower = message.lower()

        commands = {
            "appointment": ["appointment", "book", "schedule", "doctor"],
            "face_analysis": ["face analysis", "analyze face", "skin check"],
            "hair_analysis": ["hair analysis", "hair check", "hair health"],
            "medical_records": ["medical records", "health records", "my records"],
            "doctors": ["show doctors", "list doctors", "available doctors"],
            "profile": ["my profile", "profile", "account"],
        }

        for action, keywords in commands.items():
            if any(keyword in message_lower for keyword in keywords):
                return {"action": f"VOICE_COMMAND:{action.upper()}", "detected": True}

        return {"action": "CHAT", "detected": False}

    async def _generate_contextual_response(
        self, message: str, session: Dict, voice_command: Dict
    ) -> Dict:
        """Generate response based on context and command."""
        action = voice_command.get("action", "CHAT")

        if "APPOINTMENT" in action:
            return {
                "action": action,
                "message": "I'll help you book an appointment. Which doctor would you like to see?",
                "show_doctors": True,
            }
        elif "FACE_ANALYSIS" in action:
            return {
                "action": action,
                "message": "I'll start the face analysis for you. Please look at the camera.",
                "start_analysis": "face",
            }
        elif "DOCTORS" in action:
            return {
                "action": action,
                "message": "Here are our available doctors.",
                "show_doctors": True,
            }
        else:
            # Regular chat response
            openai_service = OpenAIService()
            response = await openai_service.generate_chat_response(
                message,
                session.get("language", "en"),
                {"history": session.get("history", [])},
            )
            return {"action": "CHAT", "message": response}

    def get_session_state(self, session_id: str) -> Dict:
        """Get current session state."""
        return self.sessions.get(session_id, {})
