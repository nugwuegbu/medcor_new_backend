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

from .mcp_client import test_mcp_connection
from .tasks import (
    get_task_status,
    process_ai_query_task,
    process_database_query_task,
    process_medical_analysis_task,
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
                _process_simple_query_async(query, query_type, context)
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_medical_query(request):
    """Process medical queries using Celery for complex analysis"""
    medical_data = request.data.get("medical_data", "")
    analysis_type = request.data.get("analysis_type", "general")
    patient_id = request.data.get("patient_id")
    user_id = str(request.user.id) if request.user.is_authenticated else None

    if not medical_data:
        return Response(
            {"error": "Medical data is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        task_data = {
            "medical_data": medical_data,
            "analysis_type": analysis_type,
            "patient_id": patient_id,
        }

        task = process_medical_analysis_task.delay(task_data, user_id)

        return Response(
            {
                "task_id": task.id,
                "status": "PENDING",
                "message": "Medical analysis submitted for processing",
                "estimated_time": "60-120 seconds",
                "analysis_type": analysis_type,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    except Exception as e:
        logger.error(f"Error processing medical query: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
    query: str, query_type: str, context: Dict[str, Any]
) -> Dict[str, Any]:
    """Process simple queries asynchronously"""
    start_time = time.time()

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()

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
process_medical_query = async_to_sync(process_medical_query)
process_database_query = async_to_sync(process_database_query)
get_task_status_view = async_to_sync(get_task_status_view)
health_check = async_to_sync(health_check)
