"""
Health check views for the MedCor Backend API
"""

import logging

import redis
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def health_check(request):
    """
    Comprehensive health check endpoint
    """
    health_status = {
        "status": "healthy",
        "timestamp": None,
        "version": "1.0.0",
        "services": {},
    }

    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["services"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful",
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
        }
        health_status["status"] = "unhealthy"

    # Check Redis connection
    try:
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        health_status["services"]["redis"] = {
            "status": "healthy",
            "message": "Redis connection successful",
        }
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "unhealthy",
            "message": f"Redis connection failed: {str(e)}",
        }
        health_status["status"] = "unhealthy"

    # Check cache
    try:
        cache.set("health_check", "ok", 10)
        cache_result = cache.get("health_check")
        if cache_result == "ok":
            health_status["services"]["cache"] = {
                "status": "healthy",
                "message": "Cache is working",
            }
        else:
            health_status["services"]["cache"] = {
                "status": "unhealthy",
                "message": "Cache test failed",
            }
            health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["services"]["cache"] = {
            "status": "unhealthy",
            "message": f"Cache test failed: {str(e)}",
        }
        health_status["status"] = "unhealthy"

    # Check YouCam API configuration
    if settings.YOUCAM_API_KEY and settings.YOUCAM_SECRET_KEY:
        health_status["services"]["youcam"] = {
            "status": "configured",
            "message": "YouCam API keys are configured",
        }
    else:
        health_status["services"]["youcam"] = {
            "status": "not_configured",
            "message": "YouCam API keys are not configured",
        }

    # Add timestamp
    from django.utils import timezone

    health_status["timestamp"] = timezone.now().isoformat()

    # Return appropriate HTTP status code
    status_code = 200 if health_status["status"] == "healthy" else 503

    return JsonResponse(health_status, status=status_code)


def readiness_check(request):
    """
    Readiness check for Kubernetes/Docker health checks
    """
    try:
        # Check database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        # Check Redis
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
        redis_client.ping()

        return JsonResponse({"status": "ready"}, status=200)
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JsonResponse({"status": "not_ready", "error": str(e)}, status=503)


def liveness_check(request):
    """
    Liveness check for Kubernetes/Docker health checks
    """
    return JsonResponse({"status": "alive"}, status=200)
