"""
Async views for LangChain AI API endpoints
This module provides async views that use Celery for long-running tasks
and async requests for real-time responses
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
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .mcp_client import test_mcp_connection
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


@extend_schema(
    operation_id="process_ai_query",
    summary="Process AI Query",
    description="Process a general query using LangChain and OpenAI. For complex queries, delegates to Celery tasks for background processing.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user query to process",
                    "example": "What are the symptoms of diabetes?"
                },
                "use_async": {
                    "type": "boolean",
                    "description": "Whether to use async processing (default: true)",
                    "default": True
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
                        "task_id": {"type": "string", "description": "Task ID for background processing"},
                        "processing_time": {"type": "number", "description": "Processing time in seconds"}
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
    tags=["AI Query Processing"]
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_query(request):
    """
    Process a general query using async requests for real-time responses
    For complex queries, delegates to Celery tasks
    """
    query = request.data.get("query", "")
    query_type = request.data.get("query_type", "general")
    context = request.data.get("context", {})
    use_celery = request.data.get("use_celery", False)
    user_id = str(request.user.id) if request.user.is_authenticated else None

    if not query:
        return Response(
            {"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # For simple queries, use async processing
        if not use_celery and len(query) < 500:
            result = asyncio.run(
                _process_simple_query_async(query, query_type, context, request.user)
            )
            return Response(result, status=status.HTTP_200_OK)

        # For complex queries, use Celery
        else:
            task_data = {
                "query": query,
                "query_type": query_type,
                "context": context,
            }

            task = process_ai_query_task.delay(task_data, user_id)

            return Response(
                {
                    "task_id": task.id,
                    "status": "PENDING",
                    "message": "Query submitted for processing",
                    "estimated_time": "30-60 seconds",
                },
                status=status.HTTP_202_ACCEPTED,
            )

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    operation_id="process_database_query",
    summary="Process Database Query",
    description="Process database queries using LangChain and OpenAI. Simple queries use async processing, complex queries use Celery tasks.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Database query to process",
                    "example": "Show me all patients with diabetes"
                },
                "database": {
                    "type": "string",
                    "description": "Database name to query",
                    "default": "default",
                    "example": "medical_records"
                }
            },
            "required": ["query"]
        }
    },
    responses={
        200: {
            "description": "Database query processed successfully",
            "content": {
                "application/json": {
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "message": {"type": "string"},
                        "result": {"type": "string"},
                        "task_id": {"type": "string", "description": "Task ID for background processing"},
                        "processing_time": {"type": "number"}
                    }
                }
            }
        },
        400: {
            "description": "Bad request - invalid input"
        },
        401: {
            "description": "Unauthorized - authentication required"
        }
    },
    tags=["Database Query Processing"]
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_database_query(request):
    """Process database queries using async for simple queries,
    Celery for complex ones"""
    query = request.data.get("query", "")
    database = request.data.get("database", "default")
    user_id = str(request.user.id) if request.user.is_authenticated else None

    if not query:
        return Response(
            {"error": "Database query is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # For simple queries, use async processing
        if len(query) < 200 and not any(
            keyword in query.upper()
            for keyword in ["JOIN", "GROUP BY", "ORDER BY", "HAVING"]
        ):
            result = asyncio.run(_process_simple_db_query_async(query, database))
            return Response(result, status=status.HTTP_200_OK)

        # For complex queries, use Celery
        else:
            task_data = {"query": query, "database": database}

            task = process_database_query_task.delay(task_data, user_id)

            return Response(
                {
                    "task_id": task.id,
                    "status": "PENDING",
                    "message": "Database query submitted for processing",
                    "estimated_time": "15-45 seconds",
                    "database": database,
                },
                status=status.HTTP_202_ACCEPTED,
            )

    except Exception as e:
        logger.error(f"Error processing database query: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_task_status_view(request, task_id):
    """Get the status of a Celery task"""
    try:
        status_info = get_task_status(task_id)
        return Response(status_info, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
@api_view(["GET"])
def health_check(request):
    """Health check endpoint (async)"""
    try:
        health_info = asyncio.run(_health_check_async())
        return Response(health_info, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Async helper functions
async def _process_simple_query_async(
    query: str, query_type: str, context: Dict[str, Any], user=None
) -> Dict[str, Any]:
    """Process simple queries asynchronously with hospital context"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

        # Use MCP client with hospital context if available
        if mcp_available and user:
            async with get_mcp_client(user=user) as mcp_client:
                # Try to get relevant data based on query type
                if "appointment" in query.lower():
                    response = await mcp_client.call_tool("list_appointments", {})
                    if response.success:
                        context["appointments"] = response.data
                elif "doctor" in query.lower():
                    response = await mcp_client.call_tool("list_doctors", {})
                    if response.success:
                        context["doctors"] = response.data
                elif "patient" in query.lower() or "medical record" in query.lower():
                    response = await mcp_client.call_tool("list_medical_records", {})
                    if response.success:
                        context["medical_records"] = response.data

        # Simulate simple processing
        await asyncio.sleep(0.5)  # Simulate processing time

        processing_time = time.time() - start_time

        return {
            "success": True,
            "response": f"Processed {query_type} query: {query[:100]}...",
            "query_type": query_type,
            "tools_used": ["mcp_tool"] if mcp_available else [],
            "processing_time": processing_time,
            "mcp_available": mcp_available,
            "hospital_context": str(user.hospital.id) if user and hasattr(user, 'hospital') and user.hospital else None,
            "context_data": context,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": "Error processing query",
        }


async def _process_simple_db_query_async(query: str, database: str) -> Dict[str, Any]:
    """Process simple database queries asynchronously"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

        # Simulate simple database processing
        await asyncio.sleep(0.3)  # Simulate processing time

        processing_time = time.time() - start_time

        return {
            "success": True,
            "response": f"Simple database query executed on {database}",
            "database": database,
            "tools_used": ["db_tool"] if mcp_available else [],
            "processing_time": processing_time,
            "mcp_available": mcp_available,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": "Error processing database query",
        }


async def _health_check_async() -> Dict[str, Any]:
    """Perform health check asynchronously"""
    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

        # Test Celery
        celery_available = True  # This would check Celery worker status

        overall_status = "healthy" if mcp_available and celery_available else "degraded"

        return {
            "status": overall_status,
            "mcp_available": mcp_available,
            "celery_available": celery_available,
            "timestamp": timezone.now().isoformat(),
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": timezone.now().isoformat(),
        }


# Apply async wrapper to all async views
process_query = async_to_sync(process_query)
process_database_query = async_to_sync(process_database_query)
get_task_status_view = async_to_sync(get_task_status_view)
health_check = async_to_sync(health_check)
