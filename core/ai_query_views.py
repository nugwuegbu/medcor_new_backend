"""
Enhanced AI Query Views for Health and Hospital-specific queries
Handles general health questions and hospital-specific queries with appointment booking
"""

import asyncio
import hashlib
import json
import logging
import re
import traceback
from typing import Any, Dict, List, Optional, Tuple

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from core.services import OpenAIService
from core.pii_collection_manager import PIICollectionManager
from langchain_ai.mcp_client import get_mcp_client
from appointments.models import DoctorScheduleSlot, Appointment
from core.models import User, Certification
from tenants.models import Hospital
from specialty.models import DoctorSpecialty, Specialty
from services.models import Service
from django.db import models
from knowledgebase.models import Ai_Identity, Behavior, Response as ResponseModel

logger = logging.getLogger(__name__)


class HealthAwareQueryView(APIView):
    """
    Enhanced AI Query endpoint that handles:
    1. General health questions (using OpenAI)
    2. Hospital-specific queries (using MCP server)
    3. Appointment booking with slot checking
    """
    permission_classes = [AllowAny]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.openai_service = OpenAIService()

    @staticmethod
    def _is_valid_uuid(value: str) -> bool:
        """Return True if value is a valid UUID string."""
        if not value:
            return False
        import uuid
        try:
            uuid.UUID(value)
            return True
        except (ValueError, AttributeError, TypeError):
            return False
    
    @staticmethod
    def _append_text(base: Optional[str], extra: str) -> str:
        """Append text to base, handling None."""
        if not extra:
            return base or ""
        return f"{base}\n\n{extra}" if base else extra
    
    def _sanitize_appointment_response(self, response: str, pii_manager: Optional[PIICollectionManager]) -> str:
        """
        Post-process appointment response to replace generic questions with specific appointment type questions.
        This ensures that after PII is collected, the AI asks directly about appointment type/specialist.
        """
        if not response:
            return response
        
        response_lower = response.lower()
        
        # Generic question patterns that should be replaced
        generic_patterns = [
            r"how can I assist you with booking",
            r"how can I help you with booking",
            r"how can I assist you",
            r"how can I help you",
            r"how may I assist you",
            r"how may I help you",
            r"what can I do for you",
            r"what would you like to do",
        ]
        
        # Check if response contains generic questions
        contains_generic = any(
            re.search(pattern, response_lower, re.IGNORECASE) 
            for pattern in generic_patterns
        )
        
        # If generic questions found, replace with specific appointment type question
        if contains_generic:
            # Get user's name if available
            user_name = ""
            if pii_manager:
                pii_manager._refresh_profile()
                profile = pii_manager.profile
                if profile.first_name:
                    user_name = profile.first_name
            
            # Create specific appointment type question
            if user_name:
                specific_question = f"What type of appointment do you need, or which specialist would you like to see, {user_name}? For example, are you looking for a consultation with a cardiologist, gynecologist, or general practitioner?"
            else:
                specific_question = "What type of appointment do you need, or which specialist would you like to see? For example, are you looking for a consultation with a cardiologist, gynecologist, or general practitioner?"
            
            # Remove generic question sentences and add specific question
            # Split response into sentences
            sentences = re.split(r'([.!?]+\s*)', response)
            cleaned_sentences = []
            
            for i, sentence in enumerate(sentences):
                # Check if sentence contains generic question
                sentence_lower = sentence.lower()
                is_generic = any(
                    re.search(pattern, sentence_lower, re.IGNORECASE)
                    for pattern in generic_patterns
                )
                
                if not is_generic:
                    cleaned_sentences.append(sentence)
            
            # Reconstruct response without generic questions
            cleaned_response = ''.join(cleaned_sentences).strip()
            
            # Add specific appointment type question
            if cleaned_response:
                # Remove trailing punctuation if present
                cleaned_response = cleaned_response.rstrip('.!?')
                return f"{cleaned_response}. {specific_question}"
            else:
                # If all was generic, just return the specific question
                return specific_question
        
        return response
    
    def _truncate_to_sentences(self, text: str, max_sentences: float = 2.5) -> str:
        """
        Truncate text to maximum sentences.
        Enforces the 2.5 sentence limit by counting sentences and truncating if needed.
        """
        if not text:
            return text
        
        import re
        
        # Split into sentences (by period, exclamation, or question mark followed by space or end)
        # This pattern captures the sentence and its punctuation
        sentence_pattern = r'[^.!?]*[.!?]+(?:\s+|$)'
        sentences = re.findall(sentence_pattern, text)
        
        # If no sentences found with pattern, try splitting on punctuation
        if not sentences:
            sentences = re.split(r'([.!?]+(?:\s+|$))', text)
            # Recombine sentences with their punctuation
            combined = []
            for i in range(0, len(sentences), 2):
                if i < len(sentences):
                    sentence = sentences[i]
                    if i + 1 < len(sentences):
                        sentence += sentences[i + 1]
                    if sentence.strip():
                        combined.append(sentence.strip())
            sentences = combined
        
        # Count sentences
        sentence_count = len(sentences)
        
        # If within limit, return as is
        if sentence_count <= max_sentences:
            return text.strip()
        
        # If over limit, truncate
        if max_sentences == 2.5 and sentence_count >= 3:
            # Take first 2 full sentences
            result = ' '.join(sentences[:2])
            
            # For the 3rd sentence, take approximately half
            third_sentence = sentences[2]
            words = third_sentence.split()
            if len(words) > 4:
                # Take first half of words
                half_point = len(words) // 2
                result += ' ' + ' '.join(words[:half_point])
                # Ensure it ends with punctuation
                if not result.rstrip().endswith(('.', '!', '?')):
                    result += '.'
            else:
                # If very short (4 words or less), include it fully
                result += ' ' + third_sentence
            
            return result.strip()
        elif sentence_count > max_sentences:
            # For other max values, just take first N sentences
            return ' '.join(sentences[:int(max_sentences)]).strip()
        
        return text.strip()
    
    def _extract_and_store_pii(self, question: str, ai_response: str, chat_session, pii_manager: Optional[PIICollectionManager]) -> Dict:
        """Extract and store PII from question and AI response."""
        if not chat_session or not pii_manager:
            return {"extracted": {}, "stored": {}, "status": "no_session", "errors": {}}
        
        try:
            return pii_manager.extract_and_store_pii(question, ai_response)
        except Exception as e:
            logger.warning(f"Error extracting PII: {e}")
            return {"extracted": {}, "stored": {}, "status": "error", "errors": {}}
    
    def _maybe_add_contact_prompt(
        self,
        response_data: Dict[str, Any],
        pii_manager: Optional[PIICollectionManager],
        query_type: str,
    ) -> Dict[str, Any]:
        """Add contact prompt if needed based on PII collection state."""
        if not pii_manager or query_type == "non_health":
            return response_data
        
        # Check if all required fields are already collected - if so, don't ask again
        if not pii_manager.missing_required_fields():
            # All required fields collected, clear any PII-related flags and continue conversation
            response_data.pop("contact_prompted", None)
            response_data.pop("requires_contact_info", None)
            # Don't modify follow_up_questions if they're already set appropriately
            return response_data
        
        # For ALL query types (including appointments), collect PII first (name → phone)
        # Then continue with the actual query (appointment details, health questions, etc.)
        # This ensures consistent flow across all query types
        
        if not pii_manager.should_trigger_initial_prompt(min_turns=1):
            return response_data
        
        # If we already communicated a phone-number validation issue,
        # avoid repeating the same prompt and let the tailored error stand.
        if response_data.get("pii_errors") and "phone_number" in response_data["pii_errors"]:
            return response_data

        prompt_text = pii_manager.get_contact_prompt(enforce=True)
        existing_response = response_data.get("response", "")
        
        # Only add prompt if we actually need to collect something
        if not prompt_text:
            return response_data
        
        # Always append the PII prompt to the existing response (answer first, then ask for info)
        # This ensures the user gets their question answered before being asked for personal info
        if response_data.get("pii_errors"):
            # If there are validation errors, append both error and prompt
            response_data["response"] = self._append_text(existing_response, prompt_text)
        else:
            # Append the prompt after the answer
            response_data["response"] = self._append_text(existing_response, prompt_text)
        
        response_data["contact_prompted"] = True
        response_data["requires_contact_info"] = True
        
        # Only show follow-up question for the next field we need (sequential)
        next_field = pii_manager.get_next_required_field()
        if next_field == "name":
            response_data["follow_up_questions"] = [
                "Could you please share your full name (first and last)?",
            ]
        elif next_field == "phone_number":
            response_data["follow_up_questions"] = [
                "Please share the best phone number to reach you, including country code (e.g., +1234567890).",
            ]
        else:
            # No more fields needed - use default follow-up questions
            if not response_data.get("follow_up_questions"):
                response_data["follow_up_questions"] = [
                    "Would you like to know more about this?",
                    "Do you need help finding a specialist?",
                    "Would you like to book an appointment?"
                ]
        
        return response_data
    
    def _decorate_response_with_contact(
        self,
        response: Response,
        question: str,
        chat_session,
        pii_manager: Optional[PIICollectionManager],
        query_type: str,
    ) -> Response:
        """Decorate response with PII collection prompts and validation errors."""
        if not chat_session or not hasattr(response, "data"):
            return response

        response_data = dict(response.data)
        if not response_data.get("response"):
            return response

        # Extract and store PII from user's message first
        pii_result = self._extract_and_store_pii(question, response_data["response"], chat_session, pii_manager)
        
        # Refresh PII manager state after extraction to get latest status
        if pii_manager:
            pii_manager._refresh_profile()
        
        # Check if all required fields are now collected (after extraction)
        all_pii_collected = False
        if pii_manager:
            all_pii_collected = not pii_manager.missing_required_fields()
        
        response_data["pii_collected"] = all_pii_collected
        
        # If all PII is collected, clear any errors and proceed
        if all_pii_collected:
            # Both name and phone collected - clear errors and don't show prompts
            response_data.pop("pii_errors", None)
            response_data.pop("contact_prompted", None)
            response_data.pop("requires_contact_info", None)
            
            # Post-process response for appointment queries: Replace generic questions with specific appointment type question
            if query_type == "appointment":
                response_data["response"] = self._sanitize_appointment_response(
                    response_data["response"], 
                    pii_manager
                )
        else:
            # Show validation errors if any (only if PII is not complete)
            if pii_result.get("errors"):
                response_data["pii_errors"] = pii_result["errors"]
                friendly = PIICollectionManager.format_validation_errors(pii_result["errors"])
                if friendly:
                    response_data["response"] = self._append_text(response_data["response"], friendly)

        # After handling errors, check if we need to ask for the next field
        # This will append the prompt after the answer (or after validation errors)
        # But skip if all PII is already collected
        if not all_pii_collected:
            response_data = self._maybe_add_contact_prompt(response_data, pii_manager, query_type)
        
        return Response(response_data, status=response.status_code)

    @extend_schema(
        operation_id="health_aware_query",
        summary="Health-Aware AI Query",
        description="Process health and hospital queries. Handles general health questions using OpenAI and hospital-specific queries using MCP server. Supports appointment booking with available slots.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The user's question or query",
                        "examples": [
                            "What are the symptoms of diabetes?",
                            "Is there a Gynecologist in this hospital?",
                            "What diseases are treated in this hospital?",
                            "Who are the doctors in this hospital?",
                            "I want to book an appointment",
                            "Does your hospital perform brain surgery?"
                        ]
                    },
                    "hospital": {
                        "type": "string",
                        "description": "Hospital ID for hospital-specific queries",
                        "example": "hospital-uuid-123"
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Optional session ID for conversation memory. If provided, previous messages from this session will be included in context.",
                        "required": False
                    }
                },
                "required": ["question"]
            }
        },
        responses={
            200: {
                "description": "Query processed successfully",
                "content": {
                    "application/json": {
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean"},
                            "response": {"type": "string"},
                            "query_type": {"type": "string", "enum": ["health", "hospital", "appointment"]},
                            "hospital_info": {"type": "object", "description": "Hospital information if applicable"},
                            "appointment_options": {"type": "array", "description": "Available appointment slots if booking"},
                            "follow_up_questions": {"type": "array", "description": "Suggested follow-up questions"}
                        }
                    }
                }
            },
            400: {
                "description": "Bad request - invalid input"
            }
        },
        tags=["AI Query Processing"]
    )
    def post(self, request):
        """Process health and hospital queries"""
        question = request.data.get("question", "").strip()
        hospital_id = request.data.get("hospital", "").strip()
        session_id = request.data.get("session_id", None)

        if not question:
            return Response(
                {"error": "Question is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hospital_id and not self._is_valid_uuid(hospital_id):
            return Response(
                {
                    "success": False,
                    "response": "The hospital identifier you provided doesn't look valid. "
                                "Please double-check the ID or pick a hospital from the list.",
                    "query_type": "appointment" if "appointment" in question.lower() else "hospital",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Load conversation history if session_id is provided
        conversation_history = []
        chat_session = None
        pii_manager = None
        if session_id:
            try:
                from core.chat_models import ChatSession, ChatMessage
                chat_session, created = ChatSession.objects.get_or_create(
                    session_id=session_id,
                    defaults={
                        "user": request.user if request.user.is_authenticated else None,
                        "hospital_id": hospital_id if hospital_id else None,
                        "language": "en",
                    }
                )
                
                # Update session if hospital_id changed
                if hospital_id and chat_session.hospital_id != hospital_id:
                    chat_session.hospital_id = hospital_id
                    chat_session.save()
                
                # Update last activity
                chat_session.last_activity = timezone.now()
                chat_session.save()
                
                # Initialize PII collection manager and increment turn count
                pii_manager = PIICollectionManager(chat_session)
                pii_manager.increment_user_turn_count()
                
                # Retrieve recent conversation history (newest first then reverse for chronological order)
                previous_messages = list(
                    ChatMessage.objects.filter(session=chat_session)
                    .order_by("-timestamp")[:10]
                )
                previous_messages.reverse()

                conversation_history = [
                    {
                        "message": msg.message,
                        "response": msg.response,
                        "timestamp": msg.timestamp.isoformat(),
                    }
                    for msg in previous_messages
                ]
                
                logger.info(f"Loaded {len(conversation_history)} previous messages for session {session_id}")
                if conversation_history:
                    logger.info(f"Last message: User='{conversation_history[-1].get('message', '')[:50]}', AI='{conversation_history[-1].get('response', '')[:50]}'")
            except Exception as e:
                logger.warning(f"Could not load conversation history for session {session_id}: {e}")

        try:
            # Detect query type - but if hospital_id is provided, prioritize hospital queries
            # Use conversation history to better understand context (e.g., "Yes" after booking question)
            query_type = self._detect_query_type(
                question, 
                hospital_id if hospital_id else None,
                conversation_history=conversation_history
            )
            
            # Handle non-health questions
            if query_type == "non_health":
                return Response({
                    "success": True,
                    "response": "I'm a specialized health assistant and can only help with health-related questions, hospital information, and medical appointments. Please ask me about health topics, hospital services, or if you need to book an appointment.",
                    "query_type": "non_health"
                })

            # Handle appointment booking
            if query_type == "appointment":
                # Pass PII manager to appointment handler so it can check PII status before generating response
                response = self._handle_appointment_booking(
                    question, 
                    hospital_id, 
                    session_id=session_id, 
                    chat_session=chat_session,
                    pii_manager=pii_manager
                )
                # Decorate response with PII collection prompts
                if session_id and chat_session:
                    try:
                        response = self._decorate_response_with_contact(
                            response, question, chat_session, pii_manager, query_type="appointment"
                        )
                        response_data = response.data if hasattr(response, 'data') else {}
                        if response_data.get('response'):
                            self._save_conversation(chat_session, question, response_data.get('response'), hospital_id)
                            logger.info(f"Saved appointment booking conversation for session {session_id}")
                    except Exception as e:
                        logger.warning(f"Could not save conversation: {e}")
                return response

            # Handle hospital-specific queries
            if query_type == "hospital" and hospital_id:
                response = self._handle_hospital_query(question, hospital_id, session_id=session_id, conversation_history=conversation_history)
                # Note: Conversation saved by OpenAIService via LangChain memory if available
                if session_id and chat_session:
                    try:
                        response_data = response.data if hasattr(response, 'data') else {}
                        if response_data.get('response'):
                            from core.services import MEMORY_SERVICE_AVAILABLE
                            if not MEMORY_SERVICE_AVAILABLE:
                                self._save_conversation(chat_session, question, response_data.get('response'), hospital_id)
                            else:
                                logger.debug(f"Skipping manual save - LangChain memory service should have saved")
                    except Exception as e:
                        logger.warning(f"Could not save conversation: {e}")
                return response

            # Handle general health questions
            if query_type == "health":
                # Pass PII manager to health query handler so it can check PII status before generating response
                response = self._handle_health_query(
                    question, 
                    hospital_id, 
                    session_id=session_id, 
                    conversation_history=conversation_history,
                    pii_manager=pii_manager
                )
                # Decorate response with PII collection prompts
                if session_id and chat_session:
                    try:
                        response = self._decorate_response_with_contact(
                            response, question, chat_session, pii_manager, query_type="health"
                        )
                        response_data = response.data if hasattr(response, 'data') else {}
                        if response_data.get('response'):
                            from core.services import MEMORY_SERVICE_AVAILABLE
                            if not MEMORY_SERVICE_AVAILABLE:
                                self._save_conversation(chat_session, question, response_data.get('response'), hospital_id)
                            else:
                                logger.debug(f"Skipping manual save - LangChain memory service should have saved")
                    except Exception as e:
                        logger.warning(f"Could not save conversation: {e}")
                return response

            # Default response
            return Response({
                "success": True,
                "response": "I can help you with health questions, hospital information, or booking appointments. Please provide a hospital ID for hospital-specific queries.",
                "query_type": "general"
            })

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return Response(
                {"error": "Internal server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _detect_query_type(self, question: str, hospital_id: str = None, conversation_history: List[Dict] = None) -> str:
        """Detect the type of query based on keywords and patterns"""
        question_lower = question.lower()
        
        # Use conversation history to understand context
        # If previous messages mentioned booking/appointment, continue booking flow
        if conversation_history:
            logger.info(f"Checking conversation history for booking context. History length: {len(conversation_history)}")
            # Check last few messages for booking context (check ALL recent messages, not just last)
            last_messages = conversation_history[-5:] if len(conversation_history) >= 5 else conversation_history
            
            # Check ALL recent messages for booking indicators
            booking_indicators = [
                "book an appointment", "book appointment", "booking", "appointment",
                "schedule", "available slots", "would you like to book", "appointment booking",
                "what type of appointment", "preferred service", "service, date, and time",
                "service you'd like", "date and time", "preferred date", "preferred time",
                "help you book", "book for you", "schedule an appointment", "make an appointment",
                "appointment slot", "available appointment", "book a slot", "reserve a slot",
                "what service", "which service", "what date", "what time", "when would you"
            ]
            
            # Check if ANY recent message contains booking indicators
            is_booking_context = False
            for msg in last_messages:
                msg_response = msg.get("response", "").lower()
                msg_user = msg.get("message", "").lower()
                
                # Check AI responses for booking indicators
                if any(phrase in msg_response for phrase in booking_indicators):
                    is_booking_context = True
                    logger.info(f"Found booking indicator in AI response: {msg_response[:100]}")
                    break
                
                # Check user messages for booking keywords
                if any(phrase in msg_user for phrase in ["book", "appointment", "schedule", "booking"]):
                    is_booking_context = True
                    logger.info(f"Found booking keyword in user message: {msg_user[:100]}")
                    break
            
            if is_booking_context:
                logger.info(f"Detected booking context for question: '{question}'")
                # If user provides a service name, specialty, or date/time, continue booking
                service_keywords = [
                    "gynecologist", "cardiologist", "dermatologist", "pediatrician", 
                    "neurologist", "orthopedist", "psychiatrist", "oncologist",
                    "general", "consultation", "checkup", "examination", "surgery"
                ]
                
                # Check if question is a service name or specialty
                if any(keyword in question_lower for keyword in service_keywords):
                    logger.info(f"Matched service keyword in booking context: '{question}' -> routing to appointment")
                    return "appointment"
                
                # Check for date/time patterns
                date_time_patterns = [
                    "today", "tomorrow", "monday", "tuesday", "wednesday", "thursday", 
                    "friday", "saturday", "sunday", "morning", "afternoon", "evening",
                    "am", "pm", ":", "/", "-"  # Date/time separators
                ]
                if any(pattern in question_lower for pattern in date_time_patterns):
                    return "appointment"
                
                # Short affirmative responses should continue the booking flow
                if question_lower in ["yes", "yeah", "yep", "ok", "okay", "sure", "please", "let's do it", "proceed"]:
                    return "appointment"
                
                # If we're in booking context, be more aggressive about treating responses as appointment-related
                # Short responses (1-3 words) are likely follow-ups to booking questions
                word_count = len(question.split())
                
                # If it's a short response and doesn't contain clear health question indicators, treat as appointment
                if word_count <= 3:
                    health_indicators = ["symptom", "treatment", "medicine", "diagnosis", "disease", "condition", 
                                       "what is", "tell me about", "explain", "how to", "why"]
                    if not any(indicator in question_lower for indicator in health_indicators):
                        logger.info(f"Short response in booking context ({word_count} words): '{question}' -> routing to appointment")
                        return "appointment"
                
                # For longer responses, check if it's clearly a health question
                if not any(keyword in question_lower for keyword in ["weather", "sports", "politics"]):
                    health_indicators = ["symptom", "treatment", "medicine", "diagnosis", "disease", "condition",
                                       "what is", "tell me about", "explain", "how to", "why", "what are the"]
                    if not any(indicator in question_lower for indicator in health_indicators):
                        logger.info(f"Response in booking context doesn't match health indicators: '{question}' -> routing to appointment")
                        return "appointment"
        
        # Appointment booking keywords - CHECK FIRST (highest priority)
        appointment_keywords = [
            "book", "appointment", "schedule", "meet", "visit", "consultation",
            "see doctor", "make appointment", "book slot", "reserve", "appointments"
        ]
        
        # Check for appointment booking FIRST before any other checks
        for keyword in appointment_keywords:
            if keyword in question_lower:
                return "appointment"
        
        # Non-health keywords (to filter out)
        non_health_keywords = [
            "weather", "sports", "politics", "news", "entertainment", "movie",
            "music", "food recipe", "cooking", "travel", "shopping", "fashion",
            "technology", "programming", "business", "finance", "stock", "crypto"
        ]
        
        # Check for non-health topics
        for keyword in non_health_keywords:
            if keyword in question_lower:
                return "non_health"
        
        # Hospital-specific keywords (ONLY when explicitly about the hospital)
        hospital_keywords = [
            "this hospital", "your hospital", "in this hospital", "doctors in",
            "your doctors", "your specialists", "which doctor", "what doctor", 
            "who specializes", "doctor specialize", "your services", "hospital services",
            "your clinic", "your facility", "hospital perform", "hospital treat"
        ]
        
        # Check for hospital-specific queries (explicitly about the hospital)
        for keyword in hospital_keywords:
            if keyword in question_lower:
                return "hospital"
        
        # Special checks for hospital queries ONLY when there are direct references to doctors/specialists in the context
        if hospital_id:
            # "who is Dr. X" - specific doctor lookup
            if ("who is" in question_lower or "tell me about dr." in question_lower) and ("dr." in question_lower):
                return "hospital"
            
            # "Tell me about yourself" or "Who are you" - should return hospital info
            if any(phrase in question_lower for phrase in [
                "tell me about yourself", "who are you", "introduce yourself",
                "what are you", "describe yourself"
            ]):
                return "hospital"
            
            # Direct questions about whether hospital has specific specialists
            if any(phrase in question_lower for phrase in [
                "does this hospital", "does your hospital", "do you have a",
                "do you have an", "are there any", "is there a", "is there an"
            ]) and any(keyword in question_lower for keyword in ["doctor", "specialist", "specialists", "physician"]):
                return "hospital"
        
        # Health-related keywords (general medical questions)
        health_keywords = [
            "symptoms", "disease", "condition", "treatment", "medicine", "drug",
            "pain", "ache", "fever", "cough", "headache", "stomach", "heart",
            "blood", "pressure", "diabetes", "cancer", "covid", "flu", "cold",
            "allergy", "asthma", "depression", "anxiety", "sleep", "diet",
            "exercise", "health", "medical", "nurse", "patient", "what is",
            "tell me about"
        ]
        
        # Check for health-related content
        for keyword in health_keywords:
            if keyword in question_lower:
                return "health"
        
        # Default to health if unclear
        return "health"

    def _handle_health_query(
        self, 
        question: str, 
        hospital_id: str = None, 
        session_id: str = None, 
        conversation_history: List[Dict] = None,
        pii_manager: Optional[PIICollectionManager] = None
    ) -> Response:
        """
        Handle general health questions using OpenAI with knowledge base configuration.
        
        For generic health questions whose response does not come from the MCP server,
        this uses the hospital's knowledgebase configuration to guide the agent's response:
        - identity.system_prompt guides the agent's system prompt
        - behavior.communication_tone guides the agent's tone
        - behavior.response_length guides how the agent's response should be summarized
        """
        try:
            # Skip cache entirely - we need to check PII collection state and use conversation history
            # Cached responses bypass PII collection checks and conversation context
            from django.core.cache import cache
            logger.info(f"Processing health query (cache disabled for PII/context): {question[:50]}")
            
            # Get knowledge base configuration if hospital_id is provided
            knowledge_base = None
            if hospital_id:
                logger.info(f"Retrieving knowledge base for hospital {hospital_id} for health query")
                knowledge_base = self._get_knowledge_base(hospital_id)
                
                if knowledge_base:
                    logger.info(f"Using hospital-specific knowledge base: {knowledge_base.get('hospital_name')}")
                else:
                    logger.warning(f"No knowledge base found for hospital {hospital_id}, using defaults")
            
            # Check PII collection status BEFORE generating system prompt
            pii_collected = False
            name_collected = False
            phone_collected = False
            if pii_manager:
                pii_manager._refresh_profile()
                profile = pii_manager.profile
                name_collected = pii_manager._is_name_strictly_collected(profile)
                phone_collected = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
                pii_collected = name_collected and phone_collected
            
            # Build PII instructions based on collection status
            if pii_collected:
                # Both name and phone are already collected - tell AI NOT to ask for them
                pii_instructions = (
                    "\n\nIMPORTANT - USER INFORMATION STATUS:\n"
                    "The user has already provided their full name and phone number. "
                    "DO NOT ask for name or phone number again. Focus entirely on answering their health questions. "
                    "Continue the conversation naturally based on their questions and previous conversation context.\n"
                    "Always remember previous conversation context and refer back to it when relevant.\n"
                    "Keep the tone warm, respectful, and helpful."
                )
            elif name_collected and not phone_collected:
                # Name collected, need phone
                pii_instructions = (
                    "\n\nIDENTITY & CONTACT FLOW:\n"
                    "The user has already provided their full name. "
                    "You need to ask for their phone number (with country code) so you can reach them if follow-up care is needed. "
                    "If the phone number is invalid, do NOT repeat the same generic request. "
                    "Instead, apologize and clearly explain what format you need (for example, '+1234567890'). "
                    "Never request or prompt for an email address.\n"
                    "Always remember previous conversation context and refer back to it when relevant.\n"
                    "Keep the tone warm, respectful, and privacy-conscious."
                )
            else:
                # Need both name and phone
                pii_instructions = (
                    "\n\nIDENTITY & CONTACT FLOW:\n"
                    "1. After the user's first question, politely ask for their full name (first and last) before diving deeper. "
                    "Explain that you want to personalize their care. Wait until the user provides both names before moving on.\n"
                    "2. Once the full name is collected, immediately ask for the best phone number (with country code) so you can reach them if follow-up care is needed. "
                    "This phone number is required before continuing the conversation.\n"
                    "3. Validate phone numbers. If the number is invalid, do NOT repeat the same generic request. "
                    "Instead, apologize and clearly explain what format you need (for example, '+1234567890'). Encourage them to re-enter it correctly.\n"
                    "4. Never request or prompt for an email address. If a user volunteers an email, acknowledge it but do not ask for one.\n"
                    "5. Once both name and phone number are confirmed, continue helping with their medical questions normally.\n"
                    "6. Always remember previous conversation context and refer back to it when relevant.\n"
                    "Always keep the tone warm, respectful, and privacy-conscious."
                )
            
            if knowledge_base and knowledge_base.get('identity'):
                # Use knowledge base system prompt
                identity = knowledge_base.get('identity')
                system_prompt = identity.get('system_prompt', '') if identity else ''
                
                if not system_prompt:
                    system_prompt = """You are a helpful health assistant. Provide accurate, helpful information about health topics. 
                    Always remind users to consult with healthcare professionals for medical advice and diagnosis. 
                    Be empathetic, clear, and informative."""
                
                # Append PII collection instructions to knowledge base prompt
                system_prompt = system_prompt + pii_instructions
                logger.info(f"Using knowledgebase system prompt from hospital {knowledge_base.get('hospital_name', hospital_id)}")
            else:
                # Default system prompt with PII instructions
                system_prompt = (
                    """You are a helpful health assistant. Provide accurate, helpful information about health topics. 
                    Always remind users to consult with healthcare professionals for medical advice and diagnosis. 
                    Be empathetic, clear, and informative. If the question is not health-related, politely redirect to health topics."""
                    + pii_instructions
                )
                logger.info("Using default system prompt")
            
            # Get communication tone and style from knowledge base behavior configuration
            tone_instructions = ""
            if knowledge_base and knowledge_base.get('behavior'):
                behavior = knowledge_base.get('behavior')
                tone = behavior.get('communication_tone', 'Professional')
                style = behavior.get('communication_style', 'Conversational')
                confidence = behavior.get('confidence_level', 'Balanced')
                response_length = behavior.get('response_length', 'Medium')
                
                logger.info(f"Applying behavior settings: tone={tone}, style={style}, length={response_length}")
                
                # Build tone instructions based on values
                tone_map = {
                    'Empathic': 'Show empathy and understanding, use warm and supportive language',
                    'Authoritative': 'Be confident and decisive, show expertise and knowledge',
                    'Casual': 'Use a friendly and relaxed tone, be conversational',
                    'Friendly': 'Be warm and approachable, make the user feel comfortable',
                    'Professional': 'Be formal and respectful, maintain a professional demeanor'
                }
                
                style_map = {
                    'Conversational': 'Explain in simple, everyday language that anyone can understand',
                    'Technical & Clinical': 'Use precise medical terminology and clinical explanations',
                    'Detailed & Thorough': 'Provide comprehensive and detailed information',
                    'Concise & Direct': 'Keep responses brief and to the point'
                }
                
                confidence_map = {
                    'Conservative': 'Be cautious and conservative in your recommendations, suggest consulting healthcare professionals',
                    'Balanced': 'Provide balanced information with appropriate caution',
                    'Confident': 'Be confident in your knowledge while still recommending professional consultation'
                }
                
                length_map = {
                    'Short': 'Keep your response brief - 1-2 sentences, be concise',
                    'Medium': 'Provide a moderate length response - 3-5 sentences with key information',
                    'Long': 'Provide detailed explanations - multiple paragraphs if needed',
                    'Adaptive': 'Adapt response length based on question complexity'
                }
                
                tone_instruction = tone_map.get(tone, 'Be professional and empathetic')
                style_instruction = style_map.get(style, 'Be conversational and clear')
                confidence_instruction = confidence_map.get(confidence, 'Provide balanced information')
                length_instruction = length_map.get(response_length, 'Provide moderate length responses')
                
                # Build tone instructions based on behavior settings from knowledgebase
                tone_instructions = f"\n\nIMPORTANT INSTRUCTIONS:\n- Communication Tone: {tone_instruction}\n- Communication Style: {style_instruction}\n- Confidence Level: {confidence_instruction}\n- Response Length: {length_instruction}"
            
            # Add global concise response requirement (overrides behavior setting)
            concise_instruction = (
                "\n\n=== RESPONSE LENGTH - CRITICAL (OVERRIDES ALL OTHER SETTINGS) ===\n"
                "- ALL responses MUST be concise and clearly summarized in NOT MORE THAN 2.5 SENTENCES.\n"
                "- Ensure responses are easily comprehensible by users - avoid lengthy explanations.\n"
                "- Be clear, direct, and to the point while maintaining warmth and helpfulness.\n"
            )
            
            # Combine prompts
            full_system_prompt = system_prompt + tone_instructions + concise_instruction
            
            # Prepare context with conversation history
            context = {"system_prompt": full_system_prompt}
            if conversation_history:
                context["history"] = conversation_history
                context["history_limit"] = 10
                context["session_id"] = session_id
            
            # Use OpenAI service with knowledgebase-guided prompts (async optimized)
            response = asyncio.run(
                self.openai_service.generate_chat_response(
                    question, 
                    language="en", 
                    context=context
                )
            )
            
            # Don't cache responses - we need to check PII state and conversation context each time
            # Caching would bypass PII collection checks and prevent context-aware responses
            
            return Response({
                "success": True,
                "response": response,
                "query_type": "health",
                "hospital_id": hospital_id if hospital_id else None,
                "hospital_name": knowledge_base.get('hospital_name') if knowledge_base else None,
                "follow_up_questions": [
                    "Would you like to know more about this condition?",
                    "Do you need help finding a specialist?",
                    "Would you like to book an appointment with a doctor?"
                ]
            })
            
        except Exception as e:
            logger.error(f"Error handling health query: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({
                "success": False,
                "response": "I'm sorry, I'm having trouble processing your health question right now. Please try again or contact our support team.",
                "query_type": "health"
            })

    def _handle_hospital_query(self, question: str, hospital_id: str, session_id: str = None, conversation_history: List[Dict] = None) -> Response:
        """Handle hospital-specific queries using knowledge base configuration"""
        try:
            # Get knowledge base configuration
            knowledge_base = self._get_knowledge_base(hospital_id)
            
            # Get hospital details
            hospital_info = self._get_hospital_info(hospital_id)
            if not hospital_info:
                return Response({
                    "success": False,
                    "response": "Hospital not found. Please check the hospital ID and try again.",
                    "query_type": "hospital",
                    "follow_up_questions": [
                        "Would you like to search for another hospital?",
                        "Would you like help finding a hospital?",
                        "Would you like to contact our support team?"
                    ]
                })

            # Get MCP client for data queries
            mcp_client = get_mcp_client()
            
            # Check if this is a first-time greeting/intro query
            question_lower = question.lower()
            
            # Check for greeting/intro patterns (but exclude service-related questions)
            # Make sure "what are you" doesn't match "what are your services"
            is_greeting = any(phrase in question_lower for phrase in [
                "tell me about yourself", "who are you", "introduce yourself",
                "describe yourself", "hello", "hi"
            ]) or (
                "what are you" in question_lower and 
                "service" not in question_lower and 
                "offer" not in question_lower and
                "provide" not in question_lower
            )
            
            if is_greeting:
                # Use greeting message from knowledge base
                if knowledge_base and knowledge_base.get('response'):
                    greeting = knowledge_base['response'].get('greeting_message', '')
                    if greeting:
                        return Response({
                            "success": True,
                            "response": self._format_response_with_knowledge_base(
                                greeting, knowledge_base, hospital_info
                            ),
                            "query_type": "hospital",
                            "hospital_info": {
                                "id": hospital_info["id"],
                                "name": hospital_info["name"],
                                "city": hospital_info["city"],
                                "state": hospital_info["state"]
                            },
                            "follow_up_questions": self._get_knowledge_base_follow_ups(knowledge_base)
                        })
            
            # Process different types of hospital queries using knowledge base
            response = self._process_hospital_question_with_kb(question, hospital_info, knowledge_base, mcp_client)
            
            # Fallback if response is None
            if response is None:
                if knowledge_base and knowledge_base.get('response'):
                    fallback = knowledge_base['response'].get('fallback_response', '')
                    if fallback:
                        response = self._format_response_with_knowledge_base(
                            fallback, knowledge_base, hospital_info
                        )
                    else:
                        response = f"{hospital_info['name']} is a {hospital_info.get('hospital_type', 'medical')} hospital located in {hospital_info['city']}, {hospital_info['state']}. How can I help you today?"
                else:
                    response = f"{hospital_info['name']} is a {hospital_info.get('hospital_type', 'medical')} hospital located in {hospital_info['city']}, {hospital_info['state']}. How can I help you today?"
            
            # Determine appropriate follow-up questions
            follow_up_questions = self._get_hospital_follow_up_questions(question)
            if knowledge_base:
                kb_follow_ups = self._get_knowledge_base_follow_ups(knowledge_base)
                if kb_follow_ups:
                    follow_up_questions = kb_follow_ups
            
            # Add agent identity information
            agent_name = None
            agent_title = None
            if knowledge_base and knowledge_base.get('identity'):
                agent_name = knowledge_base['identity'].get('agent_name')
                agent_title = knowledge_base['identity'].get('agent_title')
            
            return Response({
                "success": True,
                "response": response,
                "query_type": "hospital",
                "hospital_info": {
                    "id": hospital_info["id"],
                    "name": hospital_info["name"],
                    "city": hospital_info["city"],
                    "state": hospital_info["state"]
                },
                "agent_name": agent_name,
                "agent_title": agent_title,
                "follow_up_questions": follow_up_questions
            })
            
        except Exception as e:
            logger.error(f"Error handling hospital query: {str(e)}")
            return Response({
                "success": False,
                "response": "I'm sorry, I'm having trouble accessing hospital information right now. Please try again later.",
                "query_type": "hospital",
                "follow_up_questions": [
                    "Would you like to try again?",
                    "Would you like to contact our support team?",
                    "Would you like to browse our services?"
                ]
            })

    def _handle_appointment_booking(
        self, 
        question: str, 
        hospital_id: str, 
        session_id: str = None, 
        chat_session = None,
        pii_manager: Optional[PIICollectionManager] = None
    ) -> Response:
        """Handle appointment booking with slot checking and knowledge base templates
        
        ALWAYS returns the appointment_booking response from knowledgebase first,
        irrespective of slot availability. If user provides appointment details
        (service, date, time), searches for #Appointments Guide in system prompts.
        """
        try:
            if not hospital_id:
                return Response({
                    "success": False,
                    "response": "To book an appointment, please provide a hospital ID. Which hospital would you like to book with?",
                    "query_type": "appointment"
                })

            # Get hospital info
            hospital_info = self._get_hospital_info(hospital_id)
            if not hospital_info:
                return Response({
                    "success": False,
                    "response": "Hospital not found. Please check the hospital ID and try again.",
                    "query_type": "appointment"
                })

            # Get knowledge base configuration
            knowledge_base = self._get_knowledge_base(hospital_id)
            
            # Get conversation history for context-aware appointment booking
            conversation_history = []
            if chat_session:
                try:
                    from core.chat_models import ChatMessage
                    previous_messages = ChatMessage.objects.filter(
                        session=chat_session
                    ).order_by("timestamp")[:10]
                    conversation_history = [
                        {
                            "message": msg.message,
                            "response": msg.response,
                            "timestamp": msg.timestamp.isoformat(),
                        }
                        for msg in previous_messages
                    ]
                except Exception as e:
                    logger.warning(f"Could not load conversation history: {e}")
            
            # Extract appointment details from current question AND conversation history
            appointment_details = self._extract_appointment_details(question, hospital_id)
            logger.info(f"Extracted appointment details from question '{question}': {appointment_details}")
            
            # If details are missing, check conversation history for previous mentions
            if conversation_history:
                logger.info(f"Checking conversation history ({len(conversation_history)} messages) for missing details")
                # Look for service mentions in previous messages
                for msg in reversed(conversation_history):
                    prev_details = self._extract_appointment_details(msg['message'], hospital_id)
                    if prev_details.get('service') and not appointment_details.get('service'):
                        appointment_details['service'] = prev_details['service']
                        logger.info(f"Found service '{prev_details['service']}' in conversation history")
                    if prev_details.get('doctor') and not appointment_details.get('doctor'):
                        appointment_details['doctor'] = prev_details['doctor']
                        appointment_details['doctor_id'] = prev_details.get('doctor_id')
                    if prev_details.get('date') and not appointment_details.get('date'):
                        appointment_details['date'] = prev_details['date']
                    if prev_details.get('time') and not appointment_details.get('time'):
                        appointment_details['time'] = prev_details['time']
            
            logger.info(f"Final appointment details: {appointment_details}")
            
            has_service = appointment_details.get('service') is not None
            has_date = appointment_details.get('date') is not None
            has_time = appointment_details.get('time') is not None
            has_doctor = appointment_details.get('doctor') is not None
            
            # Check if user has provided ALL required details (service, date, time)
            has_all_details = has_service and has_date and has_time
            
            # If user provided ALL appointment details, search for #Appointments Guide and show slots
            if has_all_details and knowledge_base:
                appointments_guide = self._find_appointments_guide(hospital_id, knowledge_base)
                if appointments_guide:
                    # Use the appointments guide to process the booking
                    return self._process_appointment_with_guide(
                        question, appointment_details, appointments_guide, 
                        hospital_info, knowledge_base, hospital_id, 
                        session_id=session_id, chat_session=chat_session
                    )
                else:
                    # If no guide found, still process with slots but limit to 3
                    return self._process_appointment_with_slots(
                        question, appointment_details, hospital_info, 
                        knowledge_base, hospital_id,
                        session_id=session_id, chat_session=chat_session
                    )
            
            # Check PII collection status BEFORE generating system prompt
            pii_collected = False
            name_collected = False
            phone_collected = False
            if pii_manager:
                pii_manager._refresh_profile()
                profile = pii_manager.profile
                name_collected = pii_manager._is_name_strictly_collected(profile)
                phone_collected = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
                pii_collected = name_collected and phone_collected
            
            # Build context-aware system prompt for appointment booking
            # IMPORTANT: Only ask for appointment details AFTER both name and phone are collected
            if pii_collected:
                # Both name and phone collected - NOW use knowledge base system prompt for appointment flow
                # This includes the "Appointment Type Determination" steps from AI Identity
                if knowledge_base and knowledge_base.get('identity'):
                    identity = knowledge_base.get('identity')
                    kb_system_prompt = identity.get('system_prompt', '') if identity else ''
                    
                    if kb_system_prompt:
                        # Build context-aware instructions based on what details are already collected
                        context_instructions = ""
                        if has_service:
                            service_name = appointment_details.get('service', '')
                            context_instructions = (
                                f"\n=== CURRENT BOOKING CONTEXT ===\n"
                                f"- Service/Specialty IDENTIFIED: {service_name}\n"
                                f"- The user has specified they want a {service_name} appointment.\n"
                                f"- Follow the 'Appointment Type Determination' flow from the knowledge base system prompt above.\n"
                                f"- Since service is already identified, proceed to the NEXT step in the flow:\n"
                                f"  * Step 2: Doctor preference - 'Do you have a specific doctor you'd like to see, or would you prefer the first available appointment?'\n"
                                f"  * OR proceed to Step 3 (new/returning patient) and Step 4 (urgency) if those are relevant\n"
                                f"- DO NOT say you don't have detailed information about {service_name} - instead:\n"
                                f"  * Acknowledge the service: 'Great! I can help you book a {service_name} appointment.'\n"
                                f"  * Use MCP tools (list_services, get_service_details, get_specialty_doctors) to find available doctors/slots for {service_name}\n"
                                f"  * Proceed with the appointment booking flow naturally according to the 'Appointment Type Determination' steps.\n"
                                f"- Be helpful and proactive - check for available services/doctors and proceed with booking.\n"
                            )
                        else:
                            context_instructions = (
                                "\n=== CURRENT BOOKING CONTEXT ===\n"
                                "- Service/Specialty NOT yet identified\n"
                                "- Follow the 'Appointment Type Determination' flow from the knowledge base system prompt above.\n"
                                "- Start with Step 1: Service identification - ask what type of appointment they need\n"
                                "- Use MCP tools (list_services, get_service_details) to find available services/specialties\n"
                            )
                        
                        # Use knowledge base system prompt which includes appointment type determination steps
                        system_prompt = (
                            f"{kb_system_prompt}\n\n"
                            "=== RESPONSE LENGTH - CRITICAL ===\n"
                            "- ALL responses MUST be concise and clearly summarized in NOT MORE THAN 2.5 SENTENCES.\n"
                            "- Ensure responses are easily comprehensible by users - avoid lengthy explanations.\n"
                            "- Be clear, direct, and to the point while maintaining warmth and helpfulness.\n\n"
                            "=== CURRENT APPOINTMENT BOOKING STATUS ===\n"
                            f"- The user has already provided their full name and phone number for {hospital_info['name']}.\n"
                            "- DO NOT ask for name or phone number again.\n"
                            "- PII collection is COMPLETE. Now proceed with appointment booking.\n"
                            f"{context_instructions}\n"
                            "=== CRITICAL INSTRUCTIONS - FOLLOW EXACTLY ===\n"
                            "1. ALWAYS follow the 'Appointment Type Determination' section from the knowledge base system prompt above step by step\n"
                            "2. DO NOT say 'I don't have detailed information' or 'I don't have information' - instead:\n"
                            "   * Use MCP tools to check for available services, doctors, and appointment slots\n"
                            "   * Acknowledge what the user wants and proceed with the booking flow\n"
                            "   * Be helpful and proactive\n"
                            "3. DO NOT ask generic questions like 'how can I assist you' - be specific and follow the flow\n"
                            "4. If a service/specialty is identified, acknowledge it and proceed to the next step in the 'Appointment Type Determination' flow\n"
                            "5. Be conversational, remember previous conversation context, and follow the appointment flow step by step.\n"
                            "6. Use available tools (MCP) to check for services, doctors, and appointment slots - always be helpful and proactive.\n"
                            "7. REMEMBER: Keep all responses concise (maximum 2.5 sentences) for easy comprehension.\n"
                        )
                        logger.info(f"Using knowledge base system prompt for appointment booking after PII collection (service identified: {has_service})")
                    else:
                        # Fallback if no knowledge base system prompt
                        system_prompt = (
                            f"You are a medical appointment booking assistant for {hospital_info['name']}.\n\n"
                            "=== RESPONSE LENGTH - CRITICAL ===\n"
                            "- ALL responses MUST be concise and clearly summarized in NOT MORE THAN 2.5 SENTENCES.\n"
                            "- Ensure responses are easily comprehensible by users - avoid lengthy explanations.\n"
                            "- Be clear, direct, and to the point while maintaining warmth and helpfulness.\n\n"
                            "The user has already provided their full name and phone number. DO NOT ask for name or phone number again.\n\n"
                            "=== CRITICAL INSTRUCTIONS - FOLLOW EXACTLY ===\n"
                            "1. IMMEDIATELY ask the user: 'What type of appointment do you need, or which specialist would you like to see?'\n"
                            "2. DO NOT ask generic questions like 'how can I assist you with booking your appointment' or 'how can I help you'\n"
                            "3. DO NOT ask about date/time until you know the appointment type/specialist first\n"
                            "4. Be direct and specific - ask about appointment type or specialist specialty (e.g., cardiologist, gynecologist, general consultation)\n"
                            "5. After the user provides appointment type/specialist, then proceed with date and time collection\n"
                            "6. Be conversational, remember previous conversation context, and follow the appointment flow step by step.\n"
                            "7. REMEMBER: Keep all responses concise (maximum 2.5 sentences) for easy comprehension.\n\n"
                            "EXAMPLE RESPONSE FORMAT:\n"
                            "'Thank you for providing your phone number, [Name]! What type of appointment do you need, or which specialist would you like to see? For example, are you looking for a consultation with a cardiologist, gynecologist, or general practitioner?'"
                        )
                else:
                    # No knowledge base available - use default
                    system_prompt = (
                        f"You are a medical appointment booking assistant for {hospital_info['name']}.\n\n"
                        "=== RESPONSE LENGTH - CRITICAL ===\n"
                        "- ALL responses MUST be concise and clearly summarized in NOT MORE THAN 2.5 SENTENCES.\n"
                        "- Ensure responses are easily comprehensible by users - avoid lengthy explanations.\n"
                        "- Be clear, direct, and to the point while maintaining warmth and helpfulness.\n\n"
                        "The user has already provided their full name and phone number. DO NOT ask for name or phone number again.\n\n"
                        "=== CRITICAL INSTRUCTIONS - FOLLOW EXACTLY ===\n"
                        "1. IMMEDIATELY ask the user: 'What type of appointment do you need, or which specialist would you like to see?'\n"
                        "2. DO NOT ask generic questions like 'how can I assist you with booking your appointment' or 'how can I help you'\n"
                        "3. DO NOT ask about date/time until you know the appointment type/specialist first\n"
                        "4. Be direct and specific - ask about appointment type or specialist specialty (e.g., cardiologist, gynecologist, general consultation)\n"
                        "5. After the user provides appointment type/specialist, then proceed with date and time collection\n"
                        "6. Be conversational, remember previous conversation context, and follow the appointment flow step by step.\n"
                        "7. REMEMBER: Keep all responses concise (maximum 2.5 sentences) for easy comprehension.\n\n"
                        "EXAMPLE RESPONSE FORMAT:\n"
                        "'Thank you for providing your phone number, [Name]! What type of appointment do you need, or which specialist would you like to see? For example, are you looking for a consultation with a cardiologist, gynecologist, or general practitioner?'"
                    )
            elif name_collected and not phone_collected:
                # Name collected, but phone NOT collected yet
                # DO NOT ask for appointment details - wait for phone number first
                system_prompt = (
                    f"You are a medical appointment booking assistant for {hospital_info['name']}.\n"
                    "The user has provided their name, but we still need their phone number before we can proceed with appointment booking. "
                    "DO NOT ask for appointment details (service, date, time) yet. "
                    "Simply acknowledge the user's name and wait for them to provide their phone number. "
                    "Be conversational and friendly, but do not mention appointment booking details until the phone number is collected."
                )
            else:
                # Neither name nor phone collected - DO NOT ask for appointment details
                system_prompt = (
                    f"You are a medical appointment booking assistant for {hospital_info['name']}.\n"
                    "The user wants to book an appointment, but we need to collect their contact information first. "
                    "DO NOT ask for appointment details (service, date, time, specialist) yet. "
                    "Simply acknowledge their request to book an appointment and wait for them to provide their name and phone number first. "
                    "Be conversational and friendly, but do not mention appointment booking details until both name and phone number are collected."
                )
            
            # Get communication tone and style from knowledge base behavior configuration
            # (Similar to health queries, but only apply when PII is collected)
            tone_instructions = ""
            if pii_collected and knowledge_base and knowledge_base.get('behavior'):
                behavior = knowledge_base.get('behavior')
                tone = behavior.get('communication_tone', 'Professional')
                style = behavior.get('communication_style', 'Conversational')
                confidence = behavior.get('confidence_level', 'Balanced')
                response_length = behavior.get('response_length', 'Medium')
                
                logger.info(f"Applying behavior settings for appointment: tone={tone}, style={style}, length={response_length}")
                
                # Build tone instructions based on values (same as health queries)
                tone_map = {
                    'Empathic': 'Show empathy and understanding, use warm and supportive language',
                    'Authoritative': 'Be confident and decisive, show expertise and knowledge',
                    'Casual': 'Use a friendly and relaxed tone, be conversational',
                    'Friendly': 'Be warm and approachable, make the user feel comfortable',
                    'Professional': 'Be formal and respectful, maintain a professional demeanor'
                }
                
                style_map = {
                    'Conversational': 'Explain in simple, everyday language that anyone can understand',
                    'Technical & Clinical': 'Use precise medical terminology and clinical explanations',
                    'Detailed & Thorough': 'Provide comprehensive and detailed information',
                    'Concise & Direct': 'Keep responses brief and to the point'
                }
                
                confidence_map = {
                    'Conservative': 'Be cautious and conservative in your recommendations, suggest consulting healthcare professionals',
                    'Balanced': 'Provide balanced information with appropriate caution',
                    'Confident': 'Be confident in your knowledge while still recommending professional consultation'
                }
                
                length_map = {
                    'Short': 'Keep your response brief - 1-2 sentences, be concise',
                    'Medium': 'Provide a moderate length response - 3-5 sentences with key information',
                    'Long': 'Provide detailed explanations - multiple paragraphs if needed',
                    'Adaptive': 'Adapt response length based on question complexity'
                }
                
                tone_instruction = tone_map.get(tone, 'Be professional and empathetic')
                style_instruction = style_map.get(style, 'Be conversational and clear')
                confidence_instruction = confidence_map.get(confidence, 'Provide balanced information')
                length_instruction = length_map.get(response_length, 'Provide moderate length responses')
                
                # Build tone instructions based on behavior settings from knowledgebase
                tone_instructions = f"\n\nIMPORTANT INSTRUCTIONS:\n- Communication Tone: {tone_instruction}\n- Communication Style: {style_instruction}\n- Confidence Level: {confidence_instruction}\n- Response Length: {length_instruction}"
            
            # Combine system prompt with tone instructions
            full_system_prompt = system_prompt + tone_instructions
            
            # Build user message with context
            user_message_parts = []
            if has_service:
                user_message_parts.append(f"Service: {appointment_details.get('service')}")
            if has_doctor:
                user_message_parts.append(f"Doctor: Dr. {appointment_details.get('doctor')}")
            if has_date:
                user_message_parts.append(f"Date: {appointment_details.get('date')}")
            if has_time:
                user_message_parts.append(f"Time: {appointment_details.get('time')}")
            
            # Create context for OpenAI call
            context = {
                "system_prompt": full_system_prompt,
                "session_id": session_id,
                "history_limit": 10
            }
            
            # Add conversation history if available
            if conversation_history:
                context["history"] = conversation_history
            
            # Use OpenAI to generate context-aware response
            try:
                response = asyncio.run(
                    self.openai_service.generate_chat_response(
                        question,
                        language="en",
                        context=context
                    )
                )
                
                # Get available slots if service/doctor provided
                if has_service or has_doctor:
                    available_slots = self._get_available_slots(hospital_id, appointment_details)
                    if available_slots:
                        slots_text = self._format_available_slots(available_slots[:3], limit=3, show_more_option=True)
                        # Append slots if not already mentioned
                        if "slot" not in response.lower() and "available" not in response.lower():
                            response += f"\n\nHere are some available slots:\n\n{slots_text}"
            except Exception as e:
                logger.error(f"Error generating OpenAI response: {e}")
                # Fallback to template-based response
                if knowledge_base and knowledge_base.get('response'):
                    appointment_template = knowledge_base['response'].get('appointment_booking', '')
                    if appointment_template:
                        response = self._format_response_with_knowledge_base(
                            appointment_template, knowledge_base, hospital_info
                        )
                    else:
                        response = f"I can help you book an appointment at {hospital_info['name']}. Please let me know your preferred service, date, and time."
                else:
                    response = f"I can help you book an appointment at {hospital_info['name']}. Please let me know your preferred service, date, and time."
            
            # Check what details are missing and provide appropriate follow-up
            missing_details = []
            if not has_service:
                missing_details.append("service")
            if not has_date:
                missing_details.append("date")
            if not has_time:
                missing_details.append("time")
            
            # Add helpful follow-up based on what's missing
            if missing_details:
                if len(missing_details) == 3:
                    follow_ups = [
                        "Which service are you interested in?",
                        "What date works best for you?",
                        "Do you have a preferred time?"
                    ]
                elif len(missing_details) == 2:
                    follow_ups = [
                        f"Please provide your preferred {' and '.join(missing_details)}."
                    ]
                else:
                    follow_ups = [
                        f"Please provide your preferred {missing_details[0]}."
                    ]
            else:
                follow_ups = []
            
            # Get follow-up questions from knowledge base if available
            if knowledge_base:
                kb_follow_ups = self._get_knowledge_base_follow_ups(knowledge_base)
                if kb_follow_ups and not missing_details:
                    follow_ups = kb_follow_ups
            
            return Response({
                "success": True,
                "response": response,
                "query_type": "appointment",
                "hospital_info": {
                    "id": hospital_info["id"],
                    "name": hospital_info["name"]
                },
                "appointment_options": [],  # NO slots shown until all details provided
                "follow_up_questions": follow_ups if follow_ups else [
                    "Which service are you interested in?",
                    "What date works best for you?",
                    "Do you have a preferred time?"
                ]
            })
            
        except Exception as e:
            logger.error(f"Error handling appointment booking: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({
                "success": False,
                "response": "I'm sorry, I'm having trouble processing your appointment request right now. Please try again later or contact the hospital directly.",
                "query_type": "appointment"
            })

    def _get_hospital_follow_up_questions(self, question: str) -> List[str]:
        """Get contextual follow-up questions based on the type of hospital query"""
        question_lower = question.lower()
        
        # Check if asking about a specific doctor
        if ("who is" in question_lower or "tell me about" in question_lower) and ("dr." in question_lower or "doctor" in question_lower):
            return [
                "Would you like to see other doctors available at this hospital?",
                "Would you like to book an appointment with another doctor?",
                "Would you like to know about our specialist services?"
            ]
        
        # Check if asking about specialists/specialties
        if "specialist" in question_lower or "specialty" in question_lower or "specialize" in question_lower:
            return [
                "Would you like to know about other specialists available?",
                "Would you like to book an appointment with a specialist?",
                "Would you like more details about any specific specialty?"
            ]
        
        # Check if asking about services
        if "service" in question_lower or "offer" in question_lower or "provide" in question_lower:
            return [
                "Would you like to know more about any specific service?",
                "Would you like to book an appointment for a service?",
                "Would you like pricing information?"
            ]
        
        # Check if asking about doctors
        if "doctor" in question_lower or "physician" in question_lower:
            return [
                "Would you like to see doctors in a specific specialty?",
                "Would you like to book an appointment?",
                "Would you like to know about our doctors' experience and qualifications?"
            ]
        
        # Check if asking about procedures/surgery
        if "procedure" in question_lower or "surgery" in question_lower or "perform" in question_lower:
            return [
                "Would you like to know more about this procedure?",
                "Would you like to book a consultation?",
                "Would you like to know about our surgical capabilities?"
            ]
        
        # Default hospital follow-up questions
        return [
            "Would you like to know about our doctors?",
            "Would you like to see our available services?",
            "Would you like to book an appointment?"
        ]
    
    def _get_hospital_info(self, hospital_id: str) -> Optional[Dict]:
        """Get hospital information from database"""
        try:
            hospital = Hospital.objects.get(id=hospital_id, is_active=True)
            return {
                "id": str(hospital.id),
                "name": hospital.name,
                "city": hospital.city,
                "state": hospital.state,
                "hospital_type": hospital.hospital_type,
                "phone_number": hospital.phone_number,
                "email": hospital.email
            }
        except Hospital.DoesNotExist:
            return None

    def _process_hospital_question_with_kb(self, question: str, hospital_info: Dict, knowledge_base: Optional[Dict], mcp_client) -> str:
        """Process hospital-specific questions using knowledge base and MCP server"""
        # First check if question matches any response templates
        question_lower = question.lower()
        
        # Check for appointment booking
        if any(keyword in question_lower for keyword in ["book", "appointment", "schedule", "appointments"]):
            if knowledge_base and knowledge_base.get('response'):
                appointment_template = knowledge_base['response'].get('appointment_booking', '')
                if appointment_template:
                    return self._format_response_with_knowledge_base(
                        appointment_template, knowledge_base, hospital_info
                    )
        
        # Check for business hours
        if any(keyword in question_lower for keyword in ["hours", "open", "closed", "available", "when are you"]):
            if knowledge_base and knowledge_base.get('response'):
                hours_template = knowledge_base['response'].get('business_hours', '')
                if hours_template:
                    return self._format_response_with_knowledge_base(
                        hours_template, knowledge_base, hospital_info
                    )
        
        # Check for services list queries FIRST (before specialties check)
        # This handles "what are your services", "what services do you offer", etc.
        services_phrases = ["what are your services", "what services do you", "what services do we", 
                          "list your services", "show me your services", "what services", 
                          "your services", "services you offer", "services do you"]
        if any(phrase in question_lower for phrase in services_phrases):
            # Route to services list, not specialties template
            logger.info(f"Matched services phrase in question: '{question}' - routing to services list")
            return self._process_hospital_question(question, hospital_info, mcp_client)
        
        # Check for general services keyword (but exclude specialty-related queries)
        if any(keyword in question_lower for keyword in ["services", "service", "offer", "offering", "provide", "offered", "offers"]):
            # Only route to services list if it's not a specialty query
            if "specialty" not in question_lower and "specialist" not in question_lower:
                return self._process_hospital_question(question, hospital_info, mcp_client)
        
        # Check for medical specialties (only for specialty-specific queries, not general services)
        if any(keyword in question_lower for keyword in ["specialty", "specialties", "specialist"]) and "services" not in question_lower:
            if knowledge_base and knowledge_base.get('response'):
                specialties_template = knowledge_base['response'].get('medical_specialties', '')
                if specialties_template:
                    return self._format_response_with_knowledge_base(
                        specialties_template, knowledge_base, hospital_info
                    )
        
        # Check for general inquiries
        if any(keyword in question_lower for keyword in ["information", "general", "inquiry", "help"]):
            if knowledge_base and knowledge_base.get('response'):
                general_template = knowledge_base['response'].get('general_inquiries', '')
                if general_template:
                    return self._format_response_with_knowledge_base(
                        general_template, knowledge_base, hospital_info
                    )
        
        # For other queries, fall back to original processing with MCP
        return self._process_hospital_question(question, hospital_info, mcp_client)
    
    def _process_hospital_question(self, question: str, hospital_info: Dict, mcp_client) -> str:
        """Process hospital-specific questions using MCP server"""
        question_lower = question.lower()
        logger.info(f"Processing hospital question: '{question}' with lower: '{question_lower}'")
        
        try:
            # Check for "who is Dr. X" or "who is doctor X" queries FIRST
            if ("who is" in question_lower or "tell me about" in question_lower or "about doctor" in question_lower) and ("dr." in question_lower or "doctor" in question_lower):
                logger.info(f"Matched 'who is doctor' pattern")
                return self._get_doctor_info_by_name(question, hospital_info["id"])
            
            # Check for "which doctor specializes in" queries FIRST
            if ("doctor" in question_lower and "specialize" in question_lower) or ("which doctor" in question_lower):
                logger.info(f"Matched 'which doctor specializes' pattern")
                # Extract specialty from question
                specialty_keywords = {
                    "Gynecology": ["gynecology", "gynecologist", "gyno", "women's health"],
                    "Cardiology": ["cardiology", "cardiologist", "heart", "cardiac"],
                    "Pediatrics": ["pediatrics", "pediatrician", "children", "kids"],
                    "Neurology": ["neurology", "neurologist", "brain"],
                    "Orthopedics": ["orthopedics", "orthopedic", "orthopedist"],
                    "Oncology": ["oncology", "oncologist", "cancer"],
                    "Emergency Medicine": ["emergency", "emergency medicine"],
                    "General Medicine": ["general medicine", "general practitioner", "gp", "family"]
                }
                
                for specialty, keywords in specialty_keywords.items():
                    if any(kw in question_lower for kw in keywords):
                        logger.info(f"Found specialty '{specialty}' in question")
                        return self._check_specialist_doctors(hospital_info["id"], specialty)
                
                # If no specific specialty found, return doctor list
                return self._get_hospital_doctors(hospital_info["id"])
            
            # Check for "which specialists" queries
            if ("specialists" in question_lower and (
                    "which" in question_lower or 
                    "what" in question_lower or 
                    "what kind" in question_lower or
                    "types of" in question_lower or
                    "list" in question_lower
                )):
                logger.info(f"Matched 'which specialists' keyword pattern for question: '{question_lower}'")
                response = self._get_specialties_list(hospital_info["id"])
                logger.info(f"_get_specialties_list returned: {response[:100] if response else 'None'}")
                return response
            
            # Check for service-related queries
            elif any(keyword in question_lower for keyword in ["services", "service", "offer", "offering", "provide", "offered", "offers"]):
                logger.info(f"Matched services keyword in question: '{question}' - calling _get_hospital_services_list")
                return self._get_hospital_services_list(hospital_info["id"], question)
            
            # Check for price/cost queries
            elif any(keyword in question_lower for keyword in ["price", "cost", "pricing", "charge", "charges", "how much"]):
                return self._get_hospital_services_pricing(hospital_info["id"])
            
            # Check for "do you have" specialist queries with specific specialty mentioned
            elif "do you have" in question_lower or "have you got" in question_lower or "do we have" in question_lower:
                # Try to extract specialty from question
                specialty_keywords = {
                    "Cardiology": ["heart", "cardiac", "cardiologist", "cardiology"],
                    "Gynecology": ["gynecologist", "gyno", "women's", "obstetrician"],
                    "Pediatrics": ["pediatrician", "children", "kids", "pediatrics"],
                    "Neurology": ["neurologist", "brain", "nerve", "neurology"],
                    "Oncology": ["oncologist", "cancer", "oncology"],
                    "Orthopedics": ["orthopedic", "orthopedist", "bone", "joint"],
                    "Dermatology": ["dermatologist", "skin"],
                    "Psychiatry": ["psychiatrist", "mental", "psychiatry"],
                    "Radiology": ["radiologist", "imaging", "radiology"],
                    "Surgery": ["surgeon", "surgery"],
                    "Emergency Medicine": ["emergency", "er", "trauma"],
                }
                
                # Check if there's a specific specialty mentioned (but NOT just "specialists")
                found_specific_specialty = False
                for specialty, keywords in specialty_keywords.items():
                    if any(kw in question_lower for kw in keywords) and "specialist" not in question_lower:
                        found_specific_specialty = True
                        return self._check_specialist_doctors(hospital_info["id"], specialty)
                
                # If asking "do you have specialists" without specific specialty, fall through to handle elsewhere
                if not found_specific_specialty and "specialist" not in question_lower:
                    pass
            
            # Check for specific specialists
            elif any(specialist in question_lower for specialist in ["gynecologist", "gyno", "obstetrician"]):
                return self._check_specialist_availability(hospital_info["id"], "Gynecology")
            
            elif any(specialist in question_lower for specialist in ["cardiologist", "cardiology"]):
                return self._check_specialist_doctors(hospital_info["id"], "Cardiology")
            
            elif any(specialist in question_lower for specialist in ["neurologist", "brain", "neurology"]):
                return self._check_specialist_availability(hospital_info["id"], "Neurology")
            
            elif any(specialist in question_lower for specialist in ["surgeon", "surgery", "surgical"]):
                return self._check_specialist_availability(hospital_info["id"], "Surgery")
            
            # Check for diseases/conditions treated
            elif any(keyword in question_lower for keyword in ["diseases", "conditions", "treat", "treats"]):
                return self._get_hospital_services(hospital_info)
            
            # Check for doctor count queries
            elif any(keyword in question_lower for keyword in ["how many doctors", "number of doctors", "doctor count", "total doctors"]):
                return self._get_doctor_count(hospital_info["id"])
            
            # Check for specific specialist queries
            elif any(keyword in question_lower for keyword in ["cardiologist", "cardiology doctor", "heart specialist", "heart doctor"]):
                return self._check_specialist_doctors(hospital_info["id"], "Cardiology")
            elif any(keyword in question_lower for keyword in ["gynecologist", "gyno", "obstetrician", "women's health"]):
                return self._check_specialist_doctors(hospital_info["id"], "Gynecology")
            elif any(keyword in question_lower for keyword in ["pediatrician", "pediatrics doctor", "children's doctor"]):
                return self._check_specialist_doctors(hospital_info["id"], "Pediatrics")
            elif any(keyword in question_lower for keyword in ["neurologist", "brain specialist", "neurology doctor"]):
                return self._check_specialist_doctors(hospital_info["id"], "Neurology")
            elif any(keyword in question_lower for keyword in ["oncologist", "cancer specialist", "oncology doctor"]):
                return self._check_specialist_doctors(hospital_info["id"], "Oncology")
            elif any(keyword in question_lower for keyword in ["orthopedic", "orthopedist", "bone specialist"]):
                return self._check_specialist_doctors(hospital_info["id"], "Orthopedics")
            
            # Check for general specialist count queries
            elif any(keyword in question_lower for keyword in ["how many specialist doctors", "how many specialists", "specialist count"]):
                return self._count_specialists(hospital_info["id"])
            
            # Check for doctors list (but not for "which specialists" or "what specialists")
            elif any(keyword in question_lower for keyword in ["doctors", "physicians", "list doctors"]) and "which specialists" not in question_lower and "what specialists" not in question_lower:
                return self._get_hospital_doctors(hospital_info["id"])
            
            # Check for specific procedures
            elif any(keyword in question_lower for keyword in ["brain surgery", "surgery", "procedure", "perform"]):
                return self._check_procedure_availability(hospital_info["id"], question)
            
            # General hospital information
            else:
                return f"{hospital_info['name']} is a {hospital_info['hospital_type']} hospital located in {hospital_info['city']}, {hospital_info['state']}. We provide comprehensive healthcare services. For specific information about our services, doctors, or to book an appointment, please let me know what you're looking for."
        
        except Exception as e:
            logger.error(f"Error processing hospital question: {str(e)}")
            return f"I can provide general information about {hospital_info['name']}, but I'm having trouble accessing detailed information right now. Please contact us directly at {hospital_info['phone_number']} for more specific information."

    def _check_specialist_availability(self, hospital_id: str, specialty_name: str) -> str:
        """Check if a specific specialist is available at the hospital"""
        try:
            # Get specialty
            specialty = Specialty.objects.filter(name__icontains=specialty_name).first()
            if not specialty:
                return f"I'm sorry, we don't have {specialty_name} specialists at this hospital. Please contact us for information about available specialties."
            
            # Get doctors with this specialty in this hospital
            doctor_specialties = DoctorSpecialty.objects.filter(
                specialty=specialty,
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            )
            
            if not doctor_specialties.exists():
                return f"I'm sorry, we don't currently have any {specialty_name} specialists available at this hospital. Please contact us for information about when this service might be available."
            
            doctors = [ds.doctor for ds in doctor_specialties]
            doctor_names = [f"Dr. {doctor.first_name} {doctor.last_name}" for doctor in doctors]
            
            return f"Yes! We have {len(doctors)} {specialty_name} specialist(s) available: {', '.join(doctor_names)}. Would you like to book an appointment with any of them?"
        
        except Exception as e:
            logger.error(f"Error checking specialist availability: {str(e)}")
            return f"I'm having trouble checking {specialty_name} availability right now. Please contact us directly for more information."

    def _get_hospital_services(self, hospital_info: Dict) -> str:
        """Get information about diseases/conditions treated at the hospital"""
        try:
            # Get all specialties available at this hospital
            specialties = Specialty.objects.filter(
                doctorspecialty__doctor__hospital_id=hospital_info["id"],
                doctorspecialty__doctor__is_active=True
            ).distinct()
            
            if not specialties.exists():
                return f"{hospital_info['name']} provides general healthcare services. Please contact us directly for specific information about the conditions we treat."
            
            specialty_names = [specialty.name for specialty in specialties]
            
            return f"{hospital_info['name']} treats a wide range of conditions including: {', '.join(specialty_names[:10])}. We have specialists in these areas to provide comprehensive care. Would you like to know more about any specific condition or book an appointment?"
        
        except Exception as e:
            logger.error(f"Error getting hospital services: {str(e)}")
            return f"{hospital_info['name']} provides comprehensive healthcare services. Please contact us directly for specific information about the conditions we treat."
    
    def _get_hospital_services_list(self, hospital_id: str, question: str) -> str:
        """Get list of services offered by the hospital"""
        try:
            # Get all services for this hospital
            services = Service.objects.filter(hospital_id=hospital_id)
            
            if not services.exists():
                return "I'm sorry, we don't have any services listed yet. Please contact us directly for information about the services we offer."
            
            services_list = []
            for service in services:
                price_str = f" - ${service.price:.2f}" if service.price else ""
                services_list.append(f"{service.service_name}{price_str}")
            
            response = f"We offer the following services:\n\n"
            response += "\n".join(services_list)
            response += "\n\nWould you like more information about any specific service or to book an appointment?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error getting hospital services list: {str(e)}")
            return "I'm having trouble retrieving the services list right now. Please contact us directly for information about our services."
    
    def _get_hospital_services_pricing(self, hospital_id: str) -> str:
        """Get pricing information for all services"""
        try:
            # Get all services for this hospital
            services = Service.objects.filter(hospital_id=hospital_id).order_by('service_name')
            
            if not services.exists():
                return "I'm sorry, we don't have any services with pricing listed yet. Please contact us directly for pricing information."
            
            services_with_prices = []
            total_value = 0
            for service in services:
                if service.price:
                    price_str = f"${service.price:.2f}"
                    services_with_prices.append(f"{service.service_name}: {price_str}")
                    total_value += float(service.price)
            
            if not services_with_prices:
                return "I'm sorry, we don't have pricing information available yet. Please contact us directly for pricing details."
            
            response = f"Here are our service prices:\n\n"
            response += "\n".join(services_with_prices)
            
            if total_value > 0:
                avg_price = total_value / len(services_with_prices) if services_with_prices else 0
                response += f"\n\nAverage service price: ${avg_price:.2f}"
            
            response += "\n\nWould you like to book any of these services?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error getting hospital services pricing: {str(e)}")
            return "I'm having trouble retrieving pricing information right now. Please contact us directly for pricing details."

    def _get_hospital_doctors(self, hospital_id: str) -> str:
        """Get list of doctors at the hospital"""
        try:
            doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            ).select_related('specialization').prefetch_related('doctor_specialties__specialty')
            
            if not doctors.exists():
                return "I'm sorry, we don't have any doctors currently available at this hospital. Please contact us directly for more information."
            
            # Count total doctors
            total_count = doctors.count()
            
            # Get specialty breakdown
            from specialty.models import DoctorSpecialty
            specialty_counts = {}
            for doctor in doctors:
                for ds in doctor.doctor_specialties.all():
                    spec_name = ds.specialty.name
                    specialty_counts[spec_name] = specialty_counts.get(spec_name, 0) + 1
            
            # Build response
            response = f"We have {total_count} doctor(s) available at our hospital."
            
            if specialty_counts:
                response += f"\n\nOur doctors specialize in the following areas:\n"
                for spec, count in specialty_counts.items():
                    response += f"- {spec}: {count} doctor(s)\n"
            
            # List some doctors
            doctor_list = []
            for doctor in doctors[:5]:  # Show first 5 doctors
                primary_specialty = "General Practice"
                for ds in doctor.doctor_specialties.all():
                    if ds.is_primary:
                        primary_specialty = ds.specialty.name
                        break
                doctor_list.append(f"Dr. {doctor.first_name} {doctor.last_name} - {primary_specialty}")
            
            response += f"\nSome of our doctors include:\n"
            for doctor_info in doctor_list:
                response += f"- {doctor_info}\n"
            
            response += "\nWould you like to book an appointment with any of them?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error getting hospital doctors: {str(e)}")
            return "I'm having trouble retrieving the doctor list right now. Please contact us directly for more information."
    
    def _count_hospital_doctors(self, hospital_id: str) -> str:
        """Count total doctors in the hospital"""
        try:
            total_doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            ).count()
            
            if total_doctors == 0:
                return "We currently don't have any active doctors at this hospital. Please contact us for more information."
            
            return f"We have {total_doctors} active doctor(s) at our hospital. Would you like to know more about our specialists?"
        
        except Exception as e:
            logger.error(f"Error counting hospital doctors: {str(e)}")
            return "I'm having trouble retrieving the doctor count right now. Please contact us directly for more information."
    
    def _check_specialist_doctors(self, hospital_id: str, specialty_name: str) -> str:
        """Check if the hospital has doctors with a specific specialty"""
        try:
            from specialty.models import DoctorSpecialty, Specialty
            
            # Find specialty
            specialty = Specialty.objects.filter(name__icontains=specialty_name).first()
            
            if not specialty:
                return f"I'm sorry, we don't have any {specialty_name} specialists at this hospital."
            
            # Count doctors with this specialty
            count = DoctorSpecialty.objects.filter(
                specialty=specialty,
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).count()
            
            if count == 0:
                return f"Unfortunately, we don't currently have any {specialty_name} specialists available. We can refer you to a facility that does."
            
            # Get the doctors
            doctor_specialties = DoctorSpecialty.objects.filter(
                specialty=specialty,
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).select_related('doctor')[:5]
            
            doctor_list = []
            for ds in doctor_specialties:
                doctor = ds.doctor
                doctor_list.append(f"Dr. {doctor.first_name} {doctor.last_name}")
            
            response = f"Yes! We have {count} {specialty_name} specialist(s) available: {', '.join(doctor_list)}"
            
            if count > 5:
                response += f" and {count - 5} more."
            
            response += "\n\nWould you like to book an appointment with any of them?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error checking specialist doctors: {str(e)}")
            return f"I'm having trouble checking {specialty_name} availability right now. Please contact us directly for more information."
    
    def _count_specialists(self, hospital_id: str) -> str:
        """Count total specialists in the hospital"""
        try:
            from specialty.models import DoctorSpecialty
            
            # Count doctors with specialties
            specialists = DoctorSpecialty.objects.filter(
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).distinct('doctor').count()
            
            # Count unique specialties
            unique_specialties = DoctorSpecialty.objects.filter(
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).values('specialty__name').distinct().count()
            
            total_doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            ).count()
            
            return f"We have {specialists} specialist doctor(s) across {unique_specialties} different specialties. Our hospital has a total of {total_doctors} active doctors."
        
        except Exception as e:
            logger.error(f"Error counting specialists: {str(e)}")
            return "I'm having trouble retrieving specialist information right now. Please contact us directly for more information."
    
    def _get_specialties_list(self, hospital_id: str) -> str:
        """Get list of all specialties available at the hospital"""
        try:
            logger.info(f"Getting specialties list for hospital: {hospital_id}")
            
            # Get all doctors with specialties at this hospital
            doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            )
            
            logger.info(f"Found {doctors.count()} doctors at this hospital")
            
            if not doctors.exists():
                return "We currently don't have any doctors at this hospital. Please contact us for information about available medical services."
            
            # Collect unique specialties with counts
            specialty_counts = {}
            for doctor in doctors:
                doctor_specs = DoctorSpecialty.objects.filter(doctor=doctor)
                logger.info(f"Doctor {doctor.first_name} {doctor.last_name} has {doctor_specs.count()} specialties")
                
                for ds in doctor_specs:
                    spec_name = ds.specialty.name
                    if spec_name not in specialty_counts:
                        specialty_counts[spec_name] = 0
                    specialty_counts[spec_name] += 1
            
            logger.info(f"Collected specialties: {specialty_counts}")
            
            if not specialty_counts:
                return "Our doctors deal with general medical issues and provide comprehensive primary care services. For specific specialist needs, please contact us directly to discuss your requirements."
            
            # Build response
            response = "Our hospital has specialists in the following areas:\n\n"
            
            specialty_list = []
            for spec_name, count in sorted(specialty_counts.items()):
                specialty_list.append(f"- {spec_name}: {count} specialist(s)")
            
            response += "\n".join(specialty_list)
            response += "\n\nWould you like to know more about any specific specialty or book an appointment?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error getting specialties list: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "I'm having trouble retrieving specialty information right now. Please contact us directly for more information."
    
    def _get_doctor_info_by_name(self, question: str, hospital_id: str) -> str:
        """Get doctor information by name from the database"""
        try:
            logger.info(f"Getting doctor info from question: '{question}'")
            
            # Extract doctor name from question (look for Dr. X or Doctor X patterns)
            import re
            # Match patterns like "Dr. Crayon Azu", "Dr Crayon Azu", "Doctor Crayon Azu"
            pattern = r'(?:Dr\.?|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)'
            match = re.search(pattern, question, re.IGNORECASE)
            
            if not match:
                # Try without title
                pattern = r'(?:Dr\.?|Doctor)\s+(\w+)\s+(\w+)'
                match = re.search(pattern, question, re.IGNORECASE)
            
            if not match:
                logger.warning(f"Could not extract doctor name from: '{question}'")
                return "I couldn't find the doctor's name in your question. Please specify the doctor's full name."
            
            if len(match.groups()) == 1:
                # Full name match like "Dr. Crayon Azu"
                full_name = match.group(1)
            else:
                # Two separate words like "Dr. Crayon Azu"
                first_name = match.group(1)
                last_name = match.group(2)
                full_name = f"{first_name} {last_name}"
            
            logger.info(f"Extracted doctor name: '{full_name}'")
            
            # Search for doctor in the hospital
            doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            )
            
            # Try to find doctor by full name (partial match)
            doctor = None
            query_name_lower = full_name.lower()
            
            # Split query name into parts
            query_parts = query_name_lower.split()
            
            for doc in doctors:
                doc_full_name_lower = f"{doc.first_name} {doc.last_name}".lower()
                
                # Check for exact match
                if doc_full_name_lower == query_name_lower:
                    doctor = doc
                    break
                
                # Check if query name contains doctor's name
                if query_name_lower in doc_full_name_lower:
                    doctor = doc
                    break
                
                # Check if doctor's name contains query name
                if doc_full_name_lower in query_name_lower:
                    doctor = doc
                    break
                
                # Check if all parts of query name are found in doctor's name
                if len(query_parts) >= 2:
                    if all(part in doc_full_name_lower for part in query_parts):
                        doctor = doc
                        break
            
            if not doctor:
                logger.warning(f"Doctor '{full_name}' not found in hospital")
                return f"I couldn't find a doctor named '{full_name}' at this hospital. Please check the spelling or contact us for the correct name."
            
            logger.info(f"Found doctor: {doctor.first_name} {doctor.last_name}")
            
            # Build comprehensive doctor profile
            info_parts = [f"Here's information about Dr. {doctor.first_name} {doctor.last_name}:\n"]
            
            # Basic info
            info_parts.append(f"Name: Dr. {doctor.first_name} {doctor.last_name}")
            
            if doctor.email:
                info_parts.append(f"Contact: {doctor.email}")
            
            # Note: Phone number is intentionally omitted for privacy
            # if doctor.phone_number:
            #     info_parts.append(f"Phone: {doctor.phone_number}")
            
            # Specialties
            specialties = DoctorSpecialty.objects.filter(doctor=doctor).select_related('specialty')
            if specialties.exists():
                spec_names = [ds.specialty.name for ds in specialties]
                info_parts.append(f"Specialties: {', '.join(spec_names)}")
            
            if doctor.specialization:
                info_parts.append(f"Primary Specialization: {doctor.specialization.name}")
            
            if doctor.department:
                info_parts.append(f"Department: {doctor.department}")
            
            if doctor.years_of_experience:
                info_parts.append(f"Years of Experience: {doctor.years_of_experience}")
            
            if doctor.bio:
                info_parts.append(f"\nAbout: {doctor.bio}")
            
            if doctor.license_number:
                info_parts.append(f"License Number: {doctor.license_number}")
            
            # Certifications
            certifications = Certification.objects.filter(
                user=doctor,
                is_active=True
            ).order_by('-created_at')
            
            if certifications.exists():
                info_parts.append("\nCertifications:")
                for cert in certifications[:5]:  # Limit to 5 most recent
                    cert_info = f"- {cert.certification_name}"
                    if cert.certification_type:
                        cert_info += f" ({cert.get_certification_type_display()})"
                    if cert.issue_date:
                        cert_info += f" - Issued: {cert.issue_date}"
                    if cert.expiry_date:
                        cert_info += f" - Expires: {cert.expiry_date}"
                    info_parts.append(cert_info)
                    
                    # Special handling for CV/Resume - read file contents
                    if cert.certification_type == "CV_RESUME" and cert.file_document:
                        try:
                            # Read the CV/resume file content
                            cv_content = self._read_cv_content(cert.file_document)
                            if cv_content:
                                info_parts.append(f"\n  CV/Resume Content:\n{cv_content}")
                            else:
                                info_parts.append(f"  CV/Resume: Available in their profile")
                        except Exception as e:
                            logger.error(f"Error reading CV/Resume: {str(e)}")
                            info_parts.append(f"  CV/Resume: Available in their profile")
            
            # Social media links
            social_links = []
            if doctor.linkedin_url:
                social_links.append(f"LinkedIn: {doctor.linkedin_url}")
            if doctor.facebook_url:
                social_links.append(f"Facebook: {doctor.facebook_url}")
            if doctor.twitter_url:
                social_links.append(f"Twitter: {doctor.twitter_url}")
            
            if social_links:
                info_parts.append("\nSocial Media:")
                info_parts.extend(social_links)
            
            info_parts.append(f"\nTo book an appointment with Dr. {doctor.first_name} {doctor.last_name}, please let me know your preferred date and time.")
            
            response = "\n".join(info_parts)
            return response
        
        except Exception as e:
            logger.error(f"Error getting doctor info: {str(e)}")
            logger.error(traceback.format_exc())
            return "I'm having trouble retrieving doctor information right now. Please contact us directly."
    
    def _read_cv_content(self, file_field) -> Optional[str]:
        """Read CV/Resume file content"""
        try:
            if not file_field:
                return None
            
            # Check file extension
            file_name = file_field.name.lower()
            
            # Handle text files (.txt, .md, etc.)
            if file_name.endswith(('.txt', '.md', '.text')):
                try:
                    file_field.open()
                    content = file_field.read()
                    file_field.close()
                    # Try to decode as UTF-8, fall back to latin-1 if that fails
                    if isinstance(content, bytes):
                        try:
                            return content.decode('utf-8')
                        except UnicodeDecodeError:
                            return content.decode('latin-1')
                    return content
                except Exception as e:
                    logger.error(f"Error reading text file: {str(e)}")
                    return None
            
            # Handle PDF files
            if file_name.endswith('.pdf'):
                try:
                    import PyPDF2
                    file_field.open()
                    pdf_reader = PyPDF2.PdfReader(file_field)
                    text_content = ""
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                    file_field.close()
                    return text_content
                except ImportError:
                    logger.warning("PyPDF2 not installed, cannot read PDF files")
                    return "PDF file: Content cannot be extracted (install PyPDF2 to enable)"
                except Exception as e:
                    logger.error(f"Error reading PDF file: {str(e)}")
                    return None
            
            # For other file types, return a generic message
            return f"File available: {file_name} (content extraction not supported for this file type)"
        
        except Exception as e:
            logger.error(f"Error reading CV file: {str(e)}")
            return None
    
    def _get_doctor_count(self, hospital_id: str) -> str:
        """Get count of doctors in the hospital"""
        try:
            from specialty.models import DoctorSpecialty
            from core.models import Certification
            
            # Count all doctors
            total_doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            ).count()
            
            # Count by specialty
            doctor_specialties = DoctorSpecialty.objects.filter(
                doctor__hospital_id=hospital_id,
                doctor__is_active=True,
                is_primary=True
            ).select_related('specialty').values('specialty__name').annotate(count=models.Count('doctor_id'))
            
            specialties_summary = []
            for item in doctor_specialties:
                if item['specialty__name']:
                    specialties_summary.append(f"{item['specialty__name']}: {item['count']}")
            
            response = f"We have {total_doctors} active doctor(s) at this hospital."
            
            if specialties_summary:
                response += f"\n\nSpecialists:\n"
                response += "\n".join(specialties_summary)
            
            response += "\n\nWould you like to know more about any specific specialty or book an appointment?"
            
            return response
        
        except Exception as e:
            logger.error(f"Error getting doctor count: {str(e)}")
            return f"We have doctors available. Please contact us directly for detailed information."
    
    def _get_specialist_count(self, hospital_id: str) -> str:
        """Get count of specialist doctors"""
        try:
            from specialty.models import DoctorSpecialty
            
            # Count doctors with primary specialties
            specialist_count = DoctorSpecialty.objects.filter(
                doctor__hospital_id=hospital_id,
                doctor__is_active=True,
                is_primary=True
            ).values('specialty__name').distinct().count()
            
            return f"We have {specialist_count} different specialist areas at this hospital. Would you like to know about any specific specialty?"
        
        except Exception as e:
            logger.error(f"Error getting specialist count: {str(e)}")
            return "We have specialist doctors available. Please contact us for detailed information."
    
    def _get_doctors_by_specialty(self, hospital_id: str, specialty_name: str) -> str:
        """Get doctors with a specific specialty"""
        try:
            from specialty.models import DoctorSpecialty, Specialty
            
            # Find specialty
            specialty = Specialty.objects.filter(name__icontains=specialty_name).first()
            
            if not specialty:
                return f"I'm sorry, we don't have {specialty_name} specialists at this hospital."
            
            # Get doctors with this specialty
            doctor_specialties = DoctorSpecialty.objects.filter(
                specialty=specialty,
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).select_related('doctor')
            
            if not doctor_specialties.exists():
                return f"I'm sorry, we don't currently have any {specialty_name} specialists available at this hospital."
            
            doctors_list = []
            for ds in doctor_specialties:
                doctor = ds.doctor
                years = f" ({ds.years_of_experience or doctor.years_of_experience} years experience)" if (ds.years_of_experience or doctor.years_of_experience) else ""
                doctors_list.append(f"Dr. {doctor.first_name} {doctor.last_name}{years}")
            
            return f"Yes! We have {len(doctors_list)} {specialty_name} specialist(s): {', '.join(doctors_list)}. Would you like to book an appointment with any of them?"
        
        except Exception as e:
            logger.error(f"Error getting doctors by specialty: {str(e)}")
            return f"I'm having trouble checking {specialty_name} availability. Please contact us directly."

    def _check_procedure_availability(self, hospital_id: str, question: str) -> str:
        """Check if specific procedures are available at the hospital"""
        question_lower = question.lower()
        
        try:
            # Check for brain surgery specifically
            if "brain surgery" in question_lower or "neurosurgery" in question_lower:
                # Check for neurosurgeons
                neuro_specialty = Specialty.objects.filter(name__icontains="Neurosurgery").first()
                if neuro_specialty:
                    neurosurgeons = DoctorSpecialty.objects.filter(
                        specialty=neuro_specialty,
                        doctor__hospital_id=hospital_id,
                        doctor__is_active=True
                    )
                    if neurosurgeons.exists():
                        return "Yes, our hospital performs brain surgery. We have qualified neurosurgeons on staff. Please contact us to discuss your specific needs and schedule a consultation."
                    else:
                        return "I'm sorry, we don't currently have neurosurgeons available at this hospital. We can refer you to a specialized facility that performs brain surgery."
                else:
                    return "I'm sorry, we don't currently perform brain surgery at this hospital. We can refer you to a specialized facility that performs this procedure."
            
            # General surgery question
            elif "surgery" in question_lower:
                surgery_specialty = Specialty.objects.filter(name__icontains="Surgery").first()
                if surgery_specialty:
                    surgeons = DoctorSpecialty.objects.filter(
                        specialty=surgery_specialty,
                        doctor__hospital_id=hospital_id,
                        doctor__is_active=True
                    )
                    if surgeons.exists():
                        return "Yes, our hospital performs various surgical procedures. We have qualified surgeons on staff. Please contact us to discuss your specific surgical needs."
                    else:
                        return "I'm sorry, we don't currently have surgeons available at this hospital. We can refer you to a facility that performs surgical procedures."
                else:
                    return "I'm sorry, we don't currently perform surgical procedures at this hospital. We can refer you to a facility that performs surgery."
            
            else:
                return "I can help you find information about specific procedures. Please let me know what type of procedure you're asking about, and I'll check if it's available at our hospital."
        
        except Exception as e:
            logger.error(f"Error checking procedure availability: {str(e)}")
            return "I'm having trouble checking procedure availability right now. Please contact us directly for information about the procedures we perform."

    def _get_knowledge_base(self, hospital_id: str) -> Optional[Dict]:
        """
        Get knowledge base configuration for a hospital.
        
        Returns a dictionary with identity, behavior, response, and source data
        that can be used to guide the AI agent's responses.
        """
        try:
            hospital = Hospital.objects.get(id=hospital_id, is_active=True)
            
            # Try to get AI Identity
            try:
                ai_identity = hospital.ai_identity
                identity = {
                    'agent_name': ai_identity.agent_name,
                    'agent_title': ai_identity.agent_title,
                    'system_prompt': ai_identity.system_prompt
                }
            except Ai_Identity.DoesNotExist:
                identity = None
                logger.warning(f"No AI Identity found for hospital {hospital_id}")
            
            # Try to get Behavior
            try:
                behavior = hospital.behavior
                behavior_data = {
                    'communication_tone': behavior.communication_tone,
                    'communication_style': behavior.communication_style,
                    'confidence_level': behavior.confidence_level,
                    'response_length': behavior.response_length,
                    'enable_follow_up_questions': behavior.enable_follow_up_questions,
                    'enable_appointment_booking': behavior.enable_appointment_booking,
                    'enable_personalization': behavior.enable_personalization
                }
            except Behavior.DoesNotExist:
                behavior_data = None
                logger.warning(f"No Behavior found for hospital {hospital_id}")
            
            # Try to get Response templates
            try:
                response_template = hospital.response
                response_data = {
                    'greeting_message': response_template.greeting_message,
                    'appointment_booking': response_template.appointment_booking,
                    'general_inquiries': response_template.general_inquiries,
                    'fallback_response': response_template.fallback_response,
                    'emergency_response': response_template.emergency_response,
                    'business_hours': response_template.business_hours,
                    'medical_specialties': response_template.medical_specialties
                }
            except ResponseModel.DoesNotExist:
                response_data = None
                logger.warning(f"No Response templates found for hospital {hospital_id}")
            
            logger.info(f"Retrieved knowledge base for hospital {hospital_id}: "
                       f"identity={identity is not None}, behavior={behavior_data is not None}, "
                       f"response={response_data is not None}")
            
            return {
                'identity': identity,
                'behavior': behavior_data,
                'response': response_data,
                'hospital_id': str(hospital.id),
                'hospital_name': hospital.name
            }
            
        except Hospital.DoesNotExist:
            logger.error(f"Hospital {hospital_id} does not exist")
            return None
        except Exception as e:
            logger.error(f"Error getting knowledge base: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def _get_available_slots(self, hospital_id: str, appointment_details: Dict = None) -> List[Dict]:
        """Get available appointment slots for the hospital, optionally filtered by appointment details"""
        try:
            from datetime import datetime, timedelta
            from django.utils import timezone
            from django.db.models import Q
            
            now = timezone.now()
            today = now.date()
            future_date = today + timedelta(days=30)
            
            # Build base query
            slots_query = DoctorScheduleSlot.objects.filter(
                hospital_id=hospital_id,
                status="AVAILABLE",
                date__gte=today,
                date__lte=future_date,
                current_appointments__lt=models.F('max_appointments')
            ).select_related('doctor', 'hospital', 'doctor__specialization')
            
            # Filter by doctor if provided
            if appointment_details and appointment_details.get('doctor_id'):
                slots_query = slots_query.filter(doctor_id=appointment_details.get('doctor_id'))
            elif appointment_details and appointment_details.get('doctor'):
                # Try to find doctor by name
                doctor_name = appointment_details.get('doctor')
                slots_query = slots_query.filter(
                    models.Q(doctor__first_name__icontains=doctor_name.split()[0]) |
                    models.Q(doctor__last_name__icontains=doctor_name.split()[-1])
                )
            
            # Filter by service/specialty if provided
            if appointment_details and appointment_details.get('service'):
                service_name = appointment_details['service'].lower()
                # Try to match against doctor's specialization
                slots_query = slots_query.filter(
                    doctor__specialization__name__icontains=service_name
                )
            
            # Filter by date if provided
            if appointment_details and appointment_details.get('date'):
                try:
                    # Try to parse date
                    date_str = appointment_details['date']
                    if isinstance(date_str, str):
                        # Handle various date formats
                        if '-' in date_str:
                            target_date = datetime.strptime(date_str.split('T')[0], '%Y-%m-%d').date()
                        elif '/' in date_str:
                            parts = date_str.split('/')
                            if len(parts) == 3:
                                target_date = datetime(int(parts[2]), int(parts[0]), int(parts[1])).date()
                            else:
                                target_date = None
                        else:
                            target_date = None
                        
                        if target_date:
                            slots_query = slots_query.filter(date=target_date)
                except Exception as e:
                    logger.warning(f"Error parsing date filter: {e}")
            
            # Filter by time if provided
            if appointment_details and appointment_details.get('time'):
                try:
                    time_str = appointment_details['time']
                    # Extract hour from time string (handle formats like "2:30 pm", "14:30", etc.)
                    import re
                    time_match = re.search(r'(\d{1,2})', time_str)
                    if time_match:
                        hour = int(time_match.group(1))
                        # If PM and hour < 12, add 12
                        if 'pm' in time_str.lower() and hour < 12:
                            hour += 12
                        # Filter slots starting around this hour (±2 hours)
                        slots_query = slots_query.filter(
                            start_time__hour__gte=hour-2,
                            start_time__hour__lte=hour+2
                        )
                except Exception as e:
                    logger.warning(f"Error parsing time filter: {e}")
            
            # Order and limit results
            slots = slots_query.order_by('date', 'start_time')[:50]  # Get more to filter
            
            logger.info(f"Found {len(slots)} available slots for hospital {hospital_id}")
            
            available_slots = []
            for slot in slots:
                # Check if the slot is actually available (not in the past)
                slot_datetime = timezone.make_aware(datetime.combine(slot.date, slot.start_time))
                if slot_datetime < now:
                    logger.debug(f"Skipping past slot: {slot}")
                    continue
                
                available_slots.append({
                    "slot_id": str(slot.id),
                    "doctor_name": f"Dr. {slot.doctor.first_name} {slot.doctor.last_name}",
                    "specialization": slot.doctor.specialization.name if slot.doctor.specialization else "General Practice",
                    "date": slot.date.isoformat(),
                    "start_time": slot.start_time.isoformat(),
                    "end_time": slot.end_time.isoformat(),
                    "duration_minutes": slot.duration_minutes,
                    "available_spots": slot.max_appointments - slot.current_appointments
                })
            
            logger.info(f"Returning {len(available_slots)} valid available slots")
            return available_slots
        
        except Exception as e:
            logger.error(f"Error getting available slots: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return []

    def _format_available_slots(self, slots: List[Dict], limit: int = 3, show_more_option: bool = True) -> str:
        """Format available slots for display (limited to 3 by default)"""
        if not slots:
            return "No available slots found."
        
        # Limit to maximum slots
        display_slots = slots[:limit]
        remaining_count = len(slots) - limit
        
        formatted_slots = []
        for i, slot in enumerate(display_slots, 1):
            doctor_info = slot['doctor_name']
            specialization = slot.get('specialization', 'General Practice')
            date = slot['date']
            time = slot['start_time']
            duration = slot['duration_minutes']
            
            # Format date nicely (just date without time)
            date_display = date.split('T')[0] if 'T' in date else date
            
            # Format time nicely (HH:MM format)
            time_display = time
            if ':' in time:
                time_parts = time.split(':')
                time_display = f"{time_parts[0]}:{time_parts[1]}"
            
            formatted_slots.append(
                f"{i}. {doctor_info} ({specialization}) - "
                f"{date_display} at {time_display} ({duration} minutes)"
            )
        
        result = "\n".join(formatted_slots)
        
        # Ask if user wants more slots if there are more than the limit
        if remaining_count > 0 and show_more_option:
            result += f"\n\nThere are {remaining_count} more available slots. Would you like me to show you more options?"
        
        return result
    
    def _format_response_with_knowledge_base(self, template: str, knowledge_base: Dict, hospital_info: Dict) -> str:
        """
        Format response template with hospital information and agent identity
        
        Replaces placeholders like {hospital_name}, {agent_name}, etc.
        """
        try:
            # Get agent identity if available
            agent_name = ""
            agent_title = ""
            if knowledge_base and knowledge_base.get('identity'):
                agent_name = knowledge_base['identity'].get('agent_name', '')
                agent_title = knowledge_base['identity'].get('agent_title', '')
            
            # Replace placeholders
            formatted = template.replace('{hospital_name}', hospital_info.get('name', ''))
            formatted = formatted.replace('{hospital_city}', hospital_info.get('city', ''))
            formatted = formatted.replace('{hospital_state}', hospital_info.get('state', ''))
            formatted = formatted.replace('{agent_name}', agent_name)
            formatted = formatted.replace('{agent_title}', agent_title)
            
            return formatted
        except Exception as e:
            logger.error(f"Error formatting response with knowledge base: {e}")
            return template
    
    def _save_conversation(self, chat_session, question: str, response: str, hospital_id: str = None):
        """Save conversation to ChatMessage for session memory"""
        try:
            from core.chat_models import ChatMessage
            ChatMessage.objects.create(
                session=chat_session,
                message=question,
                response=response,
                language="en",
            )
            logger.info(f"Saved conversation for session {chat_session.session_id}")
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
    
    def _get_knowledge_base_follow_ups(self, knowledge_base: Optional[Dict]) -> List[str]:
        """Get follow-up questions from knowledge base behavior configuration"""
        try:
            if knowledge_base and knowledge_base.get('behavior'):
                behavior = knowledge_base['behavior']
                
                # Check if follow-up questions are enabled
                if not behavior.get('enable_follow_up_questions', True):
                    return []
                
                # Generate context-aware follow-ups based on behavior
                follow_ups = []
                
                # Appointment booking follow-up
                if behavior.get('enable_appointment_booking', True):
                    follow_ups.append("Would you like to book an appointment?")
                
                # General inquiry follow-up
                follow_ups.append("Would you like to know about our services?")
                follow_ups.append("Would you like to see our available doctors?")
                
                return follow_ups[:3]  # Limit to 3
        except Exception as e:
            logger.error(f"Error getting knowledge base follow-ups: {e}")
        
        return []
    
    def _extract_appointment_details(self, question: str, hospital_id: str = None) -> Dict[str, Optional[str]]:
        """Extract appointment details (service, date, time) from the user's question
        
        Handles formats like:
        - "Consultation, Saturday and 10am"
        - "I want consultation on Saturday at 10am"
        - "Saturday, 10am, consultation"
        """
        import re
        from datetime import datetime, timedelta
        
        details = {
            'service': None,
            'date': None,
            'time': None,
            'doctor': None
        }
        
        question_lower = question.lower()
        question_original = question.strip()
        
        # Day names mapping
        day_names = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6,
            'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
        }
        
        # First, check against known services/specialties if hospital_id is provided
        # This helps identify service names even if they're standalone
        if hospital_id:
            try:
                services = Service.objects.filter(hospital_id=hospital_id).values_list('service_name', flat=True)
                specialty_names = Specialty.objects.filter(hospital_id=hospital_id).values_list('name', flat=True)
                all_services = list(services) + list(specialty_names)
                
                # Check for service names in the question
                for service_name in all_services:
                    if service_name and service_name.lower() in question_lower:
                        details['service'] = service_name
                        # Remove the service name from question for further processing
                        question_lower = question_lower.replace(service_name.lower(), '', 1)
                        break
            except Exception as e:
                logger.warning(f"Error checking services/specialties: {e}")
        
        # If no service found in database, try common patterns
        if not details['service']:
            # Map specialty names (person) to service names (specialty)
            specialty_to_service = {
                'gynecologist': 'gynecology',
                'cardiologist': 'cardiology',
                'dermatologist': 'dermatology',
                'pediatrician': 'pediatrics',
                'neurologist': 'neurology',
                'orthopedist': 'orthopedics',
                'orthopedic': 'orthopedics',
                'psychiatrist': 'psychiatry',
                'oncologist': 'oncology',
                'general practitioner': 'general medicine',
                'gp': 'general medicine',
            }
            
            # Check for specialty names first (e.g., "gynecologist" -> "gynecology")
            for specialty, service_name in specialty_to_service.items():
                if specialty in question_lower:
                    details['service'] = service_name.title()
                    question_lower = question_lower.replace(specialty, '', 1)
                    break
            
            # Common service/specialty names that might not be in database
            if not details['service']:
                common_services = ['consultation', 'checkup', 'check-up', 'examination', 'examine', 
                                 'general medicine', 'gynecology', 'cardiology', 'pediatrics',
                                 'dermatology', 'orthopedics', 'psychiatry', 'neurology', 'oncology',
                                 'radiology', 'ophthalmology', 'ent', 'urology', 'nephrology',
                                 'endocrinology', 'gastroenterology', 'pulmonology', 'rheumatology',
                                 'anesthesiology', 'emergency medicine', 'family medicine',
                                 'internal medicine', 'obstetrics', 'pathology', 'plastic surgery',
                                 'sports medicine', 'general surgery']
                
                for service in common_services:
                    if service in question_lower:
                        details['service'] = service.title()
                        question_lower = question_lower.replace(service, '', 1)
                        break
            
            # If still no service found, check if the entire question is just a service name (e.g., "Radiology")
            if not details['service'] and len(question_original.split()) <= 2:
                # Check if it matches a known specialty/service (capitalized or lowercase)
                specialty_map = {
                    'radiology': 'Radiology', 'cardiology': 'Cardiology', 'gynecology': 'Gynecology',
                    'dermatology': 'Dermatology', 'pediatrics': 'Pediatrics', 'neurology': 'Neurology',
                    'orthopedics': 'Orthopedics', 'psychiatry': 'Psychiatry', 'oncology': 'Oncology',
                    'ophthalmology': 'Ophthalmology', 'urology': 'Urology', 'nephrology': 'Nephrology',
                    'endocrinology': 'Endocrinology', 'gastroenterology': 'Gastroenterology',
                    'pulmonology': 'Pulmonology', 'rheumatology': 'Rheumatology',
                    'anesthesiology': 'Anesthesiology', 'emergency medicine': 'Emergency Medicine',
                    'family medicine': 'Family Medicine', 'internal medicine': 'Internal Medicine',
                    'obstetrics': 'Obstetrics', 'pathology': 'Pathology', 'plastic surgery': 'Plastic Surgery',
                    'sports medicine': 'Sports Medicine', 'general surgery': 'General Surgery',
                    'general medicine': 'General Medicine'
                }
                
                question_cleaned = question_lower.strip()
                if question_cleaned in specialty_map:
                    details['service'] = specialty_map[question_cleaned]
                elif question_original.title() in specialty_map.values():
                    details['service'] = question_original.title()
            
            # If still not found, check if first word is a service (for patterns like "Consultation, Saturday")
            if not details['service']:
                words = question_original.split(',')[0].strip().split()
                if words:
                    potential_service = words[0].strip()
                    # If it's a reasonable service name (not a day name or time)
                    if (len(potential_service) > 3 and 
                        potential_service.lower() not in day_names and 
                        not re.match(r'^\d+', potential_service.lower())):
                        details['service'] = potential_service
                        question_lower = question_lower.replace(potential_service.lower(), '', 1)
        
        # Extract doctor name (patterns: "with Dr X", "with Dr. X", "doctor X", "Dr X")
        doctor_patterns = [
            r'(?:with\s+)?(?:dr\.?|doctor)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)',
            r'(?:with\s+)?([A-Z][a-zA-Z]+)\s+(?:doctor|dr\.?)',
        ]
        for pattern in doctor_patterns:
            match = re.search(pattern, question_original, re.IGNORECASE)
            if match:
                doctor_name = match.group(1).strip()
                details['doctor'] = doctor_name
                # Also check if this doctor exists in the hospital
                if hospital_id:
                    try:
                        # Try to find doctor by name (first name or last name match)
                        from core.models import User
                        doctors = User.objects.filter(
                            hospital_id=hospital_id,
                            role='DOCTOR'
                        ).filter(
                            models.Q(first_name__icontains=doctor_name.split()[0]) |
                            models.Q(last_name__icontains=doctor_name.split()[-1])
                        )
                        if doctors.exists():
                            details['doctor_id'] = str(doctors.first().id)
                    except Exception as e:
                        logger.warning(f"Error checking doctor existence: {e}")
                break
        
        # Extract day names (Monday, Tuesday, etc.) and convert to actual dates
        for day_name, day_num in day_names.items():
            if day_name in question_lower:
                # Find the next occurrence of this day
                today = datetime.now()
                days_ahead = (day_num - today.weekday()) % 7
                if days_ahead == 0:  # If today is the day, use next week
                    days_ahead = 7
                target_date = today + timedelta(days=days_ahead)
                details['date'] = target_date.strftime('%Y-%m-%d')
                question_lower = question_lower.replace(day_name, '', 1)
                break
        
        # Extract date patterns (if not already found via day name)
        if not details['date']:
            date_patterns = [
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
                r'(?:on|date)\s+(\w+\s+\d{1,2},?\s+\d{4})',  # "on January 15, 2024"
                r'(?:on|date)\s+(\w+\s+\d{1,2})',  # "on January 15"
                r'(today|tomorrow|next\s+\w+)',  # relative dates
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, question_lower)
                if match:
                    date_str = match.group(1)
                    # Convert relative dates
                    if 'today' in date_str:
                        details['date'] = datetime.now().strftime('%Y-%m-%d')
                    elif 'tomorrow' in date_str:
                        details['date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                    elif 'next' in date_str:
                        # Try to extract day name from "next [day]"
                        next_match = re.search(r'next\s+(\w+)', date_str)
                        if next_match:
                            day_name = next_match.group(1).lower()
                            if day_name in day_names:
                                day_num = day_names[day_name]
                                today = datetime.now()
                                days_ahead = (day_num - today.weekday()) % 7
                                if days_ahead == 0:
                                    days_ahead = 7
                                target_date = today + timedelta(days=days_ahead + 7)  # Next week
                                details['date'] = target_date.strftime('%Y-%m-%d')
                    else:
                        details['date'] = date_str
                    break
        
        # Extract time patterns - improved to handle "10am" without space
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(am|pm)',  # "2:30 pm" or "2:30pm"
            r'(\d{1,2}):(\d{2})(am|pm)',  # "2:30pm" (no space)
            r'(\d{1,2})\s*(am|pm)',  # "2 pm" or "2pm"
            r'(\d{1,2})(am|pm)',  # "2pm" (no space) - IMPORTANT for "10am"
            r'(?:at|time)\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?',
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, question_lower)
            if match:
                groups = match.groups()
                hour = groups[0]
                
                # Check if minute is in groups
                minute = '00'
                period = None
                
                if len(groups) >= 2:
                    # Check if groups[1] is a minute or period
                    if groups[1] and groups[1].isdigit():
                        minute = groups[1]
                        if len(groups) >= 3 and groups[2]:
                            period = groups[2]
                    elif groups[1] in ['am', 'pm']:
                        period = groups[1]
                
                if period:
                    details['time'] = f"{hour}:{minute} {period}".strip()
                elif len(groups) >= 2 and groups[1] in ['am', 'pm']:
                    details['time'] = f"{hour}:{minute} {groups[1]}".strip()
                break
        
        logger.info(f"Extracted appointment details: service={details['service']}, date={details['date']}, time={details['time']}")
        return details
    
    def _find_appointments_guide(self, hospital_id: str, knowledge_base: Dict) -> Optional[str]:
        """Search for #Appointments Guide in system prompts/knowledgebase"""
        try:
            # Search in AI Identity system prompt
            if knowledge_base.get('identity') and knowledge_base['identity'].get('system_prompt'):
                system_prompt = knowledge_base['identity']['system_prompt']
                guide_section = self._extract_section(system_prompt, '#Appointments Guide', '#Appointments', 'Appointments Guide')
                if guide_section:
                    logger.info(f"Found #Appointments Guide in AI Identity system prompt for hospital {hospital_id}")
                    return guide_section
            
            # Search in source files if available
            try:
                from knowledgebase.models import Source, SourceFile
                source = Source.objects.filter(hospital_id=hospital_id, is_active=True).first()
                if source:
                    source_files = SourceFile.objects.filter(source=source, is_active=True)
                    for source_file in source_files:
                        if source_file.source_file:
                            # Try to read text content from source file
                            content = self._read_source_file_content(source_file.source_file)
                            if content:
                                guide_section = self._extract_section(content, '#Appointments Guide', '#Appointments', 'Appointments Guide')
                                if guide_section:
                                    logger.info(f"Found #Appointments Guide in source file {source_file.file_name} for hospital {hospital_id}")
                                    return guide_section
            except Exception as e:
                logger.warning(f"Error searching source files for appointments guide: {e}")
            
            logger.warning(f"#Appointments Guide not found in knowledgebase for hospital {hospital_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding appointments guide: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def _extract_section(self, text: str, *section_markers) -> Optional[str]:
        """Extract a section from text using section markers"""
        import re
        
        text_lower = text.lower()
        for marker in section_markers:
            marker_lower = marker.lower()
            # Try exact match first
            pattern = rf'(?:^|\n)#?\s*{re.escape(marker_lower)}\s*(?:\n|$)(.*?)(?=\n#|\Z)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
            
            # Try without # prefix
            pattern = rf'(?:^|\n){re.escape(marker_lower)}\s*(?:\n|$)(.*?)(?=\n#|\Z)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _read_source_file_content(self, file_field) -> Optional[str]:
        """Read content from a source file"""
        try:
            if not file_field:
                return None
            
            file_name = file_field.name.lower()
            
            # Handle text files
            if file_name.endswith(('.txt', '.md', '.text')):
                file_field.open()
                content = file_field.read()
                file_field.close()
                if isinstance(content, bytes):
                    try:
                        return content.decode('utf-8')
                    except UnicodeDecodeError:
                        return content.decode('latin-1')
                return content
            
            # Handle PDF files
            if file_name.endswith('.pdf'):
                try:
                    import PyPDF2
                    file_field.open()
                    pdf_reader = PyPDF2.PdfReader(file_field)
                    text_content = ""
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                    file_field.close()
                    return text_content
                except ImportError:
                    logger.warning("PyPDF2 not installed, cannot read PDF files")
                    return None
                except Exception as e:
                    logger.error(f"Error reading PDF file: {e}")
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"Error reading source file content: {e}")
            return None
    
    def _process_appointment_with_guide(
        self, question: str, appointment_details: Dict, 
        appointments_guide: str, hospital_info: Dict, 
        knowledge_base: Dict, hospital_id: str,
        session_id: str = None, chat_session = None
    ) -> Response:
        """Process appointment booking using the #Appointments Guide from knowledgebase"""
        try:
            logger.info(f"Processing appointment with guide for hospital {hospital_id}")
            
            # Get available slots filtered by service, date, time if specified
            available_slots = self._get_available_slots(hospital_id, appointment_details)
            
            # Build system prompt with appointments guide
            system_prompt = f"""You are a medical appointment booking assistant for {hospital_info['name']}.

Follow the Appointments Guide below judiciously when processing appointment bookings:

#Appointments Guide
{appointments_guide}

User's appointment request: {question}
Extracted details:
- Service: {appointment_details.get('service', 'Not specified')}
- Date: {appointment_details.get('date', 'Not specified')}
- Time: {appointment_details.get('time', 'Not specified')}

Available slots: {len(available_slots)} found

Process this appointment booking following the Appointments Guide exactly as specified. When showing available slots, limit to maximum 3 slots. If there are more than 3 slots, ask the user if they want to see more options."""
            
            # Prepare context with conversation history for appointment booking
            context = {
                "system_prompt": system_prompt,
                "session_id": session_id,
                "history_limit": 10
            }
            
            # Get conversation history from chat_session if available
            conversation_history = []
            if chat_session:
                try:
                    from core.chat_models import ChatMessage
                    previous_messages = ChatMessage.objects.filter(
                        session=chat_session
                    ).order_by("timestamp")[:10]
                    conversation_history = [
                        {
                            "message": msg.message,
                            "response": msg.response,
                            "timestamp": msg.timestamp.isoformat(),
                        }
                        for msg in previous_messages
                    ]
                    if conversation_history:
                        context["history"] = conversation_history
                except Exception as e:
                    logger.warning(f"Could not load conversation history for appointment: {e}")
            
            # Use OpenAI to process the appointment following the guide
            response_text = asyncio.run(
                self.openai_service.generate_chat_response(
                    question,
                    language="en",
                    context=context
                )
            )
            
            # Format slots with limit of 3
            slots_text = ""
            if available_slots:
                slots_text = self._format_available_slots(available_slots, limit=3, show_more_option=True)
                # Append slots to response if not already included by AI
                if "slot" not in response_text.lower() and "appointment" not in response_text.lower():
                    response_text += f"\n\nHere are available slots:\n\n{slots_text}"
            
            return Response({
                "success": True,
                "response": response_text,
                "query_type": "appointment",
                "hospital_info": {
                    "id": hospital_info["id"],
                    "name": hospital_info["name"]
                },
                "appointment_options": available_slots[:3],  # Limit to 3 in response
                "appointment_details": appointment_details,
                "total_slots_available": len(available_slots),
                "follow_up_questions": [
                    "Would you like to see more available slots?",
                    "Would you like to confirm this appointment?",
                    "Do you need to make any changes?"
                ]
            })
            
        except Exception as e:
            logger.error(f"Error processing appointment with guide: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Fallback to regular appointment booking with slots
            return self._process_appointment_with_slots(
                question, appointment_details, hospital_info, knowledge_base, hospital_id
            )
    
    def _process_appointment_with_slots(
        self, question: str, appointment_details: Dict,
        hospital_info: Dict, knowledge_base: Dict, hospital_id: str,
        session_id: str = None, chat_session = None
    ) -> Response:
        """Process appointment booking with slots (fallback when no guide found)"""
        try:
            # Get available slots filtered by service, date, time if specified
            available_slots = self._get_available_slots(hospital_id, appointment_details)
            
            if not available_slots:
                response = f"I'm sorry, I couldn't find any available slots matching your requirements at {hospital_info['name']}. Please try different dates or times, or contact us directly."
            else:
                slots_text = self._format_available_slots(available_slots, limit=3, show_more_option=True)
                response = f"Here are available appointment slots at {hospital_info['name']}:\n\n{slots_text}"
            
            return Response({
                "success": True,
                "response": response,
                "query_type": "appointment",
                "hospital_info": {
                    "id": hospital_info["id"],
                    "name": hospital_info["name"]
                },
                "appointment_options": available_slots[:3],  # Limit to 3
                "appointment_details": appointment_details,
                "total_slots_available": len(available_slots),
                "follow_up_questions": [
                    "Would you like to see more available slots?" if len(available_slots) > 3 else "Would you like to confirm this appointment?",
                    "Would you like to try a different date or time?",
                    "Do you need to make any changes?"
                ]
            })
            
        except Exception as e:
            logger.error(f"Error processing appointment with slots: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({
                "success": False,
                "response": "I'm sorry, I'm having trouble processing your appointment request. Please try again or contact us directly.",
                "query_type": "appointment"
            })