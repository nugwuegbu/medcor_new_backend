# Intelligent Query Processing

## Overview

The LangChain AI service now features **Intelligent Query Processing** that automatically detects the type of user query and switches between appropriate tools (AI Analysis, Database Querying, or Medical Analysis) without requiring users to specify the tool manually.

## Key Features

### 🧠 **Automatic Query Type Detection**

- **AI Analysis**: General knowledge questions, explanations, comparisons
- **Database Query**: Data retrieval, patient records, appointments, statistics
- **Medical Analysis**: Clinical questions, symptoms, treatments, medical conditions

### 🎯 **Smart Tool Selection**

The system uses keyword analysis and heuristics to determine the most appropriate tool:

#### Database Query Indicators

- "Show me", "List", "Find", "Get", "Select", "Retrieve"
- "Patients with", "Appointments", "Records", "Data"
- "All patients", "Today's", "This week", "Statistics"
- SQL keywords: "query", "database", "table"

#### Medical Query Indicators

- "Symptoms", "Diagnosis", "Treatment", "Medicine", "Drug"
- "Patient presents", "Medical condition", "Disease"
- "Clinical", "Pathology", "Prognosis", "Side effects"
- Medical context: "patient", "doctor", "hospital", "clinic"

#### AI Query Indicators

- "What is", "How to", "Explain", "Describe", "Tell me about"
- "Why", "When", "Where", "Who", "Which", "Can you"
- "Help me understand", "Difference between", "Compare"

### 📊 **Confidence Scoring**

Each query type detection includes a confidence score (0-1) indicating how certain the system is about the classification.

## API Endpoints

### `POST /api/ai/query/` - Intelligent Query Processing

**Description**: Single endpoint that automatically processes any type of query using the most appropriate tool.

**Request Body**:

```json
{
  "query": "What are the symptoms of diabetes?",
  "query_type": "auto", // Optional: "auto", "ai", "database", "medical"
  "use_celery": false, // Optional: true for background processing
  "database": "default" // Optional: database name for database queries
}
```

**Response**:

```json
{
  "success": true,
  "message": "Query processed using medical_analysis",
  "result": "Medical Analysis: Based on the query...",
  "query_type_detected": "medical",
  "tool_used": "medical_analysis",
  "processing_time": 0.5,
  "confidence": 0.85,
  "task_id": "uuid-here" // Only for background processing
}
```

### `POST /api/ai/medical/` - Specialized Medical Analysis

**Description**: Dedicated endpoint for complex medical analysis that always uses Celery for background processing.

### `GET /api/ai/health/` - Service Health Check

**Description**: Check the health status of the AI service and its dependencies.

### `GET /api/ai/task/{task_id}/status/` - Task Status

**Description**: Get the status and result of background processing tasks.

## Usage Examples

### Example 1: Medical Question

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "What are the symptoms of diabetes?"}'
```

**Result**: Automatically detected as medical query, uses medical analysis tool.

### Example 2: Database Query

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Show me all patients with diabetes"}'
```

**Result**: Automatically detected as database query, uses database querying tool.

### Example 3: General AI Question

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "What is machine learning?"}'
```

**Result**: Automatically detected as AI query, uses AI analysis tool.

### Example 4: Background Processing

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "Analyze all patient records for diabetes trends",
    "use_celery": true
  }'
```

**Result**: Submitted for background processing, returns task ID for status tracking.

## Benefits

### 🚀 **Simplified API**

- Single endpoint for all query types
- No need to choose between AI/Database/Medical endpoints
- Automatic tool selection

### 🎯 **Improved User Experience**

- Natural language queries work seamlessly
- Intelligent routing based on query content
- Confidence scoring for transparency

### ⚡ **Flexible Processing**

- Real-time responses for simple queries
- Background processing for complex operations
- Task status tracking for long-running operations

### 🔧 **Developer Friendly**

- Comprehensive OpenAPI documentation
- Clear response schemas
- Detailed error handling

## Configuration

The intelligent query processing can be configured through the following settings:

- **Query Type Detection**: Keyword-based heuristics (customizable)
- **Confidence Thresholds**: Minimum confidence for auto-detection
- **Default Tool**: Fallback tool when detection is uncertain
- **Processing Timeouts**: Limits for real-time vs background processing

## Monitoring

The system provides detailed monitoring through:

- **Health Check Endpoint**: Service status and dependencies
- **Task Status Tracking**: Background job monitoring
- **Confidence Metrics**: Query type detection accuracy
- **Processing Times**: Performance monitoring

## Future Enhancements

- **Machine Learning**: Train models for better query type detection
- **Custom Rules**: User-defined detection patterns
- **Multi-tool Queries**: Queries that span multiple tools
- **Query History**: Learning from past query patterns
- **Advanced Analytics**: Query pattern analysis and optimization

---

Visit the [Swagger Documentation](http://localhost:8000/api/docs/) for interactive API testing and complete schema details.
