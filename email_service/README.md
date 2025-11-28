# Email Service for MedCor Healthcare Platform

This app provides a comprehensive email service with file attachment support, asynchronous processing using Celery, and RabbitMQ as the message broker.

## Features

- **Contact Form Endpoint**: Accepts contact form submissions with optional file attachments
- **Asynchronous Processing**: Uses Celery for background email processing
- **File Attachments**: Supports file uploads with automatic email attachment
- **Status Tracking**: Tracks email status (Pending, Processing, Sent, Failed, Cancelled)
- **Retry Mechanism**: Automatic retry for failed emails with configurable retry limits
- **Admin Interface**: Full Django admin integration for managing email requests
- **API Documentation**: Complete Swagger/OpenAPI documentation

## API Endpoints

### Public Endpoints (No Authentication Required)

- `POST /api/email/emails/` - Send email with contact form data
- `GET /api/email/emails/` - List email requests (filtered)
- `GET /api/email/emails/{id}/` - Get email request details
- `GET /api/email/emails/statistics/` - Get email statistics

### Protected Endpoints (Authentication Required)

- `POST /api/email/emails/retry_failed/` - Retry all failed emails
- `POST /api/email/emails/{id}/cancel/` - Cancel email request
- `PUT /api/email/emails/{id}/` - Update email request
- `DELETE /api/email/emails/{id}/` - Delete email request

## Request Payload

```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "job_profession": "Software Engineer",
  "subject": "General Inquiry",
  "message": "I would like to know more about your services.",
  "file_attached": "optional_file.pdf"
}
```

## Email Configuration

The service is configured to use Gmail SMTP with the following settings:

- **SMTP Host**: smtp.gmail.com
- **Port**: 587
- **TLS**: Enabled
- **From Email**: support@tcall.ai
- **Support Email**: support@tcall.ai

## Celery Configuration

- **Broker**: RabbitMQ (amqp://guest:guest@localhost:5672//)
- **Result Backend**: RPC
- **Task Serializer**: JSON
- **Max Retries**: 3
- **Retry Delay**: 60 seconds

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install RabbitMQ

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

**macOS:**

```bash
brew install rabbitmq
brew services start rabbitmq
```

### 3. Run Migrations

```bash
python manage.py makemigrations email_service
python manage.py migrate
```

### 4. Start Celery Worker

```bash
# Start Celery worker
celery -A medcor_backend2 worker --loglevel=info

# Start Celery beat (for scheduled tasks)
celery -A medcor_backend2 beat --loglevel=info
```

### 5. Test Email Functionality

```bash
# Test with default values
python manage.py test_email

# Test with custom email and name
python manage.py test_email --email=your@email.com --name="Your Name"
```

## Usage Examples

### Send Email via API

```bash
curl -X POST https://api.medcor.ai/api/email/emails/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "job_profession": "Software Engineer",
    "subject": "General Inquiry",
    "message": "I would like to know more about your services."
  }'
```

### Send Email with File Attachment

```bash
curl -X POST https://api.medcor.ai/api/email/emails/ \
  -F "full_name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "phone=+1-555-123-4567" \
  -F "job_profession=Software Engineer" \
  -F "subject=Document Review" \
  -F "message=Please review the attached document." \
  -F "file_attached=@document.pdf"
```

## File Upload Configuration

Files are stored in the `media/email_attachments/` directory with the following structure:

```
media/
└── email_attachments/
    └── YYYY/
        └── MM/
            └── DD/
                └── filename.pdf
```

## Monitoring & Management

### Admin Interface

Access the Django admin at `/admin/` to:

- View all email requests
- Monitor email status
- Retry failed emails
- Cancel pending requests
- View email statistics

### Celery Monitoring

Monitor Celery tasks using:

```bash
# Check Celery worker status
celery -A medcor_backend2 inspect active

# Check Celery queue status
celery -A medcor_backend2 inspect stats
```

### Logs

Email service logs are available in:

- Django logs (console)
- Celery worker logs
- Email request status tracking

## Error Handling

The service includes comprehensive error handling:

- **SMTP Errors**: Automatic retry with exponential backoff
- **File Upload Errors**: Validation and error reporting
- **Task Queue Errors**: Fallback mechanisms and status tracking
- **Database Errors**: Transaction rollback and error logging

## Security Features

- **File Type Validation**: Restricts file uploads to safe formats
- **Size Limits**: Configurable file size limits
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Built-in rate limiting for API endpoints

## Performance Considerations

- **Asynchronous Processing**: Non-blocking email sending
- **File Streaming**: Efficient file handling for large attachments
- **Database Indexing**: Optimized queries with proper indexing
- **Task Queuing**: Scalable task distribution with RabbitMQ

## Troubleshooting

### Common Issues

1. **Celery Worker Not Starting**

   - Check RabbitMQ service status
   - Verify broker URL configuration
   - Check Celery worker logs

2. **Email Not Sending**

   - Verify SMTP credentials
   - Check email server connectivity
   - Review Celery task logs

3. **File Upload Failures**
   - Check file size limits
   - Verify file type restrictions
   - Check media directory permissions

### Debug Commands

```bash
# Check email service status
python manage.py shell -c "from email_service.models import EmailRequest; print(f'Total emails: {EmailRequest.objects.count()}')"

# Test Celery connection
python manage.py shell -c "from medcor_backend2.celery import app; print(app.control.inspect().active())"
```

## Contributing

When contributing to the email service:

1. Follow Django coding standards
2. Add comprehensive tests for new features
3. Update API documentation
4. Include error handling for edge cases
5. Test with various file types and sizes

## License

This email service is part of the MedCor Healthcare Platform and is proprietary software.
