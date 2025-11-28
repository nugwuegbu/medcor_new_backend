"""
Middleware for hospital context extraction and validation
"""

import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.http import HttpRequest

User = get_user_model()
logger = logging.getLogger(__name__)


class HospitalContextMiddleware:
    """
    Middleware to extract and validate hospital context from authenticated users
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        # Extract hospital context from user
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if hasattr(user, 'hospital') and user.hospital:
                request.hospital_id = str(user.hospital.id)
                request.hospital = user.hospital
                logger.debug(f"Hospital context set for user {user.id}: {request.hospital_id}")
            else:
                request.hospital_id = None
                request.hospital = None
                logger.warning(f"No hospital context for user {user.id}")
        else:
            request.hospital_id = None
            request.hospital = None

        response = self.get_response(request)
        return response


def get_hospital_context_from_request(request) -> Optional[str]:
    """Extract hospital ID from request context"""
    return getattr(request, 'hospital_id', None)


def get_hospital_from_request(request):
    """Extract hospital object from request context"""
    return getattr(request, 'hospital', None)