# Celery and Async AI Integration

This document describes the implementation of Celery and async request handling for the LangChain AI integration with MCP server in the MedCor healthcare platform.

## Architecture Overview

The system uses a hybrid approach combining:
- **Async Requests** - For real-time, simple queries (< 500 characters)
- **Celery Tasks** - For complex, long-running operations (> 500 characters or complex queries)

```
User Request → Decision Logic → Async Processing OR Celery Task
                                    ↓                    ↓
                            Real-time Response    Background Processing
                                    ↓                    ↓
                            Immediate Response    Task Status Tracking
```

## Decision Logic

### When to Use Async Processing:
- Simple queries (< 500 characters)
- Real-time responses needed
- Basic database queries (no JOINs, GROUP BY, etc.)
- Health checks and status monitoring
- Tool availability checks

### When to Use Celery Tasks:
- Complex queries (> 500 characters)
- Medical data analysis
- Complex database queries with JOINs, GROUP BY, etc.
- Code analysis
- Long-running operations (> 30 seconds)
- Operations requiring multiple tool calls

## API Endpoints

### Base URL
```
/api/ai/
```

### 1. General Query Processing
```http
POST /api/ai/query/
Content-Type: application/json
Authorization: Bearer <token>

{
    "query": "Your question or request",
    "query_type": "general|medical|database|code|system",
    "context": {
        "additional": "context data"
    },
    "use_celery": false
}
```

**Response (Async):**
```json
{
    "success": true,
    "response": "AI response text",
    "query_type": "general",
    "tools_used": ["mcp_tool"],
    "processing_time": 0.5,
    "mcp_available": true
}
```

**Response (Celery):**
```json
{
    "task_id": "uuid-task-id",
    "status": "PENDING",
    "message": "Query submitted for processing",
    "estimated_time": "30-60 seconds"
}
```

### 2. Medical Query Processing
```http
POST /api/ai/medical/
Content-Type: application/json
Authorization: Bearer <token>

{
    "medical_data": "Patient symptoms and data",
    "analysis_type": "general|diagnosis|treatment|monitoring|research",
    "patient_id": "optional_patient_id"
}
```

**Response:**
```json
{
    "task_id": "uuid-task-id",
    "status": "PENDING",
    "message": "Medical analysis submitted for processing",
    "estimated_time": "60-120 seconds",
    "analysis_type": "diagnosis"
}
```

### 3. Database Query Processing
```http
POST /api/ai/database/
Content-Type: application/json
Authorization: Bearer <token>

{
    "query": "SQL query or database request",
    "database": "database_name"
}
```

**Response (Simple Query - Async):**
```json
{
    "success": true,
    "response": "Simple database query executed on medcor_db2",
    "database": "medcor_db2",
    "tools_used": ["db_tool"],
    "processing_time": 0.3,
    "mcp_available": true
}
```

**Response (Complex Query - Celery):**
```json
{
    "task_id": "uuid-task-id",
    "status": "PENDING",
    "message": "Database query submitted for processing",
    "estimated_time": "15-45 seconds",
    "database": "medcor_db2"
}
```

### 4. Task Status Tracking
```http
GET /api/ai/task/{task_id}/status/
Authorization: Bearer <token>
```

**Response:**
```json
{
    "status": "PROGRESS|SUCCESS|FAILURE|PENDING",
    "message": "Status message",
    "progress": 75,
    "result": {
        "success": true,
        "response": "Task result"
    }
}
```

### 5. Health Check
```http
GET /api/ai/health/
```

**Response:**
```json
{
    "status": "healthy|degraded|unhealthy",
    "mcp_available": true,
    "celery_available": true,
    "timestamp": "2024-01-01T12:00:00Z"
}
```

## Celery Tasks

### 1. AI Query Task
```python
@shared_task(bind=True, max_retries=3)
def process_ai_query_task(self, query_data, user_id=None):
    # Processes complex AI queries
    # Updates task status with progress
    # Caches results for retrieval
```

### 2. Medical Analysis Task
```python
@shared_task(bind=True, max_retries=3)
def process_medical_analysis_task(self, medical_data, user_id=None):
    # Processes medical data analysis
    # Handles complex medical queries
    # Maintains patient privacy
```

### 3. Database Query Task
```python
@shared_task(bind=True, max_retries=3)
def process_database_query_task(self, query_data, user_id=None):
    # Executes complex database queries
    # Handles JOINs, GROUP BY, etc.
    # Optimizes query performance
```

### 4. Code Analysis Task
```python
@shared_task(bind=True, max_retries=3)
def process_code_analysis_task(self, code_data, user_id=None):
    # Analyzes code for issues
    # Provides security analysis
    # Suggests optimizations
```

## Task Management

### Task Status States
- **PENDING** - Task is waiting to be processed
- **PROGRESS** - Task is currently being processed
- **SUCCESS** - Task completed successfully
- **FAILURE** - Task failed with error
- **RETRY** - Task is being retried after failure

### Task Progress Tracking
Tasks provide real-time progress updates:
```python
self.update_state(
    state='PROGRESS',
    meta={
        'status': 'Processing query...',
        'progress': 50
    }
)
```

### Result Caching
Completed task results are cached for retrieval:
- AI Query Results: 1 hour cache
- Medical Analysis: 2 hours cache
- Database Queries: 30 minutes cache
- Code Analysis: 30 minutes cache

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8001
MCP_SERVER_TIMEOUT=30

# Celery Configuration (already configured)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Django Settings
```python
# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "2000"))

# MCP Server Configuration
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8001")
MCP_SERVER_TIMEOUT = int(os.getenv("MCP_SERVER_TIMEOUT", "30"))
```

## Performance Characteristics

### Async Processing
- **Response Time**: 0.3-2 seconds
- **Use Case**: Real-time responses
- **Concurrency**: High (async/await)
- **Resource Usage**: Low

### Celery Processing
- **Response Time**: 30-120 seconds
- **Use Case**: Complex operations
- **Concurrency**: Medium (worker-based)
- **Resource Usage**: Medium-High

## Error Handling

### Async Error Handling
```python
try:
    result = await process_async()
    return result
except Exception as e:
    return {
        'success': False,
        'error': str(e),
        'response': "Error processing request"
    }
```

### Celery Error Handling
```python
@shared_task(bind=True, max_retries=3)
def my_task(self, data):
    try:
        # Process data
        return result
    except Exception as exc:
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return {
            'status': 'FAILURE',
            'error': str(exc)
        }
```

## Monitoring and Logging

### Task Monitoring
- Task status tracking
- Progress monitoring
- Error logging
- Performance metrics

### Logging Configuration
```python
LOGGING = {
    'loggers': {
        'langchain_ai': {
            'level': 'INFO',
            'handlers': ['console', 'file']
        },
        'celery': {
            'level': 'INFO',
            'handlers': ['console', 'file']
        }
    }
}
```

## Testing

### Run Integration Tests
```bash
python scripts/test-celery-async-integration.py
```

### Test Coverage
- Async processing capabilities
- Celery task submission and execution
- Task status tracking
- API endpoint functionality
- Performance comparison
- Error handling

## Deployment Considerations

### Production Setup
1. **Celery Workers**: Deploy multiple workers for scalability
2. **Redis**: Use Redis for message broker and result backend
3. **Monitoring**: Set up monitoring for task queues and workers
4. **Scaling**: Scale workers based on task volume

### Health Checks
- MCP server availability
- Celery worker status
- Redis connectivity
- Task queue health

## Best Practices

### When to Use Each Approach
1. **Use Async for**:
   - Simple queries
   - Real-time responses
   - Health checks
   - Status monitoring

2. **Use Celery for**:
   - Complex operations
   - Long-running tasks
   - Resource-intensive operations
   - Operations requiring retry logic

### Performance Optimization
1. **Async**: Use connection pooling, limit concurrent requests
2. **Celery**: Optimize worker count, use task routing
3. **Caching**: Cache results appropriately
4. **Monitoring**: Monitor performance and adjust accordingly

## Troubleshooting

### Common Issues
1. **Celery Workers Not Running**
   - Check worker status: `celery -A medcor_backend2 status`
   - Restart workers: `sudo systemctl restart celery`

2. **Task Stuck in PENDING**
   - Check Redis connectivity
   - Verify worker availability
   - Check task queue

3. **Async Requests Timing Out**
   - Check MCP server availability
   - Verify network connectivity
   - Increase timeout settings

### Debug Commands
```bash
# Check Celery status
celery -A medcor_backend2 status

# Check Redis
redis-cli ping

# Check MCP server
curl http://localhost:8001/health

# Run tests
python scripts/test-celery-async-integration.py
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Input Validation**: All inputs are validated using serializers
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Data Privacy**: Medical data handling follows privacy regulations
5. **Task Isolation**: Tasks run in isolated worker processes

## Future Enhancements

1. **Streaming Responses**: Support for streaming responses
2. **Task Prioritization**: Priority-based task processing
3. **Advanced Monitoring**: Detailed performance metrics
4. **Auto-scaling**: Automatic worker scaling based on load
5. **Task Scheduling**: Scheduled task execution