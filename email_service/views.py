"""
Views for the email service app.
"""

import logging

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (OpenApiExample, OpenApiParameter,
                                   extend_schema, extend_schema_view)
from rest_framework import filters, status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import EmailRequest
from .serializers import (EmailRequestDetailSerializer,
                          EmailRequestListSerializer, EmailRequestSerializer)
from .tasks import retry_failed_emails, send_email_task

logger = logging.getLogger(__name__)


@extend_schema(tags=["Email Service"])
@extend_schema_view(
    list=extend_schema(
        summary="List Email Requests",
        description="Retrieve a list of all email requests with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by status (PENDING, PROCESSING, SENT, FAILED, CANCELLED)",
            ),
            OpenApiParameter(
                name="email",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by email address",
            ),
            OpenApiParameter(
                name="has_attachment",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by whether email has file attachment",
            ),
        ],
        examples=[
            OpenApiExample(
                "Pending Requests",
                value={"status": "PENDING"},
                description="Filter to show only pending email requests",
            ),
            OpenApiExample(
                "With Attachments",
                value={"has_attachment": True},
                description="Filter to show emails with file attachments",
            ),
        ],
    ),
    create=extend_schema(
        summary="Send Email",
        description="Send a new email with optional file attachment. No authentication required.",
        examples=[
            OpenApiExample(
                "Basic Contact Form",
                value={
                    "full_name": "John Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1-555-123-4567",
                    "job_profession": "Software Engineer",
                    "subject": "General Inquiry",
                    "message": "I would like to know more about your services.",
                },
                description="Basic contact form submission without file attachment",
            ),
            OpenApiExample(
                "With File Attachment",
                value={
                    "full_name": "Jane Smith",
                    "email": "jane.smith@example.com",
                    "phone": "+1-555-987-6543",
                    "job_profession": "Medical Professional",
                    "subject": "Document Review Request",
                    "message": "Please review the attached medical document.",
                    "file_attached": "medical_document.pdf",
                },
                description="Contact form submission with file attachment",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Email Request Details",
        description="Retrieve detailed information about a specific email request.",
    ),
)
class EmailRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing email requests.

    Provides endpoints for sending emails, tracking status, and managing email requests.
    """

    queryset = EmailRequest.objects.all()
    serializer_class = EmailRequestSerializer
    permission_classes = [AllowAny]  # Override global permission setting
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "email"]
    search_fields = ["full_name", "email", "subject", "message"]
    ordering_fields = ["created_at", "sent_at", "full_name", "email"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ["create", "list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_authentication_classes(self):
        """
        Override authentication classes for public endpoints.
        """
        if self.action in ["create", "list", "retrieve"]:
            return []  # No authentication required for public endpoints
        return super().get_authentication_classes()

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == "create":
            return EmailRequestSerializer
        elif self.action == "list":
            return EmailRequestListSerializer
        else:
            return EmailRequestDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new email request and queue it for sending."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the email request
        email_request = serializer.save()

        # Queue the email task
        try:
            task = send_email_task.delay(str(email_request.id))
            email_request.celery_task_id = task.id
            email_request.save()

            logger.info(f"Email task queued successfully: {task.id}")
        except Exception as e:
            logger.error(f"Failed to queue email task: {str(e)}")
            email_request.status = "FAILED"
            email_request.error_message = f"Failed to queue task: {str(e)}"
            email_request.save()

        return Response(
            {
                "message": "Email request created successfully and queued for sending.",
                "email_request_id": email_request.id,
                "status": email_request.status,
                "task_id": email_request.celery_task_id,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Retry Failed Emails",
        description="Retry sending all failed email requests that haven't exceeded max retries.",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def retry_failed(self, request):
        """Retry all failed email requests."""
        try:
            result = retry_failed_emails.delay()
            return Response(
                {"message": "Retry task queued successfully", "task_id": result.id}
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to queue retry task: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        summary="Get Email Statistics",
        description="Retrieve statistics about email requests including counts by status.",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def statistics(self, request):
        """Get email request statistics."""
        total_requests = EmailRequest.objects.count()
        pending_requests = EmailRequest.objects.filter(status="PENDING").count()
        processing_requests = EmailRequest.objects.filter(status="PROCESSING").count()
        sent_requests = EmailRequest.objects.filter(status="SENT").count()
        failed_requests = EmailRequest.objects.filter(status="FAILED").count()
        cancelled_requests = EmailRequest.objects.filter(status="CANCELLED").count()

        # Count requests with attachments
        with_attachments = (
            EmailRequest.objects.filter(file_attached__isnull=False)
            .exclude(file_attached="")
            .count()
        )

        return Response(
            {
                "total_requests": total_requests,
                "pending_requests": pending_requests,
                "processing_requests": processing_requests,
                "sent_requests": sent_requests,
                "failed_requests": failed_requests,
                "cancelled_requests": cancelled_requests,
                "with_attachments": with_attachments,
                "success_rate": (
                    round((sent_requests / total_requests * 100), 2)
                    if total_requests > 0
                    else 0
                ),
            }
        )

    @extend_schema(
        summary="Cancel Email Request",
        description="Cancel a pending or processing email request.",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel an email request."""
        try:
            email_request = self.get_object()

            if email_request.status in ["SENT", "FAILED", "CANCELLED"]:
                return Response(
                    {
                        "error": f"Cannot cancel email request with status: {email_request.status}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email_request.status = "CANCELLED"
            email_request.save()

            return Response(
                {
                    "message": "Email request cancelled successfully",
                    "status": email_request.status,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to cancel email request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
