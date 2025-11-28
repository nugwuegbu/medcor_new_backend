"""
Serializers for LangChain AI API endpoints
"""

from rest_framework import serializers


class QueryRequestSerializer(serializers.Serializer):
    """Serializer for general query requests"""

    query = serializers.CharField(
        max_length=2000, help_text="The user's query or prompt"
    )
    query_type = serializers.ChoiceField(
        choices=[
            ("general", "General"),
            ("medical", "Medical"),
            ("database", "Database"),
            ("code", "Code Analysis"),
            ("system", "System Troubleshooting"),
        ],
        default="general",
        help_text="Type of query to process",
    )
    context = serializers.DictField(
        required=False, allow_empty=True, help_text="Additional context for the query"
    )
    use_celery = serializers.BooleanField(
        default=False,
        help_text="Whether to use Celery for processing (for complex queries)",
    )


class MedicalQueryRequestSerializer(serializers.Serializer):
    """Serializer for medical-specific queries"""

    medical_data = serializers.CharField(
        max_length=5000, help_text="Medical data or query to analyze"
    )
    analysis_type = serializers.ChoiceField(
        choices=[
            ("general", "General Analysis"),
            ("diagnosis", "Diagnosis Support"),
            ("treatment", "Treatment Planning"),
            ("monitoring", "Patient Monitoring"),
            ("research", "Research Analysis"),
        ],
        default="general",
        help_text="Type of medical analysis to perform",
    )
    patient_id = serializers.CharField(
        required=False, allow_blank=True, help_text="Patient ID (if applicable)"
    )


class DatabaseQueryRequestSerializer(serializers.Serializer):
    """Serializer for database query requests"""

    query = serializers.CharField(
        max_length=2000, help_text="SQL query or database request"
    )
    database = serializers.CharField(
        max_length=100, default="default", help_text="Database name to query"
    )


class TaskStatusSerializer(serializers.Serializer):
    """Serializer for task status responses"""

    status = serializers.CharField(help_text="Current status of the task")
    message = serializers.CharField(required=False, help_text="Status message")
    progress = serializers.IntegerField(
        required=False, help_text="Progress percentage (0-100)"
    )
    result = serializers.DictField(
        required=False, help_text="Task result (if completed)"
    )
    error = serializers.CharField(required=False, help_text="Error message (if failed)")


class QueryResponseSerializer(serializers.Serializer):
    """Serializer for query responses"""

    success = serializers.BooleanField(
        help_text="Whether the query was processed successfully"
    )
    response = serializers.CharField(help_text="The AI's response to the query")
    query_type = serializers.CharField(help_text="Type of query that was processed")
    tools_used = serializers.ListField(
        child=serializers.CharField(), help_text="List of tools that were used"
    )
    processing_time = serializers.FloatField(
        required=False, help_text="Time taken to process the query in seconds"
    )
    mcp_available = serializers.BooleanField(
        required=False, help_text="Whether MCP server is available"
    )
    error = serializers.CharField(
        required=False, allow_blank=True, help_text="Error message if the query failed"
    )


class TaskSubmissionSerializer(serializers.Serializer):
    """Serializer for task submission responses"""

    task_id = serializers.CharField(
        help_text="Unique identifier for the submitted task"
    )
    status = serializers.CharField(help_text="Current status of the task")
    message = serializers.CharField(help_text="Status message")
    estimated_time = serializers.CharField(
        help_text="Estimated time to complete the task"
    )


class HealthCheckSerializer(serializers.Serializer):
    """Serializer for health check responses"""

    status = serializers.CharField(help_text="Overall status of the service")
    mcp_available = serializers.BooleanField(
        help_text="Whether MCP server is available"
    )
    celery_available = serializers.BooleanField(
        help_text="Whether Celery workers are available"
    )
    timestamp = serializers.DateTimeField(
        help_text="When the health check was performed"
    )
    error = serializers.CharField(
        required=False, help_text="Error message if health check failed"
    )
