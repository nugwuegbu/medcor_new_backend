"""
Admin configuration for email service app.
"""

from django.contrib import admin
from .models import EmailRequest


@admin.register(EmailRequest)
class EmailRequestAdmin(admin.ModelAdmin):
    """Admin for EmailRequest model."""
    
    list_display = [  
        'full_name', 'email', 'phone', 'status', 'has_attachment',
        'created_at', 'sent_at'
    ]
    list_filter = [
        'status', 'created_at', 'sent_at'
    ]
    search_fields = [
        'full_name', 'email', 'phone', 'subject', 'message'
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'sent_at', 'celery_task_id',
        'has_attachment', 'is_completed', 'can_retry'
    ]
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('full_name', 'email', 'phone', 'job_profession')
        }),
        ('Email Content', {
            'fields': ('subject', 'message', 'file_attached')
        }),
        ('Status & Tracking', {
            'fields': ('status', 'error_message', 'retry_count', 'max_retries')
        }),
        ('Task Information', {
            'fields': ('celery_task_id',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'sent_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_attachment(self, obj):
        """Display whether email has attachment."""
        return obj.has_attachment
    has_attachment.boolean = True
    has_attachment.short_description = 'Has Attachment'
    
    def is_completed(self, obj):
        """Display whether email request is completed."""
        return obj.is_completed
    is_completed.boolean = True
    is_completed.short_description = 'Completed'
    
    def can_retry(self, obj):
        """Display whether email can be retried."""
        return obj.can_retry
    can_retry.boolean = True
    can_retry.short_description = 'Can Retry'
    
    actions = ['retry_failed_emails', 'mark_as_sent']
    
    def retry_failed_emails(self, request, queryset):
        """Retry failed email requests."""
        failed_emails = queryset.filter(status='FAILED')
        count = 0
        
        for email_request in failed_emails:
            if email_request.can_retry:
                from .tasks import send_email_task
                task = send_email_task.delay(str(email_request.id))
                email_request.celery_task_id = task.id
                email_request.save()
                count += 1
        
        self.message_user(
            request,
            f'Successfully queued {count} failed emails for retry.'
        )
    retry_failed_emails.short_description = "Retry failed emails"
    
    def mark_as_sent(self, request, queryset):
        """Mark selected email requests as sent."""
        updated = queryset.update(status='SENT')
        self.message_user(
            request,
            f'Successfully marked {updated} email requests as sent.'
        )
    mark_as_sent.short_description = "Mark as sent" 