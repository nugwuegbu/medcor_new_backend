"""
Management command to test email functionality.
"""

from django.core.management.base import BaseCommand
from email_service.models import EmailRequest
from email_service.tasks import send_email_task


class Command(BaseCommand):
    help = 'Test email functionality by creating a test email request'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@example.com',
            help='Email address to send test email to'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Test User',
            help='Full name for the test email'
        )

    def handle(self, *args, **options):
        self.stdout.write('Creating test email request...')
        
        # Create a test email request
        email_request = EmailRequest.objects.create(
            full_name=options['name'],
            email=options['email'],
            phone='+1-555-123-4567',
            job_profession='Test Professional',
            subject='Test Email from MedCor',
            message='This is a test email to verify the email service is working correctly.'
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created email request with ID: {email_request.id}')
        )
        
        # Queue the email task
        try:
            task = send_email_task.delay(str(email_request.id))
            self.stdout.write(
                self.style.SUCCESS(f'Email task queued successfully: {task.id}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to queue email task: {str(e)}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Test email request created and queued successfully!')
        ) 