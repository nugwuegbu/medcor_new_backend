"""
Celery tasks for email service.
"""

import logging
from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from django.db import models
from .models import EmailRequest

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, email_request_id):
    """
    Celery task to send email asynchronously.
    
    Args:
        email_request_id (str): UUID of the EmailRequest instance
    """
    try:
        # Get the email request
        email_request = EmailRequest.objects.get(id=email_request_id)
        
        # Update status to processing
        email_request.status = 'PROCESSING'
        email_request.celery_task_id = self.request.id
        email_request.save()
        
        # Prepare email content
        subject = email_request.subject or 'Contact Form Submission'
        
        # Build message body
        message_body = f"""
New contact form submission from MedCor Healthcare Platform

Contact Information:
- Full Name: {email_request.full_name}
- Email: {email_request.email}
"""
        
        if email_request.phone:
            message_body += f"- Phone: {email_request.phone}\n"
        
        if email_request.job_profession:
            message_body += f"- Job/Profession: {email_request.job_profession}\n"
        
        if email_request.message:
            message_body += f"\nMessage:\n{email_request.message}\n"
        
        message_body += f"\nSubmitted at: {email_request.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}"
        
        # Create email message
        email = EmailMessage(
            subject=subject,
            body=message_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_request.email],  # Send to support team
            reply_to=[email_request.email],  # Reply-to the contact person
        )
        
        # Add file attachment if present
        if email_request.file_attached:
            email.attach_file(email_request.file_attached.path)
            logger.info(f"Attached file: {email_request.file_attached.name}")
        
        # Send email
        email.send(fail_silently=False)
        
        # Update status to sent
        email_request.status = 'SENT'
        email_request.sent_at = timezone.now()
        email_request.save()
        
        logger.info(f"Email sent successfully for request {email_request_id}")
        
        return {
            'status': 'success',
            'email_request_id': email_request_id,
            'sent_at': email_request.sent_at.isoformat()
        }
        
    except EmailRequest.DoesNotExist:
        logger.error(f"EmailRequest with id {email_request_id} not found")
        raise self.retry(countdown=60, max_retries=3)
        
    except Exception as exc:
        logger.error(f"Error sending email for request {email_request_id}: {str(exc)}")
        
        # Update status to failed
        try:
            email_request = EmailRequest.objects.get(id=email_request_id)
            email_request.status = 'FAILED'
            email_request.error_message = str(exc)
            email_request.retry_count += 1
            email_request.save()
        except EmailRequest.DoesNotExist:
            pass
        
        # Retry the task
        raise self.retry(countdown=60, max_retries=3)


@shared_task
def retry_failed_emails():
    """
    Task to retry failed email requests.
    """
    failed_requests = EmailRequest.objects.filter(
        status='FAILED',
        retry_count__lt=models.F('max_retries')
    )
    
    for request in failed_requests:
        send_email_task.delay(str(request.id))
        logger.info(f"Retrying failed email request: {request.id}")
    
    return f"Retried {failed_requests.count()} failed email requests"


@shared_task
def cleanup_old_email_requests():
    """
    Task to cleanup old email requests (older than 90 days).
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=90)
    old_requests = EmailRequest.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['SENT', 'FAILED']
    )
    
    count = old_requests.count()
    old_requests.delete()
    
    logger.info(f"Cleaned up {count} old email requests")
    return f"Cleaned up {count} old email requests" 