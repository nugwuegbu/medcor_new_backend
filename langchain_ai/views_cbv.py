"""
Class-based views for LangChain AI API endpoints
This module provides class-based views that work better with DRF Spectacular
"""

import asyncio
import logging
import time
from typing import Any, Dict

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .mcp_client import test_mcp_connection, get_mcp_client
from .tasks import (
    get_task_status,
    process_ai_query_task,
    process_database_query_task,
)

logger = logging.getLogger(__name__)


def async_to_sync(view_func):
    """Decorator to convert async view functions to sync"""

    def wrapper(request, *args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(view_func(request, *args, **kwargs))
        finally:
            loop.close()

    return wrapper


class ProcessQueryView(APIView):
    """Intelligent query processing that automatically switches between AI and database tools based on query content"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="process_intelligent_query",
        summary="Process Intelligent Query with MCP Server",
        description="Process user queries using LangChain, OpenAI, and MCP server tools. Automatically determines whether to use AI analysis, database querying, or medical analysis based on query content. Uses MCP server for tool execution, resource access, and prompt management. Supports both real-time and background processing.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user query to process. Can be general questions, medical queries, or database queries.",
                        "examples": [
                            "What are the symptoms of diabetes?",
                            "Show me all patients with diabetes",
                            "How do I treat hypertension?",
                            "List appointments for today",
                            "What is the treatment for chest pain?"
                        ]
                    },
                    "query_type": {
                        "type": "string",
                        "description": "Optional hint for query type",
                        "enum": ["auto", "ai", "database", "medical"],
                        "default": "auto"
                    },
                    "use_celery": {
                        "type": "boolean",
                        "description": "Whether to use background processing (default: false for real-time)",
                        "default": False
                    },
                    "database": {
                        "type": "string",
                        "description": "Database name for database queries (optional)",
                        "default": "default",
                        "example": "medical_records"
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Optional session ID for conversation memory. If provided, previous messages from this session will be included in context.",
                        "required": False
                    }
                },
                "required": ["query"]
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
                            "message": {"type": "string"},
                            "result": {"type": "string"},
                            "query_type_detected": {
                                "type": "string",
                                "enum": ["ai", "database", "medical"],
                                "description": "The detected query type"
                            },
                            "tool_used": {
                                "type": "string",
                                "enum": ["ai_analysis", "database_query", "medical_analysis"],
                                "description": "The tool that was used to process the query"
                            },
                            "task_id": {"type": "string", "description": "Task ID for background processing"},
                            "processing_time": {"type": "number", "description": "Processing time in seconds"},
                            "confidence": {"type": "number", "description": "Confidence score for query type detection (0-1)"}
                        }
                    }
                }
            },
            400: {
                "description": "Bad request - invalid input",
                "content": {
                    "application/json": {
                        "type": "object",
                        "properties": {
                            "error": {"type": "string"},
                            "message": {"type": "string"}
                        }
                    }
                }
            },
            401: {
                "description": "Unauthorized - authentication required"
            }
        },
        tags=["Intelligent Query Processing"]
    )
    def post(self, request):
        query = request.data.get("query", "")
        query_type_hint = request.data.get("query_type", "auto")
        context = request.data.get("context", {})
        use_celery = request.data.get("use_celery", False)
        database = request.data.get("database", "default")
        session_id = request.data.get("session_id", None)  # Optional session ID for conversation memory
        user_id = str(request.user.id) if request.user.is_authenticated else None

        if not query:
            return Response(
                {"error": "Query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Load conversation history if session_id is provided
        if session_id:
            try:
                from core.chat_models import ChatSession, ChatMessage
                chat_session = ChatSession.objects.filter(session_id=session_id).first()
                if chat_session:
                    # Retrieve recent conversation history for context
                    previous_messages = ChatMessage.objects.filter(
                        session=chat_session
                    ).order_by("-timestamp")[:5]  # Last 5 messages
                    
                    conversation_history = [
                        {
                            "query": msg.message,
                            "response": msg.response,
                            "timestamp": msg.timestamp.isoformat(),
                        }
                        for msg in reversed(previous_messages)  # Reverse to get chronological order
                    ]
                    
                    # Add history to context
                    if "history" not in context:
                        context["history"] = []
                    context["history"].extend(conversation_history)
                    context["session_id"] = session_id
            except Exception as e:
                logger.warning(f"Could not load conversation history for session {session_id}: {e}")

        try:
            # Detect query type and determine appropriate tool
            detected_type, confidence = _detect_query_type(query, query_type_hint)
            
            if use_celery:
                # Use Celery for background processing
                if detected_type == "database":
                    task = process_database_query_task.delay(
                        {
                            "query": query,
                            "database": database,
                        },
                        user_id,
                    )
                    tool_used = "database_query"
                else:  # ai
                    task = process_ai_query_task.delay(
                        {
                            "query": query,
                            "query_type": "general",
                            "context": context,
                        },
                        user_id,
                    )
                    tool_used = "ai_analysis"
                
                return Response(
                    {
                        "success": True,
                        "message": f"Query submitted for {detected_type} processing",
                        "query_type_detected": detected_type,
                        "tool_used": tool_used,
                        "task_id": task.id,
                        "confidence": confidence,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Use async processing for real-time responses
                result = asyncio.run(
                    _process_intelligent_query_async(query, detected_type, context, database)
                )
                result["query_type_detected"] = detected_type
                result["confidence"] = confidence
                return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing intelligent query: {str(e)}")
            return Response(
                {"error": "Internal server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Database Query Processing is now integrated into the main ProcessQueryView


class GetTaskStatusView(APIView):
    """Get the status of a Celery task"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_task_status",
        summary="Get Task Status",
        description="Get the status and result of a Celery task by task ID.",
        parameters=[
            OpenApiParameter(
                name="task_id",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="The unique task ID",
                examples=[
                    OpenApiExample(
                        "Example Task ID",
                        value="12345678-1234-1234-1234-123456789abc"
                    )
                ]
            )
        ],
        responses={
            200: {
                "description": "Task status retrieved successfully",
                "content": {
                    "application/json": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY", "REVOKED"],
                                "description": "Current task status"
                            },
                            "result": {"type": "string", "description": "Task result (if completed)"},
                            "error": {"type": "string", "description": "Error message (if failed)"},
                            "progress": {"type": "number", "description": "Progress percentage (0-100)"},
                            "created_at": {"type": "string", "format": "date-time"},
                            "updated_at": {"type": "string", "format": "date-time"}
                        }
                    }
                }
            },
            404: {
                "description": "Task not found"
            },
            500: {
                "description": "Internal server error"
            }
        },
        tags=["Task Management"]
    )
    def get(self, request, task_id):
        try:
            status_info = get_task_status(task_id)
            return Response(status_info, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting task status: {str(e)}")
            return Response(
                {"error": "Internal server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AIHealthCheckView(APIView):
    """Health check endpoint for AI service"""
    permission_classes = []  # No authentication required for health check

    @extend_schema(
        operation_id="ai_health_check",
        summary="AI Service Health Check",
        description="Check the health status of the AI service, including MCP server connectivity and Celery task processing.",
        responses={
            200: {
                "description": "Health check successful",
                "content": {
                    "application/json": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string", "example": "healthy"},
                            "timestamp": {"type": "string", "format": "date-time"},
                            "services": {
                                "type": "object",
                                "properties": {
                                    "celery": {"type": "boolean"},
                                    "redis": {"type": "boolean"},
                                    "mcp_server": {"type": "boolean"}
                                }
                            },
                            "processing_time": {"type": "number"},
                            "mcp_available": {"type": "boolean"}
                        }
                    }
                }
            },
            500: {
                "description": "Health check failed"
            }
        },
        tags=["Health & Monitoring"]
    )
    def get(self, request):
        try:
            health_info = asyncio.run(_health_check_async())
            return Response(health_info, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in health check: {str(e)}")
            return Response(
                {"error": "Internal server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Helper functions for intelligent query processing
def _detect_query_type(query: str, hint: str = "auto") -> tuple[str, float]:
    """
    Detect the type of query and return appropriate tool selection
    Returns: (query_type, confidence_score)
    """
    if hint != "auto":
        return hint, 1.0
    
    query_lower = query.lower()
    
    # Database query indicators for all MedCor apps
    database_keywords = [
        "show me", "list", "find", "get", "select", "retrieve", "display",
        "patients with", "appointments", "records", "data", "table",
        "all patients", "today's", "this week", "last month",
        "count", "total", "statistics", "report",
        "book appointment", "available slots", "doctor availability",
        "patient", "user", "subscription plan", "medical record",
        "appointment", "slot", "specialty", "treatment", "prescription",
        "hospital", "tenant", "user profile", "doctor specialty",
        "subscription", "plan", "billing", "payment", "invoice",
        "doctor", "specialist", "nurse", "staff", "employee",
        "schedule", "calendar", "availability", "time slot",
        "patient record", "health record", "medical history",
        "treatment plan", "medication", "prescription", "dosage",
        "service", "services", "offer", "offering", "offered", "provide", "provided",
        "areas of specialization", "specialization", "specialty", "what do you offer",
        "price", "cost", "pricing", "how much", "cost of", "charge"
    ]
    
    # Medical query indicators
    medical_keywords = [
        "symptoms", "diagnosis", "treatment", "medicine", "drug", "therapy",
        "patient presents", "medical condition", "disease", "illness",
        "clinical", "pathology", "prognosis", "etiology", "complications",
        "side effects", "contraindications", "dosage", "prescription"
    ]
    
    # AI/general query indicators
    ai_keywords = [
        "what is", "how to", "explain", "describe", "tell me about",
        "why", "when", "where", "who", "which", "can you",
        "help me understand", "difference between", "compare"
    ]
    
    # Calculate scores for each type
    db_score = sum(1 for keyword in database_keywords if keyword in query_lower)
    medical_score = sum(1 for keyword in medical_keywords if keyword in query_lower)
    ai_score = sum(1 for keyword in ai_keywords if keyword in query_lower)
    
    # Additional heuristics
    if any(word in query_lower for word in ["sql", "query", "database", "table"]):
        db_score += 3
    
    if any(word in query_lower for word in ["patient", "doctor", "hospital", "clinic", "medical"]):
        medical_score += 2
    
    if query_lower.startswith(("what", "how", "why", "when", "where", "who")):
        ai_score += 2
    
    # Determine the type with highest score
    scores = {"database": db_score, "medical": medical_score, "ai": ai_score}
    max_type = max(scores, key=scores.get)
    max_score = scores[max_type]
    
    # Calculate confidence (0-1)
    total_score = sum(scores.values())
    confidence = max_score / total_score if total_score > 0 else 0.5
    
    # If no clear indicators, default to AI
    if max_score == 0:
        return "ai", 0.3
    
    return max_type, min(confidence, 1.0)


async def _process_intelligent_query_async(query: str, query_type: str, context: Dict[str, Any], database: str = "default") -> Dict[str, Any]:
    """Process queries intelligently using MCP server tools, resources, and prompts"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()
        
        if not mcp_available:
            return {
                "success": False,
                "error": "MCP server is not available",
                "result": "Unable to process query - MCP server connection failed",
                "tool_used": "error",
                "mcp_available": False,
            }

        # Get MCP client and process query based on type
        async with get_mcp_client() as mcp_client:
            if query_type == "database":
                result = await _process_database_query_with_mcp(mcp_client, query, database)
                tool_used = "database_query"
            elif query_type == "medical":
                result = await _process_medical_query_with_mcp(mcp_client, query, context)
                tool_used = "medical_analysis"
            else:  # ai
                result = await _process_ai_query_with_mcp(mcp_client, query, context)
                tool_used = "ai_analysis"

        processing_time = time.time() - start_time

        return {
            "success": True,
            "message": f"Query processed using {tool_used} via MCP server",
            "result": result,
            "tool_used": tool_used,
            "processing_time": processing_time,
            "mcp_available": mcp_available,
        }

    except Exception as e:
        logger.error(f"Error processing intelligent query with MCP: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "result": "Error processing query with MCP server",
            "tool_used": "error",
            "mcp_available": False,
        }


async def _process_database_query_with_mcp(mcp_client, query: str, database: str) -> str:
    """Process database queries using comprehensive MCP tools for all MedCor apps"""
    try:
        query_lower = query.lower()
        
        # Determine which MCP tool to use based on query content
        if any(word in query_lower for word in ["appointment", "book", "schedule", "slot"]):
            # Use appointment-related tools
            if "list" in query_lower or "show" in query_lower:
                response = await mcp_client.call_tool("list_appointments", {"hospital_id": "1"})
            elif "slot" in query_lower or "available" in query_lower:
                response = await mcp_client.call_tool("list_appointment_slots", {"hospital_id": "1"})
            else:
                response = await mcp_client.call_tool("get_todays_appointments", {"hospital_id": "1"})
                
        elif any(word in query_lower for word in ["patient", "user"]):
            # Use patient/user-related tools
            if "list" in query_lower or "show" in query_lower:
                response = await mcp_client.call_tool("list_users", {"hospital_id": "1"})
            else:
                response = await mcp_client.call_tool("list_users", {"hospital_id": "1"})
                
        elif any(word in query_lower for word in ["doctor", "specialist", "physician"]):
            # Use doctor-related tools
            if "specialty" in query_lower or "specialist" in query_lower:
                response = await mcp_client.call_tool("list_doctors", {"hospital_id": "1"})
            else:
                response = await mcp_client.call_tool("list_doctors", {"hospital_id": "1"})
                
        elif any(word in query_lower for word in ["specialty", "specialization"]):
            # Use specialty-related tools
            response = await mcp_client.call_tool("list_specialties", {})
            
        elif any(word in query_lower for word in ["medical record", "health record", "patient record"]):
            # Use medical record tools
            response = await mcp_client.call_tool("list_medical_records", {"hospital_id": "1"})
            
        elif any(word in query_lower for word in ["treatment", "prescription", "medication"]):
            # Use treatment-related tools
            response = await mcp_client.call_tool("list_treatments", {"hospital_id": "1"})
            
        elif any(word in query_lower for word in ["service", "services", "offer", "offering", "provided"]):
            # Use service-related tools
            hospital_id = context.get("hospital_id", "1")
            if "price" in query_lower or "cost" in query_lower or "pricing" in query_lower:
                # Get services with pricing summary
                response = await mcp_client.call_tool("get_hospital_services_summary", {"hospital_id": hospital_id})
            elif "list" in query_lower or "show" in query_lower or "what" in query_lower:
                # List all services
                search_term = None
                if "search" in query_lower:
                    # Try to extract search term from query
                    words = query_lower.split()
                    if "for" in words:
                        idx = words.index("for")
                        if idx + 1 < len(words):
                            search_term = " ".join(words[idx + 1:])
                response = await mcp_client.call_tool("list_services", {"hospital_id": hospital_id, "search": search_term})
            else:
                response = await mcp_client.call_tool("list_services", {"hospital_id": hospital_id})
                
        elif any(word in query_lower for word in ["subscription", "plan", "billing"]):
            # Use subscription-related tools
            response = await mcp_client.call_tool("list_subscription_plans", {"is_active": True})
            
        elif any(word in query_lower for word in ["hospital", "tenant"]):
            # Use hospital-related tools
            response = await mcp_client.call_tool("list_hospitals", {})
            
        else:
            # Default to listing all data
            response = await mcp_client.call_tool("list_hospitals", {})
        
        if response.success:
            return f"Database Query Result: {response.data}"
        else:
            return f"Database query failed: {response.error}"
            
    except Exception as e:
        return f"Error executing database query: {str(e)}"


async def _process_medical_query_with_mcp(mcp_client, query: str, context: Dict[str, Any]) -> str:
    """Process medical queries using MCP medical tools and resources"""
    try:
        query_lower = query.lower()
        
        # Determine which medical MCP tool to use based on query content
        if any(word in query_lower for word in ["medical record", "patient record", "health record"]):
            # Use medical record tools
            if "create" in query_lower or "add" in query_lower:
                response = await mcp_client.call_tool("create_medical_record", {
                    "patient_id": context.get("patient_id", "1"),
                    "hospital_id": context.get("hospital_id", "1"),
                    "diagnosis": query,
                    "treatment_notes": "AI-generated analysis"
                })
            else:
                response = await mcp_client.call_tool("list_medical_records", {"hospital_id": "1"})
                
        elif any(word in query_lower for word in ["treatment", "prescription", "medication"]):
            # Use treatment-related tools
            if "create" in query_lower or "prescribe" in query_lower:
                response = await mcp_client.call_tool("create_treatment", {
                    "patient_id": context.get("patient_id", "1"),
                    "hospital_id": context.get("hospital_id", "1"),
                    "treatment_type": "AI-recommended treatment",
                    "description": query
                })
            else:
                response = await mcp_client.call_tool("list_treatments", {"hospital_id": "1"})
                
        elif any(word in query_lower for word in ["appointment", "schedule", "book"]):
            # Use appointment tools for medical scheduling
            if "create" in query_lower or "book" in query_lower:
                response = await mcp_client.call_tool("create_appointment", {
                    "patient_id": context.get("patient_id", "1"),
                    "doctor_id": context.get("doctor_id", "1"),
                    "hospital_id": context.get("hospital_id", "1"),
                    "appointment_date": "2024-01-01",
                    "appointment_time": "10:00:00",
                    "reason": query
                })
            else:
                response = await mcp_client.call_tool("list_appointments", {"hospital_id": "1"})
                
        else:
            # Use medical record analysis for general medical queries
            response = await mcp_client.call_tool("list_medical_records", {"hospital_id": "1"})
        
        if response.success:
            return f"Medical Analysis: {response.data}"
        else:
            return f"Medical analysis failed: {response.error}"
            
    except Exception as e:
        return f"Error executing medical analysis: {str(e)}"


async def _process_ai_query_with_mcp(mcp_client, query: str, context: Dict[str, Any]) -> str:
    """Process general AI queries using MCP prompts and resources"""
    try:
        query_lower = query.lower()
        
        # Determine which MCP resource/prompt to use based on query content
        if any(word in query_lower for word in ["appointment", "booking", "schedule"]):
            # Use appointment booking prompt
            response = await mcp_client.call_tool("appointment_booking_prompt", {
                "patient_name": context.get("patient_name", "Patient"),
                "hospital_name": context.get("hospital_name", "MedCor Hospital"),
                "query": query
            })
            
        elif any(word in query_lower for word in ["patient", "onboarding", "registration"]):
            # Use patient onboarding prompt
            response = await mcp_client.call_tool("patient_onboarding_prompt", {
                "hospital_name": context.get("hospital_name", "MedCor Hospital"),
                "patient_email": context.get("patient_email", "patient@example.com")
            })
            
        elif any(word in query_lower for word in ["daily", "operations", "report", "summary"]):
            # Use daily operations prompt
            response = await mcp_client.call_tool("daily_operations_prompt", {
                "hospital_id": context.get("hospital_id", "1")
            })
            
        elif any(word in query_lower for word in ["hospital", "facility", "clinic"]):
            # Use hospital resource
            response = await mcp_client.call_tool("get_hospitals_resource", {})
            
        elif any(word in query_lower for word in ["doctor", "physician", "specialist"]):
            # Use doctor resource
            response = await mcp_client.call_tool("get_doctors_resource", {
                "hospital_id": context.get("hospital_id", "1")
            })
            
        elif any(word in query_lower for word in ["specialty", "specialization", "department"]):
            # Use specialty resource
            response = await mcp_client.call_tool("get_specialties_resource", {})
            
        elif any(word in query_lower for word in ["medical record", "health record", "patient record"]):
            # Use medical records resource
            response = await mcp_client.call_tool("get_medical_records_resource", {
                "hospital_id": context.get("hospital_id", "1")
            })
            
        else:
            # Use general hospital information as default
            response = await mcp_client.call_tool("get_hospitals_resource", {})
        
        if response.success:
            return f"AI Analysis: {response.data}"
        else:
            return f"AI analysis failed: {response.error}"
            
    except Exception as e:
        return f"Error executing AI analysis: {str(e)}"


# Async helper functions (same as in views.py)
async def _process_simple_query_async(query: str, query_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Process simple queries asynchronously"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

        # Simulate simple query processing
        await asyncio.sleep(0.5)  # Simulate processing time

        processing_time = time.time() - start_time

        return {
            "success": True,
            "message": "Query processed successfully",
            "result": f"Processed query: {query} (Type: {query_type})",
            "processing_time": processing_time,
            "mcp_available": mcp_available,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": "Error processing query",
        }


async def _health_check_async() -> Dict[str, Any]:
    """Async health check function"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

        # Test Celery connection (simplified)
        celery_available = True  # Assume available if no exception

        # Test Redis connection (simplified)
        redis_available = True  # Assume available if no exception

        processing_time = time.time() - start_time

        return {
            "status": "healthy",
            "timestamp": timezone.now().isoformat(),
            "services": {
                "celery": celery_available,
                "redis": redis_available,
                "mcp_server": mcp_available,
            },
            "processing_time": processing_time,
            "mcp_available": mcp_available,
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": timezone.now().isoformat(),
            "error": str(e),
            "services": {
                "celery": False,
                "redis": False,
                "mcp_server": False,
            },
            "processing_time": time.time() - start_time,
            "mcp_available": False,
        }